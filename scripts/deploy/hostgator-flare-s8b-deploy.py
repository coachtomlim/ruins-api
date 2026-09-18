#!/usr/bin/env python3
"""Bounded WEB-FLARE S8B HostGator deployer. Writes only flare-s8b. No second root."""
from __future__ import annotations

import hashlib
import json
import os
import ssl
import subprocess
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

CPANEL_USER = os.environ.get('CPANEL_USER', 'bennygoh')
CPANEL_HOST = os.environ.get('CPANEL_HOST', 'gator4116.hostgator.com')
TOKEN = os.environ.get('CPANEL_API_TOKEN', '')
PUBLIC_BASE = os.environ.get('FLARE_PUBLIC_BASE', 'https://think-2-thrive.com').rstrip('/')

REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_SHA = 'e6a8e3a4dbe2570fd53b438cfc027a45f95eba76'
SUPABASE_PROJECT_REF = 'qpgwqmduqtqidmhbuclw'

S8B_ROOT = 'public_html/quick-dungeon/flare-s8b'
ALLOWED = (S8B_ROOT,)

# Deployed verbatim from SOURCE_SHA via `git show`. config.js is generated separately (see build_config_js).
GIT_FILES = [
    'public/flare-s8b/index.html',
    'public/flare-s8b/account.css',
    'public/flare-s8b/vendor/supabase.js',
    'public/flare-s8b/account-app.mjs',
    'public/flare-s8b/account-ready-view.mjs',
    'public/flare-s8b/supabase-browser.mjs',
    'public/flare-s8b/account-adapter.mjs',
    'public/flare-s8b/stat-purchase-flow.mjs',
]

HTACCESS = '''DirectoryIndex index.html
AddDefaultCharset UTF-8
AddType text/html .html
AddType text/css .css
AddType text/javascript .js .mjs

<IfModule mod_headers.c>
Header set X-Content-Type-Options "nosniff"
Header set X-Robots-Tag "noindex, nofollow"
</IfModule>

Options -Indexes
'''

FROZEN_FILES = [
    ('public/flare-s2/index.html', '/quick-dungeon/flare-s2/'),
    ('public/flare-s2/stock.mjs', '/quick-dungeon/flare-s2/stock.mjs'),
    ('public/flare-s3/index.html', '/quick-dungeon/flare-s3/'),
    ('public/flare-s3/actors.mjs', '/quick-dungeon/flare-s3/actors.mjs'),
    ('public/flare-s4/index.html', '/quick-dungeon/flare-s4/'),
    ('public/flare-s4/game.mjs', '/quick-dungeon/flare-s4/game.mjs'),
    ('public/flare-s5/index.html', '/quick-dungeon/flare-s5/'),
    ('public/flare-s5/challenge.mjs', '/quick-dungeon/flare-s5/challenge.mjs'),
    ('public/flare-s6/index.html', '/quick-dungeon/flare-s6/'),
    ('public/flare-s6/challenge.mjs', '/quick-dungeon/flare-s6/challenge.mjs'),
    ('public/flare-s7/index.html', '/quick-dungeon/flare-s7/'),
    ('public/flare-s7/challenge.mjs', '/quick-dungeon/flare-s7/challenge.mjs'),
    ('public/flare-s71/index.html', '/quick-dungeon/flare-s71/'),
    ('public/flare-s71/challenge.mjs', '/quick-dungeon/flare-s71/challenge.mjs'),
    ('public/flare-p0/data/catalog.json', '/quick-dungeon/flare-p0/data/catalog.json'),
    ('public/flare-s7/data/game.json', '/quick-dungeon/flare-s7/data/game.json'),
    ('public/flare-s71/rooms.mjs', '/quick-dungeon/flare-s71/rooms.mjs'),
    ('public/flare-s71/game.mjs', '/quick-dungeon/flare-s71/game.mjs'),
    ('public/flare-s71/calibration.mjs', '/quick-dungeon/flare-s71/calibration.mjs'),
    ('public/flare-s71/hero-preview.mjs', '/quick-dungeon/flare-s71/hero-preview.mjs'),
    ('public/flare-s8a/index.html', '/quick-dungeon/flare-s8a/'),
    ('public/flare-s8a/builder.mjs', '/quick-dungeon/flare-s8a/builder.mjs'),
]

ROUTE_SMOKES = [
    ('/q/hiS4', b'RUN THE GAUNTLET'),
    ('/q/Rind', b'RUN THE GAUNTLET'),
    ('/g/MsJ9', b'HOW TO PLAY'),
    ('/h/UvVY', b'HOW TO PLAY'),
    ('/j/UvVY', b'HOW TO PLAY'),
    ('/k/UvVY', b'DUNGEON RUNNER'),
]


def fail(message: str, code: int = 2) -> None:
    print(f'BLOCKED: {message}', file=sys.stderr)
    raise SystemExit(code)


def guard(path: str) -> None:
    norm = path.strip('/')
    if '..' in Path(norm).parts:
        fail(f'unsafe remote path: {path}')
    if not any(norm == root or norm.startswith(root + '/') for root in ALLOWED):
        fail(f'refusing path outside S8B root: {path}')


def headers() -> dict[str, str]:
    if not TOKEN:
        fail('CPANEL_API_TOKEN is not set')
    return {
        'Authorization': f'cpanel {CPANEL_USER}:{TOKEN}',
        'User-Agent': 'QuickDungeonS8BDeploy/1.0',
        'Accept': 'application/json',
    }


def request_json(url: str, *, data: bytes | None = None, extra: dict[str, str] | None = None):
    req = Request(
        url,
        data=data,
        headers={**headers(), **(extra or {})},
        method='POST' if data is not None else 'GET',
    )
    try:
        with urlopen(req, timeout=35, context=ssl.create_default_context()) as response:
            raw = response.read()
    except HTTPError as exc:
        fail(f'cPanel HTTP {exc.code}: {exc.read().decode("utf-8", "replace")[:500]}')
    except URLError as exc:
        fail(f'cPanel connection failed: {exc}')
    try:
        return json.loads(raw.decode())
    except Exception:
        fail(f'cPanel returned non-JSON: {raw[:250]!r}')


def uapi(module: str, function: str, params=None, *, post: bool = False):
    query = urlencode(params or {})
    url = f'https://{CPANEL_HOST}:2083/execute/{module}/{function}'
    if post:
        out = request_json(url, data=query.encode(), extra={'Content-Type': 'application/x-www-form-urlencoded'})
    else:
        out = request_json(url + ('?' + query if query else ''))
    return out


def uapi_ok(module: str, function: str, params=None, *, post: bool = False):
    out = uapi(module, function, params, post=post)
    result = out.get('result', out)
    if not result.get('status'):
        fail(f'UAPI {module}::{function} failed: {result.get("errors") or result}')
    return out


def api2(module: str, function: str, params):
    q = {
        'cpanel_jsonapi_user': CPANEL_USER,
        'cpanel_jsonapi_apiversion': '2',
        'cpanel_jsonapi_module': module,
        'cpanel_jsonapi_func': function,
        **params,
    }
    out = request_json(f'https://{CPANEL_HOST}:2083/json-api/cpanel?{urlencode(q)}')
    result = out.get('cpanelresult', {})
    event = result.get('event', {})
    if not event.get('result'):
        fail(f'cPanel API2 {module}::{function} failed: {event.get("reason") or result}')
    return out


def names(remote_dir: str) -> set[str]:
    out = uapi_ok('Fileman', 'list_files', {'dir': remote_dir, 'show_hidden': '1'})
    data = out.get('result', out).get('data') or []
    if isinstance(data, dict):
        items = [*(data.get('dirs') or []), *(data.get('files') or [])]
    elif isinstance(data, list):
        items = data
    else:
        items = []
    return {str(x.get('file')) for x in items if isinstance(x, dict) and x.get('file')}


def target_state() -> tuple[str, list[str]]:
    """Read-only: ABSENT, PRESENT_EMPTY, or PRESENT_WITH_CONTENT, without ever creating the directory."""
    out = uapi('Fileman', 'list_files', {'dir': S8B_ROOT, 'show_hidden': '1'})
    result = out.get('result', out)
    if not result.get('status'):
        return 'ABSENT', []
    data = result.get('data') or []
    if isinstance(data, dict):
        items = [*(data.get('dirs') or []), *(data.get('files') or [])]
    elif isinstance(data, list):
        items = data
    else:
        items = []
    fnames = sorted(str(x.get('file')) for x in items if isinstance(x, dict) and x.get('file'))
    return ('PRESENT_WITH_CONTENT' if fnames else 'PRESENT_EMPTY'), fnames


def root_for(path: str) -> str:
    norm = path.strip('/')
    for root in ALLOWED:
        if norm == root or norm.startswith(root + '/'):
            return root
    fail(f'no allowed root for {path}')


def ensure_dir(remote_dir: str) -> None:
    guard(remote_dir)
    root = root_for(remote_dir)
    parent = 'public_html'
    for part in Path(root).parts[1:]:
        if part not in names(parent):
            api2('Fileman', 'mkdir', {'path': parent, 'name': part, 'permissions': '0755'})
        parent += '/' + part
    if remote_dir == root:
        return
    for part in Path(remote_dir).relative_to(Path(root)).parts:
        if part not in names(parent):
            api2('Fileman', 'mkdir', {'path': parent, 'name': part, 'permissions': '0755'})
        parent += '/' + part


def save(remote_path: str, content: str) -> None:
    guard(remote_path)
    p = Path(remote_path)
    ensure_dir(p.parent.as_posix())
    uapi_ok(
        'Fileman', 'save_file_content',
        {'dir': p.parent.as_posix(), 'file': p.name, 'content': content, 'from_charset': 'UTF-8', 'to_charset': 'UTF-8'},
        post=True,
    )


def git_bytes(path: str) -> bytes:
    try:
        return subprocess.check_output(['git', '-C', str(REPO_ROOT), 'show', f'{SOURCE_SHA}:{path}'])
    except (FileNotFoundError, subprocess.CalledProcessError):
        fail(f'git source unavailable: {SOURCE_SHA}:{path}')


def verify_source() -> None:
    try:
        subprocess.run(['git', '-C', str(REPO_ROOT), 'cat-file', '-e', SOURCE_SHA + '^{commit}'],
                        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except (FileNotFoundError, subprocess.CalledProcessError):
        fail(f'git/source commit {SOURCE_SHA} unavailable')
    for rel in GIT_FILES:
        git_bytes(rel)  # fails closed if any required file is missing at this exact commit


def build_config_js() -> str:
    url = os.environ.get('S8B_SUPABASE_URL', '')
    key = os.environ.get('S8B_SUPABASE_PUBLISHABLE_KEY', '')
    if not url or not key:
        fail('S8B_SUPABASE_URL and S8B_SUPABASE_PUBLISHABLE_KEY must be set')
    parsed = urlparse(url)
    if parsed.scheme != 'https':
        fail('S8B_SUPABASE_URL must be HTTPS')
    if not parsed.hostname or SUPABASE_PROJECT_REF not in parsed.hostname:
        fail(f'S8B_SUPABASE_URL does not belong to project {SUPABASE_PROJECT_REF}')
    if not key.startswith('sb_publishable_'):
        fail('S8B_SUPABASE_PUBLISHABLE_KEY must start with sb_publishable_')
    for forbidden in ('service_role', 'sb_secret_'):
        if forbidden in key or forbidden in url:
            fail('refusing to deploy privileged credential material into config.js')
    return f'globalThis.__FLARE_S8B_PUBLIC_CONFIG__={{url:{json.dumps(url)},publishableKey:{json.dumps(key)}}};\n'


def public_get(url: str):
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0 QuickDungeonS8BProbe/1.0', 'Cache-Control': 'no-cache'})
    try:
        with urlopen(req, timeout=35, context=ssl.create_default_context()) as response:
            return response.status, response.headers.get_content_type(), response.read(), response.geturl(), dict(response.headers)
    except HTTPError as exc:
        return exc.code, exc.headers.get_content_type(), exc.read(), exc.geturl(), dict(exc.headers)
    except URLError as exc:
        fail(f'public HTTPS check failed for {url}: {exc}')


def expect(url: str, types: set[str], marker: bytes | None = None):
    status, ctype, body, final, hdrs = public_get(url)
    if status != 200:
        fail(f'{url} returned HTTP {status}')
    if not final.startswith('https://'):
        fail(f'{url} did not remain HTTPS')
    if ctype not in types:
        fail(f'{url} MIME {ctype!r}, expected {sorted(types)}')
    if marker and marker not in body:
        fail(f'{url} missing expected marker')
    return body, hdrs


def frozen_gate() -> None:
    for path, public_path in FROZEN_FILES:
        live, _ = expect(PUBLIC_BASE + public_path, {
            'text/html', 'text/javascript', 'application/javascript', 'application/json'
        })
        expected = git_bytes_any_ref(path)
        if hashlib.sha256(live).digest() != hashlib.sha256(expected).digest():
            fail(f'prior/dependency fingerprint changed: {public_path}')
    for public_path, marker in ROUTE_SMOKES:
        expect(PUBLIC_BASE + public_path, {'text/html'}, marker)
    expect(PUBLIC_BASE + '/m/UvVY?from=Tom', {'text/html'}, b'DUNGEON RUNNER')


def git_bytes_any_ref(path: str) -> bytes:
    """Predecessor fingerprints are read from this worktree's checked-out ref (deploy branch tip),
    not from SOURCE_SHA, since predecessor files are untouched history, not S8B deploy content."""
    try:
        return subprocess.check_output(['git', '-C', str(REPO_ROOT), 'show', f'HEAD:{path}'])
    except (FileNotFoundError, subprocess.CalledProcessError):
        fail(f'git predecessor source unavailable: HEAD:{path}')


def target_absence_gate() -> None:
    state, existing = target_state()
    if state != 'ABSENT':
        fail(f'S8B target is not ABSENT ({state}): {existing}')


def deploy() -> None:
    target_absence_gate()
    ensure_dir(S8B_ROOT)
    save(f'{S8B_ROOT}/.htaccess', HTACCESS)
    config_js = build_config_js()
    for rel in GIT_FILES:
        remote_rel = rel.removeprefix('public/flare-s8b/')
        body = git_bytes(rel).decode('utf-8')
        save(f'{S8B_ROOT}/{remote_rel}', body)
    save(f'{S8B_ROOT}/config.js', config_js)


def s8b_gate() -> None:
    base = PUBLIC_BASE + '/quick-dungeon/flare-s8b/'
    expect(base, {'text/html'}, b'DUNGEON RUNNER')
    expect(base, {'text/html'}, b'RUNNER HUB')
    expect(base, {'text/html'}, b'STAGING')
    expect(base + 'account.css', {'text/css'})
    for js_file in ('config.js', 'vendor/supabase.js', 'account-app.mjs', 'account-ready-view.mjs',
                    'supabase-browser.mjs', 'account-adapter.mjs', 'stat-purchase-flow.mjs'):
        expect(base + js_file, {'text/javascript', 'application/javascript'})
    config_body, _ = expect(base + 'config.js', {'text/javascript', 'application/javascript'})
    expected_config = build_config_js().encode('utf-8')
    if config_body != expected_config:
        fail('deployed config.js does not match generated public-config bytes')
    for forbidden in (b'service_role', b'sb_secret_'):
        if forbidden in config_body:
            fail('deployed config.js contains privileged credential material')
    _, hdrs = expect(base, {'text/html'})
    if hdrs.get('X-Robots-Tag') != 'noindex, nofollow':
        fail(f'X-Robots-Tag missing/incorrect: {hdrs.get("X-Robots-Tag")!r}')
    if hdrs.get('X-Content-Type-Options') != 'nosniff':
        fail(f'X-Content-Type-Options missing/incorrect: {hdrs.get("X-Content-Type-Options")!r}')


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) == 2 else ''
    if mode not in {'auth', 'probe', 'deploy'}:
        fail('usage: hostgator-flare-s8b-deploy.py auth|probe|deploy')

    verify_source()
    uapi_ok('Fileman', 'list_files', {'dir': 'public_html'})
    print('AUTH PASS')

    if mode == 'auth':
        return

    state, existing = target_state()
    print(f'S8B TARGET STATE: {state}' + (f' {existing}' if existing else ''))
    if state != 'ABSENT':
        fail(f'S8B target is not ABSENT ({state}); refusing to proceed')

    frozen_gate()
    print('S2-S7.1, S8A, S8A DEPENDENCIES, /q /g /h /j /k /m: FINGERPRINT PASS')

    if mode == 'probe':
        print('PROBE PASS')
        return

    deploy()
    s8b_gate()
    frozen_gate()
    print('TEST PASS')
    print(f'S8B SOURCE: {SOURCE_SHA}')
    print(f'S8B URL: {PUBLIC_BASE}/quick-dungeon/flare-s8b/')
    print('S2-S7.1, S8A, /q /g /h /j /k /m: PRESERVED')


if __name__ == '__main__':
    main()

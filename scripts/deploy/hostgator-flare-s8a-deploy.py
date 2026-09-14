#!/usr/bin/env python3
"""Bounded WEB-FLARE S8A HostGator deployer. Writes only flare-s8a and /m."""
from __future__ import annotations

import hashlib
import json
import os
import ssl
import subprocess
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

CPANEL_USER = os.environ.get('CPANEL_USER', 'bennygoh')
CPANEL_HOST = os.environ.get('CPANEL_HOST', 'gator4116.hostgator.com')
TOKEN = os.environ.get('CPANEL_API_TOKEN', '')
PUBLIC_BASE = os.environ.get('FLARE_PUBLIC_BASE', 'https://think-2-thrive.com').rstrip('/')

REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_SHA = '6962696b84f44e7d15bafb770ade92d8eb0ea42b'
S8A_ROOT = 'public_html/quick-dungeon/flare-s8a'
SHORT_ROOT = 'public_html/m'
ALLOWED = (S8A_ROOT, SHORT_ROOT)
TEXT_EXTS = {'.html', '.css', '.js', '.mjs', '.json', '.txt'}

HTACCESS = '''DirectoryIndex index.html
AddDefaultCharset UTF-8
AddType text/html .html
AddType text/css .css
AddType text/javascript .js .mjs
AddType application/json .json
<IfModule mod_headers.c>
Header set X-Content-Type-Options "nosniff"
</IfModule>
'''

SHORT_HTACCESS = '''RewriteEngine On
RewriteRule ^([A-Za-z0-9_-]{4})/?$ /quick-dungeon/flare-s8a/challenge.html [L]
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


def git_bytes(path: str) -> bytes:
    try:
        return subprocess.check_output(['git', '-C', str(REPO_ROOT), 'show', f'{SOURCE_SHA}:{path}'])
    except (FileNotFoundError, subprocess.CalledProcessError):
        fail(f'git source unavailable: {SOURCE_SHA}:{path}')


def source_files() -> list[str]:
    try:
        raw = subprocess.check_output([
            'git', '-C', str(REPO_ROOT), 'ls-tree', '-r', '--name-only', SOURCE_SHA,
            '--', 'public/flare-s8a'
        ]).decode('utf-8')
    except (FileNotFoundError, subprocess.CalledProcessError):
        fail(f'cannot enumerate S8A source at {SOURCE_SHA}')
    files = [line.strip() for line in raw.splitlines() if line.strip()]
    if not files:
        fail('S8A source tree is empty')
    unsupported = [p for p in files if Path(p).suffix.lower() not in TEXT_EXTS]
    if unsupported:
        fail(f'unsupported non-text S8A deploy files: {unsupported}')
    return files


def verify_source() -> None:
    try:
        subprocess.run([
            'git', '-C', str(REPO_ROOT), 'cat-file', '-e', SOURCE_SHA + '^{commit}'
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        changed = subprocess.run([
            'git', '-C', str(REPO_ROOT), 'diff', '--quiet', SOURCE_SHA, '--', 'public/flare-s8a'
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode
    except (FileNotFoundError, subprocess.CalledProcessError):
        fail(f'git/source commit {SOURCE_SHA} unavailable')
    if changed != 0:
        fail(f'local S8A web tree differs from authorised source {SOURCE_SHA}')


def guard(path: str) -> None:
    norm = path.strip('/')
    if '..' in Path(norm).parts:
        fail(f'unsafe remote path: {path}')
    if not any(norm == root or norm.startswith(root + '/') for root in ALLOWED):
        fail(f'refusing path outside S8A roots: {path}')


def headers() -> dict[str, str]:
    if not TOKEN:
        fail('CPANEL_API_TOKEN is not set')
    return {
        'Authorization': f'cpanel {CPANEL_USER}:{TOKEN}',
        'User-Agent': 'QuickDungeonS8ADeploy/1.0',
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
        out = request_json(
            url,
            data=query.encode(),
            extra={'Content-Type': 'application/x-www-form-urlencoded'},
        )
    else:
        out = request_json(url + ('?' + query if query else ''))
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
    out = uapi('Fileman', 'list_files', {'dir': remote_dir, 'show_hidden': '1'})
    data = out.get('result', out).get('data') or []
    if isinstance(data, dict):
        items = [*(data.get('dirs') or []), *(data.get('files') or [])]
    elif isinstance(data, list):
        items = data
    else:
        items = []
    return {str(x.get('file')) for x in items if isinstance(x, dict) and x.get('file')}


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
    uapi(
        'Fileman', 'save_file_content',
        {
            'dir': p.parent.as_posix(),
            'file': p.name,
            'content': content,
            'from_charset': 'UTF-8',
            'to_charset': 'UTF-8',
        },
        post=True,
    )


def public_get(url: str):
    req = Request(url, headers={
        'User-Agent': 'Mozilla/5.0 QuickDungeonS8AProbe/1.0',
        'Cache-Control': 'no-cache',
    })
    try:
        with urlopen(req, timeout=35, context=ssl.create_default_context()) as response:
            return response.status, response.headers.get_content_type(), response.read(), response.geturl()
    except HTTPError as exc:
        return exc.code, exc.headers.get_content_type(), exc.read(), exc.geturl()
    except URLError as exc:
        fail(f'public HTTPS check failed for {url}: {exc}')


def expect(url: str, types: set[str], marker: bytes | None = None) -> bytes:
    status, ctype, body, final = public_get(url)
    if status != 200:
        fail(f'{url} returned HTTP {status}')
    if not final.startswith('https://'):
        fail(f'{url} did not remain HTTPS')
    if ctype not in types:
        fail(f'{url} MIME {ctype!r}, expected {sorted(types)}')
    if marker and marker not in body:
        fail(f'{url} missing expected marker')
    return body


def frozen_gate() -> None:
    for path, public_path in FROZEN_FILES:
        live = expect(PUBLIC_BASE + public_path, {
            'text/html', 'text/javascript', 'application/javascript', 'application/json'
        })
        expected = git_bytes(path)
        if hashlib.sha256(live).digest() != hashlib.sha256(expected).digest():
            fail(f'prior/dependency fingerprint changed: {public_path}')
    for public_path, marker in ROUTE_SMOKES:
        expect(PUBLIC_BASE + public_path, {'text/html'}, marker)


def deploy() -> None:
    ensure_dir(S8A_ROOT)
    ensure_dir(SHORT_ROOT)
    save(f'{S8A_ROOT}/.htaccess', HTACCESS)
    save(f'{SHORT_ROOT}/.htaccess', SHORT_HTACCESS)
    prefix = 'public/flare-s8a/'
    for rel in source_files():
        remote_rel = rel.removeprefix(prefix)
        body = git_bytes(rel).decode('utf-8')
        save(f'{S8A_ROOT}/{remote_rel}', body)


def s8a_gate() -> None:
    base = PUBLIC_BASE + '/quick-dungeon/flare-s8a/'
    expect(base, {'text/html'}, b'DUNGEON RUNNER')
    expect(base + 'builder.mjs', {'text/javascript', 'application/javascript'}, b'CREATE CHALLENGE LINK')
    expect(base + 'challenge.html', {'text/html'}, b'GET THE HERO TO THE EXIT')
    expect(base + 'challenge.mjs', {'text/javascript', 'application/javascript'}, b'installRuntime')
    expect(base + 'runtime-controller.mjs', {'text/javascript', 'application/javascript'}, b'OVERVIEW')
    expect(base + 'style.css', {'text/css'}, b'[hidden]')
    expect(PUBLIC_BASE + '/m/UvVY?from=Tom', {'text/html'}, b'DUNGEON RUNNER')


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) == 2 else ''
    if mode not in {'auth', 'probe', 'deploy'}:
        fail('usage: hostgator-flare-s8a-deploy.py auth|probe|deploy')

    verify_source()
    uapi('Fileman', 'list_files', {'dir': 'public_html'})
    print('AUTH PASS')

    if mode == 'auth':
        return

    frozen_gate()
    print('S2-S7.1, /q /g /h /j /k, AND S8A DEPENDENCIES: FINGERPRINT PASS')

    if mode == 'probe':
        print('PROBE PASS')
        return

    deploy()
    s8a_gate()
    frozen_gate()
    print('TEST PASS')
    print(f'S8A SOURCE: {SOURCE_SHA}')
    print(f'BUILDER URL: {PUBLIC_BASE}/quick-dungeon/flare-s8a/')
    print(f'S8A INVITE: {PUBLIC_BASE}/m/UvVY?from=Tom')
    print('S2-S7.1 AND /q /g /h /j /k: PRESERVED')


if __name__ == '__main__':
    main()

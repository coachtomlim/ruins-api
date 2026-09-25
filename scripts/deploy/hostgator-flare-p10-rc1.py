#!/usr/bin/env python3
"""Bounded WEB-FLARE P10 Release Candidate 1 HostGator updater. Updates only the verified existing
flare-s8b root. This is a NEW deployment lineage — it does not modify, resurrect, or incrementally
extend the frozen Update 006 helper (scripts/deploy/hostgator-flare-s8b-update-006.py on branch
deploy/web-flare-s8b-hostgator-006), which remains untouched and out of scope.

GIT_FILES/FROZEN_FILES below are generated from docs/release/WEB-FLARE-RC1-MANIFEST.json (the
independently-traced P10 runtime closure — see scripts/release/generate-manifest.mjs), not copied
from any prior update helper's file list.
"""
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
SOURCE_SHA = '0e38d19481809d735bd36f19bf894773974417ea'  # last commit before this helper's final update
PREVIOUS_SHA = '523bfd7ffc46be191ce48b794708cc5af945dcda'  # last commit actually LIVE on production (Update 006)
SUPABASE_PROJECT_REF = 'qpgwqmduqtqidmhbuclw'

S8B_ROOT = 'public_html/quick-dungeon/flare-s8b'
ALLOWED = (S8B_ROOT,)

# Independently traced from the real Hub/Practice/Daily Trial entry points via
# scripts/release/generate-manifest.mjs (docs/release/WEB-FLARE-RC1-MANIFEST.json), filtered to the
# flare-s8b deploy root. NOT copied from Update 006's 19-file list — this is 24 files, correctly
# including the S9 progression views, the deterministic Encounter Advisor (encounter-advisor.mjs,
# replacing the retired ai-encounter-assist.mjs/ai-encounter-provider.mjs), and release-identity.mjs.
GIT_FILES = [
    'public/flare-s8b/account-adapter.mjs',
    'public/flare-s8b/account-app.mjs',
    'public/flare-s8b/account-ready-view.mjs',
    'public/flare-s8b/account.css',
    'public/flare-s8b/encounter-advisor.mjs',
    'public/flare-s8b/builder-progression-view.mjs',
    'public/flare-s8b/daily-login.mjs',
    'public/flare-s8b/daily-trial-app.mjs',
    'public/flare-s8b/daily-trial-runner-catalog.mjs',
    'public/flare-s8b/daily-trial.css',
    'public/flare-s8b/daily-trial.html',
    'public/flare-s8b/daily-trial.mjs',
    'public/flare-s8b/friend-share.mjs',
    'public/flare-s8b/index.html',
    'public/flare-s8b/practice-app.mjs',
    'public/flare-s8b/practice-runner-catalog.mjs',
    'public/flare-s8b/practice-runner-snapshot.mjs',
    'public/flare-s8b/practice.css',
    'public/flare-s8b/practice.html',
    'public/flare-s8b/release-identity.mjs',
    'public/flare-s8b/runner-progression-view.mjs',
    'public/flare-s8b/stat-purchase-flow.mjs',
    'public/flare-s8b/supabase-browser.mjs',
    'public/flare-s8b/vendor/supabase.js',
]

# The Update 006 manifest, preserved verbatim (not derived from GIT_FILES) so the pre-update baseline
# gate checks exactly what is actually live today (the last accepted deployment), not what this
# helper intends to deploy. Every file P10 adds (Encounter Advisor, S9 progression views, release-identity.mjs)
# is deliberately absent here — their absence from the live baseline is what proves it predates P10.
PREVIOUS_GIT_FILES = [
    'public/flare-s8b/index.html',
    'public/flare-s8b/account.css',
    'public/flare-s8b/vendor/supabase.js',
    'public/flare-s8b/account-app.mjs',
    'public/flare-s8b/account-ready-view.mjs',
    'public/flare-s8b/daily-login.mjs',
    'public/flare-s8b/daily-trial.mjs',
    'public/flare-s8b/daily-trial-runner-catalog.mjs',
    'public/flare-s8b/daily-trial-app.mjs',
    'public/flare-s8b/daily-trial.html',
    'public/flare-s8b/daily-trial.css',
    'public/flare-s8b/friend-share.mjs',
    'public/flare-s8b/supabase-browser.mjs',
    'public/flare-s8b/account-adapter.mjs',
    'public/flare-s8b/stat-purchase-flow.mjs',
    'public/flare-s8b/practice-runner-snapshot.mjs',
    'public/flare-s8b/practice-runner-catalog.mjs',
    'public/flare-s8b/practice.html',
    'public/flare-s8b/practice-app.mjs',
    'public/flare-s8b/practice.css',
]

# Pre-update root inventory: the exact Update 006 live/post-deploy state (21 entries). Unchanged from
# Update 006 since no deployment has succeeded since then (WinError 10060 on every attempt).
EXPECTED_ROOT_NAMES = {
    '.htaccess', 'account-adapter.mjs', 'account-app.mjs', 'account-ready-view.mjs', 'account.css',
    'config.js', 'daily-login.mjs', 'daily-trial.mjs', 'daily-trial-runner-catalog.mjs',
    'daily-trial-app.mjs', 'daily-trial.html', 'daily-trial.css', 'friend-share.mjs', 'index.html',
    'practice-app.mjs', 'practice-runner-catalog.mjs', 'practice-runner-snapshot.mjs', 'practice.css',
    'practice.html', 'stat-purchase-flow.mjs', 'supabase-browser.mjs', 'vendor'
}
EXPECTED_VENDOR_NAMES = {'supabase.js'}

# Informational only (not gated pre-deploy): the root inventory this update produces.
EXPECTED_POST_ROOT_NAMES = EXPECTED_ROOT_NAMES | {
    'encounter-advisor.mjs', 'builder-progression-view.mjs',
    'release-identity.mjs', 'runner-progression-view.mjs'
}

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

# Predecessor/dependency fingerprints this deployment must never alter. The flare-s2..s71/s8a portion
# is generated from the actual traced import closure (docs/release/WEB-FLARE-RC1-MANIFEST.json), which
# in several cases differs from what Update 006 fingerprinted (e.g. flare-s7/game.mjs, not
# flare-s7/challenge.mjs) — Update 006's list was not re-derived from a real trace. This list is.
FROZEN_FILES = [
    ('public/flare-s2/index.html', '/quick-dungeon/flare-s2/'),
    ('public/flare-s3/index.html', '/quick-dungeon/flare-s3/'),
    ('public/flare-s4/index.html', '/quick-dungeon/flare-s4/'),
    ('public/flare-s5/index.html', '/quick-dungeon/flare-s5/'),
    ('public/flare-s6/index.html', '/quick-dungeon/flare-s6/'),
    ('public/flare-s7/index.html', '/quick-dungeon/flare-s7/'),
    ('public/flare-s71/index.html', '/quick-dungeon/flare-s71/'),
    ('public/flare-s8a/index.html', '/quick-dungeon/flare-s8a/'),
    ('public/flare-p0/data/catalog.json', '/quick-dungeon/flare-p0/data/catalog.json'),
    ('public/flare-p0/src/core/challenge.mjs', '/quick-dungeon/flare-p0/src/core/challenge.mjs'),
    ('public/flare-p0/src/core/flare.mjs', '/quick-dungeon/flare-p0/src/core/flare.mjs'),
    ('public/flare-p0/src/core/navigation.mjs', '/quick-dungeon/flare-p0/src/core/navigation.mjs'),
    ('public/flare-p0/src/core/simulation.mjs', '/quick-dungeon/flare-p0/src/core/simulation.mjs'),
    ('public/flare-p0/src/view/renderer.mjs', '/quick-dungeon/flare-p0/src/view/renderer.mjs'),
    ('public/flare-s2/core.mjs', '/quick-dungeon/flare-s2/core.mjs'),
    ('public/flare-s2/stock.mjs', '/quick-dungeon/flare-s2/stock.mjs'),
    ('public/flare-s3/actors.mjs', '/quick-dungeon/flare-s3/actors.mjs'),
    ('public/flare-s4/game.mjs', '/quick-dungeon/flare-s4/game.mjs'),
    ('public/flare-s5/game.mjs', '/quick-dungeon/flare-s5/game.mjs'),
    ('public/flare-s7/actors.mjs', '/quick-dungeon/flare-s7/actors.mjs'),
    ('public/flare-s7/calibration.mjs', '/quick-dungeon/flare-s7/calibration.mjs'),
    ('public/flare-s7/data/game.json', '/quick-dungeon/flare-s7/data/game.json'),
    ('public/flare-s7/game.mjs', '/quick-dungeon/flare-s7/game.mjs'),
    ('public/flare-s7/renderer.mjs', '/quick-dungeon/flare-s7/renderer.mjs'),
    ('public/flare-s7/rooms.mjs', '/quick-dungeon/flare-s7/rooms.mjs'),
    ('public/flare-s7/simulation.mjs', '/quick-dungeon/flare-s7/simulation.mjs'),
    ('public/flare-s71/hero-preview.mjs', '/quick-dungeon/flare-s71/hero-preview.mjs'),
    ('public/flare-s8a/actors.mjs', '/quick-dungeon/flare-s8a/actors.mjs'),
    ('public/flare-s8a/builder-invite.mjs', '/quick-dungeon/flare-s8a/builder-invite.mjs'),
    ('public/flare-s8a/flow.mjs', '/quick-dungeon/flare-s8a/flow.mjs'),
    ('public/flare-s8a/runner-progression.mjs', '/quick-dungeon/flare-s8a/runner-progression.mjs'),
    ('public/flare-s8a/share-copy.mjs', '/quick-dungeon/flare-s8a/share-copy.mjs'),
    ('public/flare-s8a/starter-loadout.mjs', '/quick-dungeon/flare-s8a/starter-loadout.mjs'),
    ('public/flare-s8a/stock-equipment-visuals.mjs', '/quick-dungeon/flare-s8a/stock-equipment-visuals.mjs'),
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
        'User-Agent': 'QuickDungeonP10RC1/1.0',
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


def git_bytes_ref(ref: str, path: str) -> bytes:
    try:
        return subprocess.check_output(['git', '-C', str(REPO_ROOT), 'show', f'{ref}:{path}'])
    except (FileNotFoundError, subprocess.CalledProcessError):
        fail(f'git source unavailable: {ref}:{path}')


def git_bytes(path: str) -> bytes:
    return git_bytes_ref(SOURCE_SHA, path)


def git_text(path: str) -> str:
    return git_bytes(path).decode('utf-8')


def previous_git_bytes(path: str) -> bytes:
    return git_bytes_ref(PREVIOUS_SHA, path)


def git_bytes_any_ref(path: str) -> bytes:
    """Predecessor fingerprints are read from this worktree's checked-out ref (deploy branch tip),
    not from SOURCE_SHA, since predecessor files are untouched history, not S8B deploy content."""
    try:
        return subprocess.check_output(['git', '-C', str(REPO_ROOT), 'show', f'HEAD:{path}'])
    except (FileNotFoundError, subprocess.CalledProcessError):
        fail(f'git predecessor source unavailable: HEAD:{path}')


def verify_source() -> None:
    try:
        subprocess.run(['git', '-C', str(REPO_ROOT), 'cat-file', '-e', SOURCE_SHA + '^{commit}'],
                        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except (FileNotFoundError, subprocess.CalledProcessError):
        fail(f'git/source commit {SOURCE_SHA} unavailable')
    for rel in GIT_FILES:
        git_bytes(rel)  # fails closed if any required file is missing at this exact commit


def deterministic_encounter_advisor_gate() -> None:
    """Static, network-free proof that encounter advice is entirely deterministic and self-contained.
    No AI provider, Edge Function, external inference API, or AI availability path may remain."""
    advisor = git_text('public/flare-s8b/encounter-advisor.mjs')
    app = git_text('public/flare-s8b/practice-app.mjs')
    html = git_text('public/flare-s8b/practice.html')
    forbidden = ('ai-encounter-provider', 'suggest-encounter', 'AI_ENCOUNTER_PROVIDER_KEY',
                 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'AI ASSIST', 'AI SUGGESTION')
    checks = [
        ("deterministic advisor module exists", 'export function adviseEncounter' in advisor),
        ("advisor enumerates legal encounters", 'enumerateLegalEncounters' in advisor),
        ("advisor uses deterministic estimator", 'estimateEncounter' in advisor),
        ("Practice calls deterministic advisor directly", 'adviseEncounter({' in app),
        ("player UI is labelled ENCOUNTER ADVISOR", 'ENCOUNTER ADVISOR' in html),
        ("no external-AI/provider terminology remains in runtime",
         not any(token in advisor or token in app or token in html for token in forbidden)),
    ]
    failed = [label for label, ok in checks if not ok]
    if failed:
        fail('deterministic Encounter Advisor gate failed: ' + '; '.join(failed))

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
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0 QuickDungeonP10Probe/1.0', 'Cache-Control': 'no-cache'})
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
            'text/html', 'text/css', 'text/javascript', 'application/javascript', 'application/json'
        })
        expected = git_bytes_any_ref(path)
        if hashlib.sha256(live).digest() != hashlib.sha256(expected).digest():
            fail(f'prior/dependency fingerprint changed: {public_path}')
    for public_path, marker in ROUTE_SMOKES:
        expect(PUBLIC_BASE + public_path, {'text/html'}, marker)
    expect(PUBLIC_BASE + '/m/UvVY?from=Tom', {'text/html'}, b'DUNGEON RUNNER')


def target_baseline_gate() -> None:
    state, existing = target_state()
    if state != 'PRESENT_WITH_CONTENT':
        fail(f'S8B update baseline missing ({state}): {existing}')
    root_names = names(S8B_ROOT)
    if root_names != EXPECTED_ROOT_NAMES:
        fail(f'S8B root inventory drifted: {sorted(root_names)}')
    vendor_names = names(f'{S8B_ROOT}/vendor')
    if vendor_names != EXPECTED_VENDOR_NAMES:
        fail(f'S8B vendor inventory drifted: {sorted(vendor_names)}')
    base = PUBLIC_BASE + '/quick-dungeon/flare-s8b/'
    for rel in PREVIOUS_GIT_FILES:
        remote_rel = rel.removeprefix('public/flare-s8b/')
        live, _ = expect(base + remote_rel, {'text/html', 'text/css', 'text/javascript', 'application/javascript'})
        expected = previous_git_bytes(rel)
        if hashlib.sha256(live).digest() != hashlib.sha256(expected).digest():
            fail(f'current S8B baseline drifted before update: {remote_rel}')
    config_body, _ = expect(base + 'config.js', {'text/javascript', 'application/javascript'})
    if config_body != build_config_js().encode('utf-8'):
        fail('current S8B config.js drifted before update')
    _, hdrs = expect(base, {'text/html'})
    if hdrs.get('X-Robots-Tag') != 'noindex, nofollow':
        fail('current S8B noindex baseline is missing')
    if hdrs.get('X-Content-Type-Options') != 'nosniff':
        fail('current S8B nosniff baseline is missing')


def deploy() -> None:
    target_baseline_gate()
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
    expect(base, {'text/html'}, b'WEB-FLARE-RC1')
    for js_file in ('config.js', 'vendor/supabase.js', 'account-app.mjs', 'account-ready-view.mjs',
                     'daily-login.mjs', 'daily-trial.mjs', 'daily-trial-runner-catalog.mjs',
                     'daily-trial-app.mjs', 'friend-share.mjs', 'supabase-browser.mjs', 'account-adapter.mjs',
                     'stat-purchase-flow.mjs', 'practice-runner-snapshot.mjs', 'practice-runner-catalog.mjs',
                     'practice-app.mjs', 'encounter-advisor.mjs',
                     'runner-progression-view.mjs', 'builder-progression-view.mjs', 'release-identity.mjs'):
        expect(base + js_file, {'text/javascript', 'application/javascript'})
    expect(base + 'practice.css', {'text/css'})
    expect(base + 'practice.html', {'text/html'}, b'PRACTICE RUN')
    expect(base + 'daily-trial.html', {'text/html'}, b'DAILY TRIAL CLAIMED')
    for rel in GIT_FILES:
        remote_rel = rel.removeprefix('public/flare-s8b/')
        live, _ = expect(base + remote_rel, {'text/html', 'text/css', 'text/javascript', 'application/javascript'})
        expected = git_bytes(rel)
        if hashlib.sha256(live).digest() != hashlib.sha256(expected).digest():
            fail(f'updated S8B byte mismatch: {remote_rel}')
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
        fail('usage: hostgator-flare-p10-rc1.py auth|probe|deploy')

    verify_source()
    deterministic_encounter_advisor_gate()
    print('DETERMINISTIC ENCOUNTER ADVISOR: PASS')
    uapi_ok('Fileman', 'list_files', {'dir': 'public_html'})
    print('AUTH PASS')

    if mode == 'auth':
        return

    state, existing = target_state()
    print(f'S8B TARGET STATE: {state}' + (f' {existing}' if existing else ''))
    target_baseline_gate()
    print('S8B CURRENT LIVE BASELINE (UPDATE 006): VERIFIED')

    frozen_gate()
    print('S2-S7.1, S8A, S8A DEPENDENCIES, /q /g /h /j /k /m: FINGERPRINT PASS')

    if mode == 'probe':
        print('PROBE PASS')
        return

    deploy()
    s8b_gate()
    frozen_gate()
    print('TEST PASS')
    print(f'P10 SOURCE: {SOURCE_SHA}')
    print(f'P10 PREVIOUS LIVE SOURCE: {PREVIOUS_SHA}')
    print(f'P10 URL: {PUBLIC_BASE}/quick-dungeon/flare-s8b/')
    print('S2-S7.1, S8A, /q /g /h /j /k /m: PRESERVED')


if __name__ == '__main__':
    main()

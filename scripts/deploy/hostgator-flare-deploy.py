#!/usr/bin/env python3
"""
HOSTGATOR-FLARE-SETUP-001
Minimal, bounded HostGator/cPanel deployer for Quick Dungeon / WEB-FLARE.

Credentials are read only from environment variables:
  CPANEL_API_TOKEN   required
  CPANEL_USER        default: bennygoh
  CPANEL_HOST        default: gator4116.hostgator.com
  FLARE_PUBLIC_BASE  default: https://think-2-thrive.com

Modes:
  probe   Publish and verify /quick-dungeon-test/
  deploy  Publish and verify /quick-dungeon/flare-s2/

The script refuses to write outside the two isolated public_html roots above.
No GitHub Actions, database, PHP, DNS, subdomain, or production site changes.
"""
from __future__ import annotations

import argparse
import json
import os
import ssl
import sys
import subprocess
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

CPANEL_USER = os.environ.get("CPANEL_USER", "bennygoh")
CPANEL_HOST = os.environ.get("CPANEL_HOST", "gator4116.hostgator.com")
TOKEN = os.environ.get("CPANEL_API_TOKEN", "")
PUBLIC_BASE = os.environ.get("FLARE_PUBLIC_BASE", "https://think-2-thrive.com").rstrip("/")
REPO_ROOT = Path(__file__).resolve().parents[2]
EXPECTED_SOURCE_SHA = "8cc57ddacfc2e12ac65b120496f1ee8915e4525b"

ALLOWED_ROOTS = {
    "probe": "public_html/quick-dungeon-test",
    "deploy": "public_html/quick-dungeon",
}

HTACCESS = """DirectoryIndex index.html
AddDefaultCharset UTF-8
AddType text/html .html
AddType text/css .css
AddType text/javascript .js .mjs
AddType application/json .json
<IfModule mod_headers.c>
Header set X-Content-Type-Options "nosniff"
</IfModule>
"""

PROBE_FILES = {
    "index.html": """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Quick Dungeon HostGator Probe</title>
<link rel="stylesheet" href="probe.css"></head>
<body><main><h1>Quick Dungeon HostGator Probe</h1>
<p id="status">HTML PASS · module pending</p>
<code>HOSTGATOR-FLARE-SETUP-001</code></main>
<script type="module" src="probe.mjs"></script></body></html>
""",
    "probe.css": "html{font-family:system-ui,sans-serif}body{margin:2rem;background:#111;color:#eee}code{color:#9fe7c4}\n",
    "probe.mjs": """const r=await fetch('./probe.json',{cache:'no-store'});
if(!r.ok) throw new Error(`JSON ${r.status}`);
const data=await r.json();
document.querySelector('#status').textContent =
  data.marker==='HOSTGATOR-FLARE-SETUP-001' ? 'HTML PASS · MODULE PASS · JSON PASS' : 'PROBE FAIL';
""",
    "probe.json": json.dumps({"marker": "HOSTGATOR-FLARE-SETUP-001", "ok": True}) + "\n",
    ".htaccess": HTACCESS,
}

DEPLOY_FILES = [
    "public/flare-s2/index.html",
    "public/flare-s2/player.html",
    "public/flare-s2/builder.mjs",
    "public/flare-s2/core.mjs",
    "public/flare-s2/player.mjs",
    "public/flare-s2/stock.mjs",
    "public/flare-s2/style.css",
    "public/flare-p0/data/catalog.json",
    "public/flare-p0/src/core/challenge.mjs",
    "public/flare-p0/src/core/flare.mjs",
    "public/flare-p0/src/core/navigation.mjs",
    "public/flare-p0/src/core/simulation.mjs",
    "public/flare-p0/src/view/renderer.mjs",
]

def fail(message: str, code: int = 2) -> None:
    print(f"BLOCKED: {message}", file=sys.stderr)
    raise SystemExit(code)

def guard_remote(path: str, mode: str) -> None:
    allowed = ALLOWED_ROOTS[mode]
    norm = path.strip("/")
    if ".." in Path(norm).parts:
        fail(f"unsafe remote path: {path}")
    if norm != allowed and not norm.startswith(allowed + "/"):
        fail(f"refusing path outside {allowed}: {path}")

def auth_headers() -> dict[str, str]:
    if not TOKEN:
        fail("CPANEL_API_TOKEN is not set")
    return {
        "Authorization": f"cpanel {CPANEL_USER}:{TOKEN}",
        "User-Agent": "QuickDungeonHostGatorDeploy/1.0",
        "Accept": "application/json",
    }

def request_json(url: str, *, data: bytes | None = None, headers: dict[str, str] | None = None) -> dict:
    req = Request(url, data=data, headers=headers or {}, method="POST" if data is not None else "GET")
    try:
        with urlopen(req, timeout=35, context=ssl.create_default_context()) as response:
            raw = response.read()
    except HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        fail(f"cPanel HTTP {exc.code}: {body[:500]}")
    except URLError as exc:
        fail(f"cPanel connection failed: {exc}")
    try:
        return json.loads(raw.decode("utf-8"))
    except Exception:
        fail(f"cPanel returned non-JSON: {raw[:300]!r}")

def uapi(module: str, function: str, params: dict[str, str] | None = None, *,
         method: str = "GET") -> dict:
    query = urlencode(params or {})
    url = f"https://{CPANEL_HOST}:2083/execute/{module}/{function}"
    if method == "GET" and query:
        url += "?" + query
        payload = None
        headers = auth_headers()
    else:
        payload = query.encode("utf-8")
        headers = {**auth_headers(), "Content-Type": "application/x-www-form-urlencoded"}
    out = request_json(url, data=payload, headers=headers)
    result = out.get("result", {})
    if not result.get("status"):
        fail(f"UAPI {module}::{function} failed: {result.get('errors') or result}")
    return out

def api2(module: str, function: str, params: dict[str, str]) -> dict:
    # cPanel API tokens are valid for cPanel API 2. This endpoint is used only
    # for mkdir because UAPI has no equivalent.
    query = {
        "cpanel_jsonapi_user": CPANEL_USER,
        "cpanel_jsonapi_apiversion": "2",
        "cpanel_jsonapi_module": module,
        "cpanel_jsonapi_func": function,
        **params,
    }
    url = f"https://{CPANEL_HOST}:2083/json-api/cpanel?{urlencode(query)}"
    out = request_json(url, headers=auth_headers())
    result = out.get("cpanelresult", {})
    event = result.get("event", {})
    if not event.get("result"):
        reason = event.get("reason") or result.get("error") or result
        fail(f"cPanel API 2 {module}::{function} failed: {reason}")
    return out

def list_names(remote_dir: str) -> set[str]:
    out = uapi("Fileman", "list_files", {"dir": remote_dir, "show_hidden": "1"})
    data = out.get("result", {}).get("data") or []
    if isinstance(data, dict):
        entries = [*(data.get("dirs") or []), *(data.get("files") or [])]
    elif isinstance(data, list):
        entries = data
    else:
        entries = []
    return {str(item.get("file")) for item in entries if isinstance(item, dict) and item.get("file")}

def ensure_dir(remote_dir: str, mode: str) -> None:
    guard_remote(remote_dir, mode)
    root = ALLOWED_ROOTS[mode]
    parent = "public_html"
    for part in Path(root).parts[1:]:
        names = list_names(parent)
        if part not in names:
            api2("Fileman", "mkdir", {"path": parent, "name": part, "permissions": "0755"})
        parent += "/" + part
    if remote_dir == root:
        return
    suffix = Path(remote_dir).relative_to(Path(root))
    for part in suffix.parts:
        names = list_names(parent)
        if part not in names:
            api2("Fileman", "mkdir", {"path": parent, "name": part, "permissions": "0755"})
        parent += "/" + part

def save_text(remote_path: str, content: str, mode: str) -> None:
    guard_remote(remote_path, mode)
    p = Path(remote_path)
    remote_dir = p.parent.as_posix()
    ensure_dir(remote_dir, mode)
    uapi("Fileman", "save_file_content", {
        "dir": remote_dir,
        "file": p.name,
        "content": content,
        "from_charset": "UTF-8",
        "to_charset": "UTF-8",
    }, method="POST")

def public_get(url: str) -> tuple[int, str, bytes, str]:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 QuickDungeonProbe/1.0", "Cache-Control": "no-cache"})
    try:
        with urlopen(req, timeout=35, context=ssl.create_default_context()) as response:
            return response.status, response.headers.get_content_type(), response.read(), response.geturl()
    except HTTPError as exc:
        return exc.code, exc.headers.get_content_type(), exc.read(), exc.geturl()
    except URLError as exc:
        fail(f"public HTTPS check failed for {url}: {exc}")

def expect_public(url: str, allowed_types: set[str], marker: bytes | None = None) -> None:
    status, ctype, body, final_url = public_get(url)
    if status != 200:
        fail(f"{url} returned HTTP {status}")
    if not final_url.startswith("https://"):
        fail(f"{url} did not remain on HTTPS: {final_url}")
    if ctype not in allowed_types:
        fail(f"{url} MIME {ctype!r}, expected one of {sorted(allowed_types)}")
    if marker and marker not in body:
        fail(f"{url} did not contain expected marker")

def deploy_probe() -> None:
    root = ALLOWED_ROOTS["probe"]
    ensure_dir(root, "probe")
    for name, content in PROBE_FILES.items():
        save_text(f"{root}/{name}", content, "probe")
    base = PUBLIC_BASE + "/quick-dungeon-test/"
    expect_public(base, {"text/html"}, b"HOSTGATOR-FLARE-SETUP-001")
    expect_public(base + "probe.css", {"text/css"})
    expect_public(base + "probe.mjs", {"text/javascript", "application/javascript"})
    expect_public(base + "probe.json", {"application/json"}, b"HOSTGATOR-FLARE-SETUP-001")
    print(f"TEST PASS: {base}")
    print("Server-side HTTPS and MIME checks passed. Open this URL on mobile to confirm module execution visibly.")

def verify_source_snapshot() -> None:
    try:
        subprocess.run(
            ["git", "-C", str(REPO_ROOT), "cat-file", "-e", EXPECTED_SOURCE_SHA + "^{commit}"],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        changed = subprocess.run(
            ["git", "-C", str(REPO_ROOT), "diff", "--quiet", EXPECTED_SOURCE_SHA, "--", *DEPLOY_FILES],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        ).returncode
    except FileNotFoundError:
        fail("git is required to verify the authorised WEB-FLARE source snapshot")
    except subprocess.CalledProcessError:
        fail(f"authorised source commit {EXPECTED_SOURCE_SHA} is not available locally")
    if changed != 0:
        fail(f"WEB-FLARE deploy files differ from authorised source commit {EXPECTED_SOURCE_SHA}")

def deploy_flare() -> None:
    verify_source_snapshot()
    root = ALLOWED_ROOTS["deploy"]
    ensure_dir(root, "deploy")
    save_text(f"{root}/.htaccess", HTACCESS, "deploy")
    for rel in DEPLOY_FILES:
        local = REPO_ROOT / rel
        if not local.is_file():
            fail(f"required source file missing: {rel}")
        if rel.startswith("public/flare-s2/"):
            out_rel = "flare-s2/" + rel.removeprefix("public/flare-s2/")
        elif rel.startswith("public/flare-p0/"):
            out_rel = "flare-p0/" + rel.removeprefix("public/flare-p0/")
        else:
            fail(f"unexpected source path: {rel}")
        save_text(f"{root}/{out_rel}", local.read_text(encoding="utf-8"), "deploy")
    base = PUBLIC_BASE + "/quick-dungeon/"
    expect_public(base + "flare-s2/", {"text/html"}, b"Quick Dungeon")
    expect_public(base + "flare-s2/style.css", {"text/css"})
    expect_public(base + "flare-s2/builder.mjs", {"text/javascript", "application/javascript"})
    expect_public(base + "flare-s2/player.mjs", {"text/javascript", "application/javascript"})
    expect_public(base + "flare-p0/data/catalog.json", {"application/json"})
    print(f"TEST PASS: {base}flare-s2/")
    print(f"PLAYER BASE: {base}flare-s2/player.html#c=...")

def auth_check() -> None:
    uapi("Fileman", "list_files", {"dir": "public_html"})
    print(f"AUTH PASS: {CPANEL_USER}@{CPANEL_HOST}")

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["auth", "probe", "deploy"])
    args = parser.parse_args()
    auth_check()
    if args.mode == "auth":
        return
    if args.mode == "probe":
        deploy_probe()
    else:
        deploy_flare()

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Private-owner local check of harmless plaintext recovery challenge. No network or keys."""
import hashlib,sys,pathlib,json
expected=json.loads(pathlib.Path(__file__).with_name('challenge_manifest.json').read_text())
if len(sys.argv)!=2:
    raise SystemExit('Usage: python verify_recovery.py PATH_TO_DECRYPTED_CHALLENGE')
p=pathlib.Path(sys.argv[1])
if not p.is_file() or p.stat().st_size>2048:
    raise SystemExit('FAIL: missing/unexpectedly large file')
actual=hashlib.sha256(p.read_bytes()).hexdigest()
if actual!=expected['sha256_utf8']:
    raise SystemExit('FAIL: recovered content does not match the challenge')
print('RECOVERY_CHALLENGE_HASH_PASS (local file only, no secret printed)')

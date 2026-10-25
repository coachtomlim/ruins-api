#!/usr/bin/env python3
"""Nonsecret C3 key-recovery challenge preparation and byte-verification.

PREPARE requires ONLY an age X25519 PUBLIC recipient. No private identity,
Bitwarden login, cloud account, database endpoint, or credentials are accepted.
The script never decrypts anything. Owner performs private decryption outside AI.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys

AGE_X25519 = re.compile(r"age1[023456789acdefghjklmnpqrstuvwxyz]{58}\Z")
VERSION_PIN = "1.1.1"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def public_recipient(raw: bytes) -> str:
    if len(raw) > 128 or not raw.isascii():
        raise ValueError("not a single public age recipient")
    s = raw.decode("ascii").strip()
    if not AGE_X25519.fullmatch(s):
        raise ValueError("not a valid-shaped age X25519 PUBLIC recipient (no identities accepted)")
    return s


def challenge_prepare(recipient_raw: bytes, output_dir: Path) -> dict:
    recipient = public_recipient(recipient_raw)
    if output_dir.exists():
        raise FileExistsError("output directory must be new and empty; refuse overwrite")
    # Only a harmless random challenge; no user record, project data, secrets or passwords.
    plain = ("RUINS-010B2-NONSECRET-RECOVERY-CHALLENGE-V1:" + secrets.token_hex(16) + "\n").encode()
    output_dir.mkdir(mode=0o700, parents=True, exist_ok=False)
    rawpath = output_dir / "NONSECRET_challenge.txt"
    cipherpath = output_dir / "NONSECRET_challenge.age"
    manifestpath = output_dir / "NONSECRET_manifest.json"
    try:
        version = subprocess.run(["age", "--version"], stdin=subprocess.DEVNULL,
                                 capture_output=True, check=False, timeout=15)
        if version.returncode or VERSION_PIN not in version.stdout.decode("utf-8", "replace"):
            raise RuntimeError("age CLI version does not match accepted 1.1.1 pin")
        enc = subprocess.run(["age", "-r", recipient, "-o", str(cipherpath)],
                             input=plain, capture_output=True, check=False, timeout=25)
        if enc.returncode or not cipherpath.is_file():
            raise RuntimeError("age encryption did not complete")
        ciphertext = cipherpath.read_bytes()
        if not ciphertext.startswith(b"age-encryption.org/v1\n") or len(ciphertext) < 128:
            raise RuntimeError("encrypted challenge header or size invalid")
        rawpath.write_bytes(plain)
        os.chmod(rawpath, 0o600)
        os.chmod(cipherpath, 0o600)
        result = {
            "scope": "NONSECRET_OWNER_RECOVERY_CHALLENGE_ONLY",
            "ciphertext_sha256": digest(ciphertext), "ciphertext_bytes": len(ciphertext),
            "expected_recovered_sha256": digest(plain),
            "public_recipient_sha256": digest(recipient.encode("ascii")),
            "age_cli_pinned": VERSION_PIN,
            "owner_key_copy_verified": False,
            "c3_authorized": False,
            "011A_authorized": False,
        }
        manifestpath.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n", encoding="utf-8")
        os.chmod(manifestpath, 0o600)
        return result
    except Exception:
        for p in (cipherpath, rawpath, manifestpath):
            p.unlink(missing_ok=True)
        output_dir.rmdir()
        raise


def challenge_verify(manifest: dict, recovered: bytes) -> dict:
    # This proves only that the provided nonsecret bytes match the challenge.
    # The owner must attest independently WHICH custody copy performed decryption.
    if set(manifest) != {"scope", "ciphertext_sha256", "ciphertext_bytes",
                         "expected_recovered_sha256", "public_recipient_sha256",
                         "age_cli_pinned", "owner_key_copy_verified", "c3_authorized", "011A_authorized"}:
        raise ValueError("unrecognized manifest")
    if manifest["scope"] != "NONSECRET_OWNER_RECOVERY_CHALLENGE_ONLY" or manifest["c3_authorized"] is not False or manifest["011A_authorized"] is not False:
        raise ValueError("incorrect challenge scope")
    if manifest["owner_key_copy_verified"] is not False:
        raise ValueError("Owner custody attestation must not be automated")
    if not isinstance(manifest["expected_recovered_sha256"],str) or not re.fullmatch("[a-f0-9]{64}", manifest["expected_recovered_sha256"]):
        raise ValueError("incorrect expected digest")
    return {"nonsecret_bytes_match": digest(recovered) == manifest["expected_recovered_sha256"],
            "owner_custody_attested": False, "c3_authorized": False, "011A_authorized": False}


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="operation", required=True)
    prep = sub.add_parser("prepare", help="encrypt harmless sample to public recipient")
    prep.add_argument("--public-recipient-file", required=True, type=Path)
    prep.add_argument("--new-directory", required=True, type=Path)
    check = sub.add_parser("verify-bytes", help="verify Owner-decrypted harmless bytes only")
    check.add_argument("--manifest", required=True, type=Path)
    check.add_argument("--recovered-file", required=True, type=Path)
    args = p.parse_args()
    try:
        if args.operation == "prepare":
            m = challenge_prepare(args.public_recipient_file.read_bytes(), args.new_directory)
            print(json.dumps(m, sort_keys=True)); return 0
        m = json.loads(args.manifest.read_text(encoding="utf-8"))
        result = challenge_verify(m, args.recovered_file.read_bytes())
        print(json.dumps(result, sort_keys=True)); return 0 if result["nonsecret_bytes_match"] else 2
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as exc:
        # Don't echo filenames, tool output or user-supplied content.
        print("CHALLENGE_HOLD: " + type(exc).__name__, file=sys.stderr)
        return 2

if __name__ == "__main__":
    raise SystemExit(main())

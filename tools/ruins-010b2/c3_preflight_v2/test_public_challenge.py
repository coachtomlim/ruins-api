"""NON-CRYPTO mocked subprocess tests: never generate/use a real key."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest import mock
from public_challenge import challenge_prepare,challenge_verify,public_recipient

# Syntactically shaped PUBLIC example only. NO key pair generated or supplied.
RECIPIENT = "age1" + "q"*58

class ChallengeTests(unittest.TestCase):
    def test_public_shape_rejects_identity(self):
        with self.assertRaises(ValueError): public_recipient(b"AGE-SECRET-KEY-1NOTALLOWED")
    def test_public_shape_rejects_multiline(self):
        with self.assertRaises(ValueError): public_recipient((RECIPIENT+"\nBAD").encode())
    def test_public_shape_rejects_bad(self):
        with self.assertRaises(ValueError): public_recipient(b"age1notvalid")
    def test_encryption_stub_success_not_crypto_proof(self):
        def mock_run(args,**kwargs):
            if args[1]=="--version":
                return subprocess.CompletedProcess(args,0,b"v1.1.1\n",b"")
            Path(args[-1]).write_bytes(b"age-encryption.org/v1\n"+b"x"*180)
            return subprocess.CompletedProcess(args,0,b"",b"")
        with tempfile.TemporaryDirectory() as td, mock.patch("public_challenge.subprocess.run",side_effect=mock_run) as run:
            out=Path(td)/"run"
            m=challenge_prepare(RECIPIENT.encode(),out)
            self.assertFalse(m["owner_key_copy_verified"])
            self.assertFalse(m["c3_authorized"])
            self.assertFalse(m["011A_authorized"])
            self.assertEqual(challenge_verify(m,(out/"NONSECRET_challenge.txt").read_bytes())["nonsecret_bytes_match"],True)
            self.assertFalse(challenge_verify(m,b"changed")["nonsecret_bytes_match"])
            self.assertEqual(run.call_count,2)
            self.assertEqual(run.call_args[0][0][0],"age")
    def test_rejects_failed_encrypt_and_no_files(self):
        def mock_run(args,**kwargs):
            if args[1]=="--version":return subprocess.CompletedProcess(args,0,b"v1.1.1",b"")
            return subprocess.CompletedProcess(args,71,b"",b"IGNORE")
        with tempfile.TemporaryDirectory() as td,mock.patch("public_challenge.subprocess.run",side_effect=mock_run):
            out=Path(td)/"failed"
            with self.assertRaises(RuntimeError):challenge_prepare(RECIPIENT.encode(),out)
            self.assertFalse(out.exists())
    def test_wrong_age_version(self):
        with tempfile.TemporaryDirectory() as td,mock.patch("public_challenge.subprocess.run",return_value=subprocess.CompletedProcess([],0,b"v1.3.1",b"")):
            out=Path(td)/"failed"
            with self.assertRaises(RuntimeError):challenge_prepare(RECIPIENT.encode(),out)
            self.assertFalse(out.exists())
    def test_reject_existing_destination(self):
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaises(FileExistsError): challenge_prepare(RECIPIENT.encode(),Path(td))
    def test_manifest_auto_grant_rejected(self):
        good={"scope":"NONSECRET_OWNER_RECOVERY_CHALLENGE_ONLY","ciphertext_sha256":"a"*64,"ciphertext_bytes":200,"expected_recovered_sha256":"b"*64,"public_recipient_sha256":"c"*64,"age_cli_pinned":"1.1.1","owner_key_copy_verified":False,"c3_authorized":True,"011A_authorized":False}
        with self.assertRaises(ValueError):challenge_verify(good,b"hi")
    def test_manifest_owner_proof_rejected(self):
        good={"scope":"NONSECRET_OWNER_RECOVERY_CHALLENGE_ONLY","ciphertext_sha256":"a"*64,"ciphertext_bytes":200,"expected_recovered_sha256":"b"*64,"public_recipient_sha256":"c"*64,"age_cli_pinned":"1.1.1","owner_key_copy_verified":True,"c3_authorized":False,"011A_authorized":False}
        with self.assertRaises(ValueError):challenge_verify(good,b"hi")

if __name__ == "__main__":unittest.main()

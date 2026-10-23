# RUINS 001C / 010B-1 — Codex Gate 0.5 remediation evidence

**Date:** 2026-10-23 SGT

**Executor:** Codex Desktop, sole independent developer

**Disposition:** `REVISE / LIVE_BACKUP_HOLD`

No staging database endpoint was contacted. No database credential was requested or received. No live export, SQL application, deployment, production action, OS-encryption change, VeraCrypt header operation, full-container copy, or E:-root ACL change occurred.

## Required status block

- `SOURCE_PUBLISHED`
- `VERACRYPT_READONLY_REVISE`
- `OS_ENCRYPTION_NOT_OBSERVED`
- `TLS_CA_PINNED`
- `BACKUP_RECOVERY_PLAN_NEEDS_OWNER_PERMISSION`
- `SYNTHETIC_PASS`
- Overall: `REVISE`

The real backup remains blocked because C: encryption could not be authoritatively observed, active paging/hibernation/dump surfaces exist on C:, and the E: container inherits access for nonowner principals. The recovery designs are ready but their mutating steps require separate Owner approval.

## Source custody

The isolated branch was recovered cleanly at `257a8f5c6a81ebcfce79726c8ea625a909acc8bd`, parent `7fcade5cea62f3d8256e3634befda167eba952a2`, rooted at canonical base `3afe6a186a382903049b89cce267eda237e55fd2`. Before publication, `git ls-remote` showed that the `-002` ref was absent. A normal, non-force push created only `work/ruins-001c-010b1-codex-independent-002`; post-push `git ls-remote` and GitHub web both returned `257a8f5c6a81ebcfce79726c8ea625a909acc8bd`.

Remediation after publication adds certificate identity/validity checks, a regional noninteractive pooler-host argument, more adversarial tests, and removal of the confidential full container path from the current policy. The path is now supplied only by a SHA-pinned file below encrypted `operator-input`; source and sanitized receipts retain only its SHA-256 identity. Because the already-published historical commit contained the former policy value, this remediation does not claim to erase Git history and does not force-rewrite the branch.

## Windows and VeraCrypt read-only evidence

### R: mount association

- `QueryDosDevice('R:')` returned `\Device\VeraCryptVolumeR`.
- R: is a fixed NTFS volume, serial `04E4F605`, logical size `8,589,668,352` bytes.
- VeraCrypt 1.26.29 UI showed R: as a normal AES 8.0 GiB volume sourced from the expected local E: file. The full path is intentionally omitted.
- The source path SHA-256 identity is `78b940a3f81c26a00b23e3d665193f1a5d14958f3dd4475ebfb5eb3b7f060780`.
- R:, `R:\010b1`, the candidate workspace, and all current descendants were checked for reparse points; none were present.
- Candidate workspace ACL inheritance is protected and permits FullControl only to the current Owner, SYSTEM and Administrators. Runtime rejects inheritance, other principals and reparse traversal.

### VeraCrypt provenance and state

- VeraCrypt executable: version 1.26.29, SHA-256 `7dddcb58a9db6652ee6f1821ad3224b655942145795e2fd309b83230f1ec2862`, valid IDRIX SARL signature.
- VeraCrypt driver: version 1.26.29.3, SHA-256 `1f0c6db3559d1356c38a1486a967cd90db5e6202e433fea1dfe510ddb884ffb6`, valid Microsoft Windows Hardware Compatibility Publisher signature.
- The volume was mounted throughout read-only assessment. No unmount, remount, cache wipe, password/PIM/keyfile change, header backup or header restore was attempted.

### C: plaintext-spill boundary

- The executor token was not elevated.
- `Get-BitLockerVolume`, `manage-bde -status C:` and `Win32_EncryptableVolume` each returned access denied. A running BitLocker service is not proof of protection.
- Status is therefore `OS_ENCRYPTION_NOT_OBSERVED`, not encrypted and not safe-by-assumption.
- Active pagefile: `C:\pagefile.sys`, allocated 21,504 MiB; observed file size `22,548,578,304` bytes and current use 2,531 MiB.
- Hibernation is available; `C:\hiberfil.sys` exists at `6,718,222,336` bytes. Fast Startup is disabled, but that does not remove hibernation risk.
- Crash dump policy is `CrashDumpEnabled=3`; configured destinations are the C: memory dump and minidump directory. No full dump file was present at observation time; minidump-directory enumeration was access denied.
- user `TEMP` and `TMP` are both on C:.

Until an Owner-approved elevated read-only check proves that C: and every spill destination are within an active encryption key scope, real Auth hashes/user data remain on HOLD. No recommendation here authorizes disabling paging, dumps or hibernation.

### E: ciphertext container ACL and media risk

- The container is a local fixed-drive file of exactly `8,589,934,592` bytes on a healthy GPT NVMe device.
- Owner is the current Windows Owner account; ACL inheritance is enabled.
- Inherited entries grant Administrators and SYSTEM FullControl, Authenticated Users Modify, and Users Read/Execute.
- When unmounted, cryptography protects plaintext confidentiality, but broad read access permits ciphertext copying/offline attack and broad Modify permits deletion or corruption. When mounted, plaintext protection depends on R: filesystem ACLs and process/memory safety.
- The NVMe host uses wear-leveling. VeraCrypt cannot guarantee physical overwrite of old sectors/headers on such media; password/header changes are not an erasure strategy.

Proposed exact-file ACL change, only after Owner approval: record the current security descriptor to encrypted R:, protect inheritance on the one container file, and grant only Owner, SYSTEM and Administrators FullControl. Do not touch the E: root or parent directory. Re-read and compare the resulting descriptor, then verify mount and dismount. Rollback applies the recorded original descriptor to that one file.

## Full-container offline second-copy plan

Status: designed, not executed.

1. Owner provides a distinct, non-synced, offline encrypted physical destination with at least 10 GiB free. The encrypted container/header must never be placed in G:, GitHub, chat or other sync storage.
2. Record source metadata and SHA-256, stop all writers, cleanly unmount R:, and confirm R: is absent before copying. A mounted copy is not accepted as a consistent recovery point.
3. Copy exactly `8,589,934,592` bytes to the approved destination without changing the source. Compute destination SHA-256 and require exact equality with the post-unmount source SHA-256 and size. Record only hashes, sizes and sanitized media identifiers.
4. Put the backup medium offline under custody distinct from E:. Protect its file ACL and physical access.
5. Rehearse recovery only from a disposable copy of the offline backup, never the live E: source: verify the disposable copy hash, mount it read-only, verify the expected NTFS identity/workspace and selected file hashes, then unmount and destroy the disposable test copy under a separately approved disposal process.
6. A two-copy rehearsal needs about 18 GiB free; `19,327,352,832` bytes is the recommended floor including overhead.

## External and embedded volume-header recovery plan

Status: designed, not executed.

1. After separate Owner approval, cleanly unmount R: and use VeraCrypt `Tools -> Backup Volume Header` against the source container. Never pass a password/PIM/keyfile on a command line and never store the external header with the live container.
2. Save the external header only to separately encrypted offline custody; create a second independently controlled copy if the Owner approves. Record its byte size and SHA-256 outside the header media. Do not upload it to G:, GitHub or chat.
3. Record the password/PIM/keyfile generation associated with the backup in the Owner's approved secret-management process. Header restore reverts those values to the state at backup time. Refresh the external header after any password, PIM or keyfile change.
4. For the external-header rehearsal, first make and hash-verify an 8 GiB disposable container copy. Restore the external header only onto that disposable copy, mount read-only, and verify filesystem and selected content hashes. Never restore a header onto the live E: source.
5. Separately rehearse the embedded backup header on another disposable copy using VeraCrypt `Tools -> Restore Volume Header -> Restore from embedded backup header`, then mount read-only and verify. Do not treat the embedded and external rehearsals as interchangeable.
6. If either rehearsal changes the disposable copy, destroy only that verified disposable target after evidence is recorded. The live container remains untouched.

## Supabase identity and CA

- Supabase project metadata independently identifies `qpgwqmduqtqidmhbuclw` as active/healthy staging in `ap-southeast-1`, PostgreSQL `17.6.1.166`, direct host `db.qpgwqmduqtqidmhbuclw.supabase.co`.
- No database port was contacted. Official guidance says native backup tools should use the direct endpoint where IPv6 permits; the current bounded workflow retains session pooler port 5432 for this IPv4-capable host and requires the exact dashboard-provided pooler hostname before Gate acceptance.
- Two Supabase-controlled S3 endpoint forms returned byte-identical `prod-ca-2021.crt` files.
- PEM file SHA-256: `700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7` (1,367 bytes).
- Decoded certificate SHA-256: `807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa` (968 DER bytes).
- Subject/issuer: Supabase Root 2021 CA; self-signed RSA/SHA-256 CA; certificate-signing and CRL-signing usage; valid 2021-04-28 through 2031-04-26 UTC; no private key.
- Runtime now requires the exact PEM byte pin, exact DER identity pin, CA constraints, no private key and at least 30 days remaining validity before any hostname/password prompt. It also requires `sslmode=verify-full`, explicit `sslrootcert`, region-constrained hostname validation and read-only session controls.

The exact session-pooler hostname cannot be inferred safely from region because pooler cluster index varies. It must be copied from the project's Dashboard Connect panel and independently accepted by Dev4; do not probe a database port to guess it.

## Final synthetic and adversarial evidence

- PostgreSQL runtime: 17.6, fresh source and separate fresh target on R:, loopback only, SSL disabled only for the loopback synthetic server.
- Test ID: `20261023T130919Z-d0dcd08f`.
- Capture run ID: `20261023T130923Z-438931df`.
- Receipt SHA-256: `d001b46b308eea75f124eb7f61484d54c9bb123e8ac99f7bba8a491dcec5baff`.
- Capture: `CAPTURE_COMPLETE`, 410 objects, 34 data objects.
- Restore: `RESTORE_VERIFIED`, 410/410 objects, 34/34 data objects, zero missing/extra/changed/data-changed.
- Integrity: zero effective-privilege, role-definition and role-membership differences; 12/12 SL-SIM legacy tables matched; zero role passwords recovered.
- Negative controls all true: wrong bundle pin, unexpected bundle file, SQL mutation, capture mutation, capture outside approved root, reparse capture, dirty parent credential environment, wrong CA pin, malformed CA, wrong hostname, inherited ACL, wrong container path, interrupted export, explicit `verify-full`, hostname verification, explicit root certificate, target read-only and server read-only.

## Current trust pins

- `scripts/verify-bundle.ps1`: `072d5d41d8b07086a76be3db4d3b98398794eb7ba27143971d7f8530606b564e`
- `bundle-manifest.json`: `04711cf8f1845a5108b33cf567478be983f69244435fde14f2ac559f1c78f585`
- Supabase CA PEM file: `700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7`
- Supabase CA DER identity: `807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`

## Proposed live command packet — not approved to run

The following is intentionally blocked on the exact nonsecret session-pooler hostname, elevated read-only C: proof, exact-file E: ACL approval/remediation, and recovery-copy/header approvals. It contains no password and must return to Dev4 before execution.

```powershell
$VerifierSha = '072d5d41d8b07086a76be3db4d3b98398794eb7ba27143971d7f8530606b564e'
$ManifestSha = '04711cf8f1845a5108b33cf567478be983f69244435fde14f2ac559f1c78f585'
$CaSha = '700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7'
$SessionPoolerHost = '<DEV4_COPY_EXACT_SESSION_POOLER_HOST_FROM_PROJECT_CONNECT_PANEL>'
$Verifier = 'R:\010b1\codex-independent-002\scripts\verify-bundle.ps1'
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $Verifier).Hash.ToLowerInvariant() -ne $VerifierSha) { throw 'verifier pin mismatch' }
& $Verifier -ExpectedManifestSha256 $ManifestSha
& 'R:\010b1\codex-independent-002\scripts\protect-workspace-acl.ps1' -ExpectedManifestSha256 $ManifestSha
$capture = & 'R:\010b1\codex-independent-002\scripts\run-010b1-capture.ps1' -ExpectedManifestSha256 $ManifestSha -SessionPoolerHost $SessionPoolerHost -RootCertificate 'R:\010b1\codex-independent-002\operator-input\prod-supabase.cer' -ExpectedRootCertificateSha256 $CaSha
$capture
```

Stop immediately if any pin, device, serial, ACL, reparse, local container-path identity, CA identity/validity, hostname, project identity, schema inventory, PostgreSQL 17.x version, pre-r2 condition, read-only condition, dump family, source-stability hash or artifact hash check fails.

## Scoped Owner approvals required before a live run

1. **Elevated read-only OS observation:** authorize an elevated status-only BitLocker/Device Encryption check for C: and spill destinations. No settings or recovery keys change.
2. **Exact container-file ACL:** authorize recording and then restricting only the one E: container file, with tested rollback. No E: root or parent ACL change.
3. **Full-container offline copy:** authorize a clean unmount and one verified 8 GiB second copy to named offline encrypted media. No G:/cloud copy.
4. **External/embedded header rehearsal:** authorize external header creation into separate offline encrypted custody and restore testing only against disposable verified container copies. Never the live source.
5. **Nonsecret endpoint completion:** Dev4 supplies and pins the exact session-pooler hostname from the project Connect panel. This is not a database credential request.

No database password should be requested until Dev4 independently accepts the new final Git SHA, trust pins, OS/ACL/recovery dispositions and exact completed hostname.

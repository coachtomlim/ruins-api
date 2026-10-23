# RUINS 001C / 010B-1 — Codex independent Gate 0.5 evidence

**Disposition:** `PASS_READY_FOR_DEV4_GATE_0_5 / LIVE_HOLD`

This is independent implementation and verification evidence, not acceptance of Claude's packet and not authorization to contact staging. No Supabase credential was requested, received, or used. No staging or production endpoint was contacted. No real export was started.

## Source and implementation

- Requested source branch: `work/ruins-001c-010b1-codex-independent-001`
- Verified starting HEAD: `3afe6a186a382903049b89cce267eda237e55fd2`
- Isolated implementation branch: `work/ruins-001c-010b1-codex-independent-002`
- Implementation commits: `439c651`, `da2e9c2`, `5f9f3a9`, `7fcade5`
- Runtime package: `tools/ruins-010b1/`
- Claude packet: read as an untrusted baseline; its 21-file parent SHA-256 manifest independently matched 21/21 files, but no file was accepted solely because that manifest passed.

Principal corrections:

1. Live TLS is `verify-full`, with explicit `PGSSLROOTCERT`, hostname verification and a separately supplied CA SHA-256 pin. `sslmode=require` is rejected.
2. The verifier and bundle manifest require independent SHA-256 pins before a prompt, network access or output creation. The manifest pins every runtime script/SQL/family/config file; tool manifests pin all 519 installed PostgreSQL files and the 78-file Git/Bash runtime closure.
3. `R:` must resolve to `\Device\VeraCryptVolumeR`, NTFS serial `04E4F605`, and the exact canonical workspace. Reparse points and paths outside the encrypted root are rejected.
4. The candidate workspace ACL is protected and restricted to the Owner, SYSTEM and Administrators. Runtime aborts if inheritance or any other principal appears.
5. The password is read as `SecureString`; plaintext exists only transiently in process memory and a child-process environment block. It is not placed in the parent environment, command line, disk, summary or transcript.
6. Every remote child receives `default_transaction_read_only=on`, `target_session_attrs=read-only`, timeouts and the project-scoped database user. Live host and user patterns are verified again by F0.
7. Capture completion requires two equal private SHA-256 data manifests, complete Auth/Storage/migration scope, exact object inventory and a SHA-256 artifact manifest. Restore requires that artifact manifest's separately supplied pin.
8. Restore canonicalizes `CaptureDir`, rejects links, wrong roots/projects/bundle versions, incomplete runs, unexpected dump SQL, size/hash mismatch and source instability before starting PostgreSQL.
9. Local restore binds only `127.0.0.1`, uses cryptographic local passwords, fail-fast single transactions, verifies roles/memberships/extensions/ACL/RLS/effective privileges/object definitions and SHA-256 content equality, then removes disposable PGDATA.

## Exact trust pins

| Item | SHA-256 |
|---|---|
| `scripts/verify-bundle.ps1` | `072d5d41d8b07086a76be3db4d3b98398794eb7ba27143971d7f8530606b564e` |
| `bundle-manifest.json` | `74f872a5895a0b835a0be0f492ebefd20ab3984845e0123b9da2f252fa6e717e` |
| PostgreSQL 17.6 EDB archive | `d378882abd001a186735acd6f6ba716bca6ccd192e800412d4fd15ed25376b3e` |
| PostgreSQL installed-tree pin file | `b41495efc4f9c5441a9a84b3f6beed0c01ecfff87c17c764797b7680adeadbd3` |
| Git/Bash runtime pin file | `47231235b6570ee966d728365163eb4f518573dc83d8501c5cfe322bce0cfe19` |
| VeraCrypt 1.26.29 executable | `7dddcb58a9db6652ee6f1821ad3224b655942145795e2fd309b83230f1ec2862` |
| VeraCrypt 1.26.29.3 driver | `1f0c6db3559d1356c38a1486a967cd90db5e6202e433fea1dfe510ddb884ffb6` |
| Supabase CLI 2.121.0 official checksum file | `512afdb551a9c89c7b67367864b2149c9d0ea060e2f2bd7920868fecb6c13ad1` |
| Supabase CLI 2.121.0 Windows AMD64 tar.gz | `bc0f27a29c1f4ccaf33a801b7cb9d10da6484568c88e232c9dea0b9e8666b0db` |
| Supabase CLI extracted `supabase.exe` | `aed2aedd9e367549307d038b770e505b288225958e2e81bfe5db53fa6a01c148` |

The EDB archive was independently downloaded from the PostgreSQL project's linked EDB binary endpoint. Its SHA-256 matched, and all 519 installed files were present in the official archive with 0 size/hash mismatches. The official archive contained additional components not needed by this bounded runtime. Supabase's official v2.121.0 release checksum file matched the local file byte-for-byte, and streamed extraction reproduced the local executable hash.

## Final synthetic and adversarial evidence

- PostgreSQL source: fresh 17.6 cluster on encrypted R:
- PostgreSQL target: separate fresh 17.6 cluster on encrypted R:
- Final run ID: `20261023T124821Z-9f341703`
- Sanitized receipt SHA-256: `b2138690bb69c89a1596e1d37d76ef44772940666179c329ade545324951359c`
- Result: `PASS`
- Inventory: 410 source / 410 target; missing 0, extra 0, changed 0
- Data: 34 source / 34 target; missing 0, extra 0, changed 0
- Effective privilege differences: 0
- SL-SIM protected tables: 12 compared / 0 mismatches
- Role-definition differences: 0
- Role-membership differences: 0
- Recovered source role passwords: 0
- Auth data objects: 2; Storage metadata objects: 2; migration-history objects: 1; all content equal
- `AUTH_CONTINUITY: NOT_PROVEN`
- `STORAGE_BINARIES: OUT_OF_SCOPE`
- `VAULT: OUT_OF_SCOPE`

Negative controls all rejected as designed:

- wrong out-of-band bundle pin;
- unexpected bundle file;
- modified trusted SQL;
- modified captured data SQL;
- capture outside the approved root;
- capture through a directory junction/reparse point;
- inherited parent credential variables.

Static gates also passed: all PowerShell parsed, all Bash families passed `bash -n`, all JSON parsed, `git diff --check` passed, and no credential/URL/token material is present in the bundle.

## VeraCrypt and host risk assessment

Verified without mounting, unmounting, changing VeraCrypt settings or handling its passphrase:

- R: maps to `\Device\VeraCryptVolumeR`, NTFS serial `04E4F605`, size 8,589,668,352 bytes.
- Candidate workspace has no reparse points and now has protected explicit FullControl ACLs only for Owner, SYSTEM and Administrators.
- The only file in `E:\RUINS_010B1_PRIVATE\` is `ruins-010b1.hc`, 8,589,934,592 bytes. It is locked by another process while R: is mounted. This is strong operational evidence but not a cryptographic proof that R: came from that exact pathname; a VeraCrypt Properties check should be recorded by the Owner at Gate 0.5 without exposing a password.
- VeraCrypt executable and driver have valid Authenticode signatures. The executable signer is IDRIX SARL; the driver signer is Microsoft Windows Hardware Compatibility Publisher.
- E: is NVMe/wear-levelled. VeraCrypt warns that wear-levelled media can retain prior encrypted headers and is unsuitable for plausible-deniability assumptions.
- The E: container and parent currently inherit broad ACLs (`Authenticated Users: Modify`, `Users: ReadAndExecute`). This does not expose plaintext at rest, but permits copying and creates deletion/tamper/availability risk. Dev4 should require a reviewed Owner ACL hardening/backup step before live capture.
- Windows currently uses `C:\pagefile.sys`, `C:\hiberfil.sys`, and crash dumps under C:. Administrative access was unavailable to prove whether C: is protected by full-system encryption. VeraCrypt explicitly warns that plaintext in RAM can reach pagefiles, hibernation and memory dumps. This is an unresolved host leakage risk requiring Gate 0.5 Owner decision; the scripts cannot solve it.
- Every normal non-system VeraCrypt volume has an embedded backup header. No external header backup was created or recovery-tested because the work order forbids doing so without a separate Owner action. A header restore can revert the password/PIM/keyfile state to that of the backup. Dev4 should require an offline external-header plus full-container recovery plan, stored separately from E:, before treating this as durable recovery.

## Proposed exact Gate-approved live commands

Do not run these until Dev4 accepts the commit and pins and the Owner resolves the host-risk conditions above. Download the project CA from Supabase Database Settings only after Gate acceptance; record its SHA-256 without sharing credentials.

```powershell
$VerifierSha = '072d5d41d8b07086a76be3db4d3b98398794eb7ba27143971d7f8530606b564e'
$ManifestSha = '74f872a5895a0b835a0be0f492ebefd20ab3984845e0123b9da2f252fa6e717e'
$CaSha = '<DEV4_ACCEPTED_PROJECT_CA_SHA256>'
$Verifier = 'R:\010b1\codex-independent-002\scripts\verify-bundle.ps1'
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $Verifier).Hash.ToLowerInvariant() -ne $VerifierSha) { throw 'verifier pin mismatch' }
& $Verifier -ExpectedManifestSha256 $ManifestSha
& 'R:\010b1\codex-independent-002\scripts\protect-workspace-acl.ps1' -ExpectedManifestSha256 $ManifestSha
$capture = & 'R:\010b1\codex-independent-002\scripts\run-010b1-capture.ps1' `
  -ExpectedManifestSha256 $ManifestSha `
  -RootCertificate 'R:\010b1\codex-independent-002\operator-input\prod-supabase.cer' `
  -ExpectedRootCertificateSha256 $CaSha
$capture
```

Dev4 independently records the returned `artifactManifestSha256`. The Owner then runs the local-only restore:

```powershell
& 'R:\010b1\codex-independent-002\scripts\run-010b1-restore-verify.ps1' `
  -ExpectedManifestSha256 $ManifestSha `
  -ExpectedArtifactManifestSha256 '<DEV4_RECORDED_CAPTURE_ARTIFACT_SHA256>' `
  -CaptureDir '<CAPTURE_DIR_RETURNED_BY_CAPTURE>'
```

## Current boundaries

- `REAL_STAGING_EXPORT_STARTED: NO`
- `OWNER_CREDENTIAL_REQUESTED: NO`
- `STAGING_MUTATIONS: NO`
- `PRODUCTION_TOUCHED: NO`
- `SUPABASE_PLAN: FREE`
- `011A_AUTHORIZED: NO`
- `LIVE_EXECUTION: HOLD_FOR_DEV4_GATE_0_5`

Primary references:

- Supabase SSL enforcement and `verify-full`: https://supabase.com/docs/guides/platform/ssl-enforcement
- Supabase psql certificate setup: https://supabase.com/docs/guides/database/psql
- Supabase backup/restore limitations and command family: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- Supabase CLI dump reference: https://supabase.com/docs/reference/cli/v0/supabase-db-dump
- PostgreSQL Windows binaries: https://www.postgresql.org/download/windows/
- PostgreSQL 17.6 release: https://www.postgresql.org/docs/release/17.6/
- VeraCrypt security precautions: https://veracrypt.io/en/Security%20Requirements%20and%20Precautions.html
- VeraCrypt paging-file warning: https://veracrypt.io/en/Paging%20File.html
- VeraCrypt header backup/restore behavior: https://veracrypt.io/en/Program%20Menu.html

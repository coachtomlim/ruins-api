# RUINS 001C / 010B-1 independent backup-recovery tooling

This package implements the single authorized pre-r2 staging logical capture and one disposable PostgreSQL 17.6 local restore. It does not authorize 011A, staging writes, production access, paid Supabase features, or credential disclosure.

Security invariants:

- every runtime path is canonical, below `R:\010b1\codex-independent-002`, and free of reparse points;
- `R:` must match both `\Device\VeraCryptVolumeR` and pinned NTFS serial `04E4F605`;
- an out-of-band SHA-256 pins the verifier and bundle manifest before any prompt, network access, or output creation;
- executable hashes, versions, and Authenticode identities are pinned;
- live libpq settings are `sslmode=verify-full`, a separately pinned Supabase CA file, hostname verification, project-scoped username, and server-enforced read-only transactions;
- the password is read as `SecureString` and supplied only to child processes, never placed in the parent environment, command line, file, summary, or transcript;
- captures are complete only after two matching private SHA-256 data manifests and an artifact manifest; restore requires an independently supplied artifact-manifest pin;
- restore accepts only a complete, untampered capture below an approved encrypted capture root and binds PostgreSQL only to `127.0.0.1`.

Dev4 must publish three lowercase SHA-256 pins in the accepted Gate 0.5 packet: `verify-bundle.ps1`, `bundle-manifest.json`, and the downloaded project CA certificate. The Owner then runs the following in a fresh private Windows PowerShell 5.1 window with transcription disabled. Place the CA at `R:\010b1\codex-independent-002\operator-input\prod-supabase.cer`.

```powershell
$VerifierSha = '<DEV4_VERIFIER_SHA256>'
$ManifestSha = '<DEV4_MANIFEST_SHA256>'
$CaSha = '700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7'
$SessionPoolerHost = '<DEV4_PINNED_AP_SOUTHEAST_1_SESSION_POOLER_HOST>'
$Verifier = 'R:\010b1\codex-independent-002\scripts\verify-bundle.ps1'
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $Verifier).Hash.ToLowerInvariant() -ne $VerifierSha) { throw 'verifier pin mismatch' }
& $Verifier -ExpectedManifestSha256 $ManifestSha
& 'R:\010b1\codex-independent-002\scripts\protect-workspace-acl.ps1' -ExpectedManifestSha256 $ManifestSha
$capture = & 'R:\010b1\codex-independent-002\scripts\run-010b1-capture.ps1' -ExpectedManifestSha256 $ManifestSha -SessionPoolerHost $SessionPoolerHost -RootCertificate 'R:\010b1\codex-independent-002\operator-input\prod-supabase.cer' -ExpectedRootCertificateSha256 $CaSha
$capture
```

Dev4 records the returned `artifactManifestSha256` through the accepted review channel. The Owner then runs:

```powershell
& 'R:\010b1\codex-independent-002\scripts\run-010b1-restore-verify.ps1' -ExpectedManifestSha256 $ManifestSha -ExpectedArtifactManifestSha256 '<DEV4_RECORDED_CAPTURE_ARTIFACT_SHA256>' -CaptureDir '<CAPTURE_DIR_RETURNED_ABOVE>'
```

No live command is approved merely because it appears here. Gate 0.5 must accept the exact commit, hashes, CA pin, command family, host risks, and sanitized synthetic evidence first.

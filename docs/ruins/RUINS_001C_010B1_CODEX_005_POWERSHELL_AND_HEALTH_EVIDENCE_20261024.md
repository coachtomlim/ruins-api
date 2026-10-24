# RUINS 001C / 010B-1 — Codex 005 PowerShell and health preflight evidence

**Observed:** 2026-10-24 SGT

**Executor:** Codex Desktop, sole independent developer

**Disposition:** `010B1_CODEX_005: PASS_READY_FOR_OWNER_DECISION`
**Gate 0.5 / live backup / 011A:** HOLD

No elevation, live E: or R: permission mutation, VeraCrypt mount/unmount, full-container copy, header operation, staging database connection, credential access, SQL, Auth, DDL, deployment, billing or production action occurred.

## Source custody

- Governance work order: `f625282848e0c8920c3a8f74a2d9d63a74246642`.
- Accepted implementation parent: `208b8399409383a4dcf329be8270e8e8a201a101`.
- Isolated branch: `work/ruins-001c-010b1-codex-powershell-preflight-005`.
- ACL implementation/test commit: `c0b0d4cc1913699d45afa56ebe2406b948666406`.
- The accepted capture/restore runtime and bundle contents are unchanged.
- Existing bundle-manifest SHA-256 remains `04711cf8f1845a5108b33cf567478be983f69244435fde14f2ac559f1c78f585`.
- Existing verifier SHA-256 remains `072d5d41d8b07086a76be3db4d3b98398794eb7ba27143971d7f8530606b564e`.

New development-only files and SHA-256 identities:

- `dev/AclPreflight.Common.ps1`: `16e83bc0bec75fac9315d04b5a97c7af41a49603755755d6f51cd22ed3ccc498`.
- `dev/Invoke-ContainerAclPreflight.ps1`: `c89d22bfeba449d9eaa6b78e1c1373fec0f7bef429fbe9f198b17e38a7ba18be`.
- `dev/Test-ContainerAclPreflight.ps1`: `5627dafe07ed63c91e48d2d54372c4d708297879d82441dac67f937b539c77df`.

The files remain outside the accepted runtime manifest. They do not alter or authorize the live backup candidate.

## PowerShell 5.1 correction and disposable evidence

The 004 proposal used `.NET` APIs unavailable in Windows PowerShell 5.1. The replacement computes UTF-8 SHA-256 with `SHA256.Create().ComputeHash(...)`, converts it through `BitConverter.ToString(...).Replace('-', '').ToLowerInvariant()`, and disposes the hash object.

Actual host test runtime: Windows PowerShell Desktop `5.1.26100.9711`.

Test result:

```json
{"status":"POWERSHELL_5_1_ACL_TEST_PASS","powershell":"5.1.26100.9711","utf8Vectors":3,"preview":true,"wrongPathHashRejected":true,"wrongSddlHashRejected":true,"wrongFileIdentityRejected":true,"wrongOwnerRejected":true,"unauthorizedMutationRejected":true,"dismountGuardExercised":true,"applyVerified":true,"wrongRollbackHashRejected":true,"rollbackVerified":true,"disposableFileOnly":true}
```

The test used one five-byte disposable synthetic file under a random local temporary directory. It applied the restricted ACL, verified exactly Owner/SYSTEM/Administrators FullControl, rejected corrupted identities, restored the original inheritance/explicit-rule state, verified the complete Owner/Group/DACL hash, and removed all test residue. It did not reference E: or the real container.

The host's persistent execution policies remained unchanged. A child process used process-local `-ExecutionPolicy Bypass` solely because LocalMachine is `RemoteSigned` and the newly authored local test scripts are unsigned; CurrentUser remained `Undefined` and LocalMachine remained `RemoteSigned`.

### Read-only live metadata preview

Windows PowerShell 5.1 `Preview` mode was run against the existing path record and container metadata. It returned:

```json
{"mode":"Preview","status":"ACL_PREFLIGHT_PASS","pathSha256":"78b940a3f81c26a00b23e3d665193f1a5d14958f3dd4475ebfb5eb3b7f060780","length":8589934592,"ownerVerified":true,"currentSddlSha256":"fa5f8044a40cfe99714b17fd0560e830b1ec332c74fad84d56b3c1e0efc91d10","rollbackParentProtected":false,"rollbackParentEffectiveAclApproved":true,"mutationPerformed":false}
```

The rollback parent inherits only the approved effective Owner/SYSTEM/Administrators rights. Future `Apply` protects the newly written rollback descriptor itself before changing the container ACL. The 005 preview created no rollback file and made no ACL change.

## Exact future E: one-file operation — not authorized by 005

Preconditions:

1. Owner separately authorizes the exact container-file ACL change and clean VeraCrypt R: dismount/remount sequence.
2. Dev4 pins the three new script hashes above and confirms a clean published source commit.
3. R: maps to `\Device\VeraCryptVolumeR`, serial `04E4F605`; the path identity and file length still match; the rollback descriptor does not already exist.
4. No E: root, parent-directory or other-file ACL is changed.

In a fresh normal-user Windows PowerShell 5.1 window, from the accepted source checkout:

```powershell
$ErrorActionPreference = 'Stop'
$ToolRoot = '<ACCEPTED_SOURCE_CHECKOUT>\tools\ruins-010b1\dev'
$Common = Join-Path $ToolRoot 'AclPreflight.Common.ps1'
$Tool = Join-Path $ToolRoot 'Invoke-ContainerAclPreflight.ps1'
$PathRecord = 'R:\010b1\codex-independent-002\operator-input\container-path.txt'
$Rollback = 'R:\010b1\codex-independent-002\operator-input\container-acl-before-005.sddl'
. $Common
$Container = [IO.File]::ReadAllText($PathRecord).Trim()
$Before = Get-Acl -LiteralPath $Container
$OwnerSid = $Before.GetOwner([Security.Principal.SecurityIdentifier]).Value
$BeforeSddlSha = Get-Utf8Sha256String -Value (Get-PortableFileSecuritySddl -Acl $Before)
if ($BeforeSddlSha -cne 'fa5f8044a40cfe99714b17fd0560e830b1ec332c74fad84d56b3c1e0efc91d10') {
  throw 'live container ACL drift'
}
$AclArgs = @{
  PathRecord = $PathRecord
  ExpectedPathSha256 = '78b940a3f81c26a00b23e3d665193f1a5d14958f3dd4475ebfb5eb3b7f060780'
  ExpectedLength = 8589934592
  ExpectedDriveRoot = 'E:\'
  ExpectedOwnerSid = $OwnerSid
  ExpectedBeforeSddlSha256 = $BeforeSddlSha
  ExpectedCurrentSddlSha256 = $BeforeSddlSha
  RollbackSddlPath = $Rollback
}
& $Tool @AclArgs -Mode Preview
```

After separate Owner authorization, the mutation invocation is:

```powershell
& $Tool @AclArgs -Mode Apply -PauseForDismountDrive 'R:' -OwnerAuthorizedMutation
```

The script first writes the original Owner/Group/DACL descriptor to encrypted R:, protects that rollback file to exactly Owner/SYSTEM/Administrators, and verifies its hash. It then pauses for the Owner to cleanly dismount R: through VeraCrypt. Only after exact confirmation and verification that R: is absent does it protect the one E: file and verify the three-principal ACL. If apply or verification fails, it restores and verifies the original ACL from the in-memory descriptor before returning an error. The Owner must then remount R: and verify its serial/workspace separately; the script never mounts it.

Record the returned `afterSddlSha256`. A separately authorized rollback uses the recorded post-change hash and the original rollback hash:

```powershell
$AclArgs.ExpectedCurrentSddlSha256 = '<RECORDED_AFTER_SDDL_SHA256>'
& $Tool @AclArgs -Mode Rollback `
  -ExpectedRollbackSddlSha256 'fa5f8044a40cfe99714b17fd0560e830b1ec332c74fad84d56b3c1e0efc91d10' `
  -PauseForDismountDrive 'R:' `
  -OwnerAuthorizedMutation
```

Rollback reads and validates the protected descriptor while R: is mounted, pauses for an Owner clean dismount, restores only the exact file's original explicit rules/inheritance mode and owner, then requires the complete original Owner/Group/DACL hash. Inherited rules are recomputed by Windows; parent drift therefore fails closed instead of installing stale inherited ACEs.

## Elevated read-only C: status packet — Owner decision required

Current non-elevated evidence remains `OS_ENCRYPTION_NOT_OBSERVED`. Active spill scope at this observation:

- pagefile on C:, allocated 22,528 MiB and file size `23,622,320,128` bytes;
- hibernation available; C: hibernation file size `6,718,222,336` bytes;
- `CrashDumpEnabled=3`, dump and minidump destinations on C:;
- user and machine TEMP/TMP roots on C:;
- Fast Startup disabled, which does not remove hibernation exposure.

Owner may separately authorize only this elevated status collection:

```powershell
$ErrorActionPreference = 'Stop'
Get-BitLockerVolume -MountPoint C: |
  Select-Object MountPoint, VolumeStatus, ProtectionStatus, EncryptionMethod, EncryptionPercentage, LockStatus
manage-bde.exe -status C:
Get-CimInstance -Namespace root\cimv2\Security\MicrosoftVolumeEncryption `
  -ClassName Win32_EncryptableVolume -Filter "DriveLetter='C:'" |
  Select-Object DriveLetter, ProtectionStatus, ConversionStatus, EncryptionMethod
```

Do not query key protectors or recovery material and do not capture screenshots containing secrets. Acceptance is fail-closed: all three sources must consistently show C: fully encrypted, protection on, 100% encryption, a non-None encryption method and the expected unlocked state. Any denial, inconsistency, suspended protection, conversion in progress or unencrypted spill destination remains HOLD and requires an alternate fully encrypted host or a separately approved mitigation—not an OS setting change under 005.

## Supabase health reconciliation

Result: `STATUS_RECONCILED` for the current observation; historical cause not proven.

At the client observation window ending approximately `2026-10-24T02:19Z`:

- Supabase management metadata for `qpgwqmduqtqidmhbuclw`, “Dungeon Runner S8B Staging”, returned `ACTIVE_HEALTHY`, region `ap-southeast-1`, PostgreSQL `17.6.1.166`.
- The authenticated dashboard's **Project Overview aggregate STATUS panel** now displayed `Healthy`. This identifies the earlier `Unhealthy` text as the same aggregate project-overview indicator, not a specific service card.
- Current service cards showed zero warnings and zero errors for API Gateway, Realtime, Storage, Postgres, Edge Functions and Auth.
- The current Advisor summary stated: no security, performance or health issues found.

The current dashboard and management status therefore agree. No cause is assigned to the earlier observation; it may not be described as a confirmed outage. No database port, customer Edge Function, SQL editor, user record or credential was accessed.

Accepted nonsecret TLS candidate context is preserved unchanged:

- session pooler `aws-0-ap-southeast-1.pooler.supabase.com:5432`;
- CA PEM SHA-256 `700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7`;
- decoded DER SHA-256 `807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`;
- required client mode `sslmode=verify-full`.

These pins are not evidence of a completed TLS handshake or database connection.

## VeraCrypt recovery-media requirement

Status: `WAITING_FOR_OWNER_MEDIA`.

Only the internal NVMe system disk and internal NVMe E: disk are present. R: is the live virtual mapping of the E: container, not independent recovery media. G: is synchronized storage and is forbidden for container/header custody.

Owner must provide and separately authorize a distinct encrypted, non-synced, offline physical disk with at least `19,327,352,832` bytes free; 20 GiB or more is recommended. The later approved sequence must cleanly dismount R:, hash the source, copy exactly `8,589,934,592` bytes, and require source/destination size and SHA-256 equality before taking the destination offline. External header backup must be held separately from the container. External-header and embedded-header recovery must each be rehearsed against a separate hash-verified disposable container copy, mounted read-only, never against the E: source. Password/PIM/keyfile material must remain in Owner-approved secret custody and never appear on a command line or in evidence.

## Owner decisions still required

1. Accept the published 005 source and PowerShell 5.1 disposable evidence.
2. Authorize the elevated read-only C: status packet, or designate an alternate fully encrypted host.
3. If C: passes, separately authorize the exact-file E: ACL apply/dismount/remount sequence and retain the rollback descriptor.
4. Supply and name suitable offline encrypted physical recovery media, then separately authorize the consistent full copy and disposable header rehearsals.
5. Return results to Dev4 for Gate 0.5 adjudication before any private credential entry or live backup.

`010B1_CODEX_005: PASS_READY_FOR_OWNER_DECISION`

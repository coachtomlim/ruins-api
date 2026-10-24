[CmdletBinding()]
param(
  [ValidateSet('Preview', 'Apply', 'Rollback')]
  [string]$Mode = 'Preview',

  [Parameter(Mandatory = $true)][string]$PathRecord,
  [Parameter(Mandatory = $true)][string]$ExpectedPathSha256,
  [Parameter(Mandatory = $true)][long]$ExpectedLength,
  [Parameter(Mandatory = $true)][string]$ExpectedDriveRoot,
  [Parameter(Mandatory = $true)][string]$ExpectedOwnerSid,
  [Parameter(Mandatory = $true)][string]$ExpectedBeforeSddlSha256,
  [Parameter(Mandatory = $true)][string]$ExpectedCurrentSddlSha256,
  [Parameter(Mandatory = $true)][string]$RollbackSddlPath,
  [string]$ExpectedRollbackSddlSha256,
  [ValidatePattern('^[A-Za-z]:$')][string]$PauseForDismountDrive,
  [string]$DismountConfirmation,
  [switch]$OwnerAuthorizedMutation
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'AclPreflight.Common.ps1')

foreach ($pair in @(
  @('ExpectedPathSha256', $ExpectedPathSha256),
  @('ExpectedBeforeSddlSha256', $ExpectedBeforeSddlSha256),
  @('ExpectedCurrentSddlSha256', $ExpectedCurrentSddlSha256)
)) {
  Assert-Sha256Value -Name $pair[0] -Value $pair[1]
}
if (-not [string]::IsNullOrEmpty($ExpectedRollbackSddlSha256)) {
  Assert-Sha256Value -Name 'ExpectedRollbackSddlSha256' -Value $ExpectedRollbackSddlSha256
}
if ($ExpectedOwnerSid -cnotmatch '^S-1-') { throw 'ExpectedOwnerSid must be a SID' }
if ($ExpectedLength -lt 0) { throw 'ExpectedLength must not be negative' }

if ($Mode -ne 'Preview' -and -not $OwnerAuthorizedMutation) {
  throw 'mutation mode requires OwnerAuthorizedMutation'
}
if (-not [string]::IsNullOrEmpty($PauseForDismountDrive) -and $Mode -eq 'Preview') {
  throw 'PauseForDismountDrive is valid only in Apply or Rollback mode'
}

$pathRecordItem = Get-Item -LiteralPath $PathRecord -Force -ErrorAction Stop
if ($pathRecordItem.PSIsContainer) { throw 'PathRecord must be a file' }
Assert-NoReparsePointInExistingPath -LiteralPath $pathRecordItem.FullName

$containerText = [IO.File]::ReadAllText($pathRecordItem.FullName).Trim()
$actualPathSha256 = Get-Utf8Sha256String -Value $containerText
if ($actualPathSha256 -cne $ExpectedPathSha256) { throw 'container path pin mismatch' }

$containerItem = Get-Item -LiteralPath $containerText -Force -ErrorAction Stop
if ($containerItem.PSIsContainer) { throw 'container target must be a file' }
Assert-NoReparsePointInExistingPath -LiteralPath $containerItem.FullName
if ($containerItem.Length -ne $ExpectedLength) { throw 'container length mismatch' }

$actualRoot = [IO.Path]::GetPathRoot($containerItem.FullName)
if (-not [string]::Equals($actualRoot, $ExpectedDriveRoot, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'container drive root mismatch'
}

$beforeAcl = Get-Acl -LiteralPath $containerItem.FullName
$actualOwnerSid = $beforeAcl.GetOwner([Security.Principal.SecurityIdentifier]).Value
if ($actualOwnerSid -cne $ExpectedOwnerSid) { throw 'container owner mismatch' }
$beforeSddl = Get-PortableFileSecuritySddl -Acl $beforeAcl
$actualCurrentSddlSha256 = Get-Utf8Sha256String -Value $beforeSddl
if ($actualCurrentSddlSha256 -cne $ExpectedCurrentSddlSha256) {
  throw 'container ACL hash mismatch'
}

$rollbackParent = Split-Path -Parent $RollbackSddlPath
if ([string]::IsNullOrEmpty($rollbackParent)) { throw 'rollback path requires a parent' }
$rollbackParentItem = Get-Item -LiteralPath $rollbackParent -Force -ErrorAction Stop
if (-not $rollbackParentItem.PSIsContainer) { throw 'rollback parent must be a directory' }
Assert-NoReparsePointInExistingPath -LiteralPath $rollbackParentItem.FullName
$rollbackParentAcl = Get-Acl -LiteralPath $rollbackParentItem.FullName
Assert-OwnerSystemAdministratorsFullControlAcl `
  -Acl $rollbackParentAcl -OwnerSid $ExpectedOwnerSid

if ($Mode -eq 'Preview') {
  [pscustomobject]@{
    mode = 'Preview'
    status = 'ACL_PREFLIGHT_PASS'
    pathSha256 = $actualPathSha256
    length = $containerItem.Length
    ownerVerified = $true
    currentSddlSha256 = $actualCurrentSddlSha256
    rollbackParentProtected = [bool]$rollbackParentAcl.AreAccessRulesProtected
    rollbackParentEffectiveAclApproved = $true
    mutationPerformed = $false
  } | ConvertTo-Json -Compress
  exit 0
}

if ($Mode -eq 'Apply') {
  if ($actualCurrentSddlSha256 -cne $ExpectedBeforeSddlSha256) {
    throw 'apply requires the pinned original ACL'
  }
  if (Test-Path -LiteralPath $RollbackSddlPath) {
    throw 'rollback descriptor already exists; refusing to overwrite it'
  }

  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($RollbackSddlPath, $beforeSddl, $utf8)
  $rollbackItem = Get-Item -LiteralPath $RollbackSddlPath -Force -ErrorAction Stop
  Assert-NoReparsePointInExistingPath -LiteralPath $rollbackItem.FullName
  $rollbackRestrictedAcl = New-OwnerSystemAdministratorsFileAcl `
    -OwnerSid (New-Object Security.Principal.SecurityIdentifier($ExpectedOwnerSid))
  Set-Acl -LiteralPath $rollbackItem.FullName -AclObject $rollbackRestrictedAcl
  $rollbackAcl = Get-Acl -LiteralPath $rollbackItem.FullName
  Assert-OwnerSystemAdministratorsFullControlAcl `
    -Acl $rollbackAcl -OwnerSid $ExpectedOwnerSid -RequireProtected
  $rollbackSddl = [IO.File]::ReadAllText($rollbackItem.FullName).Trim()
  $rollbackSddlSha256 = Get-Utf8Sha256String -Value $rollbackSddl
  if ($rollbackSddlSha256 -cne $ExpectedBeforeSddlSha256) {
    throw 'written rollback descriptor does not match original ACL pin'
  }

  if (-not [string]::IsNullOrEmpty($PauseForDismountDrive)) {
    Confirm-ApprovedDriveDismounted `
      -Drive $PauseForDismountDrive `
      -Confirmation $DismountConfirmation
  }

  $ownerSid = New-Object Security.Principal.SecurityIdentifier($ExpectedOwnerSid)
  $restrictedAcl = New-OwnerSystemAdministratorsFileAcl -OwnerSid $ownerSid
  try {
    Set-Acl -LiteralPath $containerItem.FullName -AclObject $restrictedAcl
    $observedAcl = Get-Acl -LiteralPath $containerItem.FullName
    Assert-OwnerSystemAdministratorsFullControlAcl `
      -Acl $observedAcl -OwnerSid $ExpectedOwnerSid -RequireProtected
    $afterSddlSha256 = Get-Utf8Sha256String -Value (Get-PortableFileSecuritySddl -Acl $observedAcl)
  }
  catch {
    $applyError = $_.Exception.Message
    Restore-FileAclFromPortableSddl `
      -LiteralPath $containerItem.FullName `
      -PortableSddl $beforeSddl `
      -ExpectedOwnerSid $ExpectedOwnerSid
    $restoredAfterFailure = Get-Acl -LiteralPath $containerItem.FullName
    $restoredAfterFailureHash = Get-Utf8Sha256String -Value (
      Get-PortableFileSecuritySddl -Acl $restoredAfterFailure
    )
    if ($restoredAfterFailureHash -cne $ExpectedBeforeSddlSha256) {
      throw 'ACL apply failed and automatic rollback verification also failed'
    }
    throw ('ACL apply failed; original ACL was restored and verified: ' + $applyError)
  }

  [pscustomobject]@{
    mode = 'Apply'
    status = 'ACL_APPLY_VERIFIED'
    pathSha256 = $actualPathSha256
    beforeSddlSha256 = $actualCurrentSddlSha256
    afterSddlSha256 = $afterSddlSha256
    rollbackSddlSha256 = $rollbackSddlSha256
    exactApprovedPrincipals = $true
    mutationPerformed = $true
  } | ConvertTo-Json -Compress
  exit 0
}

if ([string]::IsNullOrEmpty($ExpectedRollbackSddlSha256)) {
  throw 'rollback requires ExpectedRollbackSddlSha256'
}
$rollbackItem = Get-Item -LiteralPath $RollbackSddlPath -Force -ErrorAction Stop
if ($rollbackItem.PSIsContainer) { throw 'rollback descriptor must be a file' }
Assert-NoReparsePointInExistingPath -LiteralPath $rollbackItem.FullName
$rollbackAcl = Get-Acl -LiteralPath $rollbackItem.FullName
Assert-OwnerSystemAdministratorsFullControlAcl `
  -Acl $rollbackAcl -OwnerSid $ExpectedOwnerSid -RequireProtected
$rollbackSddl = [IO.File]::ReadAllText($rollbackItem.FullName).Trim()
$rollbackSddlSha256 = Get-Utf8Sha256String -Value $rollbackSddl
if ($rollbackSddlSha256 -cne $ExpectedRollbackSddlSha256) {
  throw 'rollback descriptor hash mismatch'
}
if ($rollbackSddlSha256 -cne $ExpectedBeforeSddlSha256) {
  throw 'rollback descriptor is not the pinned original ACL'
}

if (-not [string]::IsNullOrEmpty($PauseForDismountDrive)) {
  Confirm-ApprovedDriveDismounted `
    -Drive $PauseForDismountDrive `
    -Confirmation $DismountConfirmation
}

Restore-FileAclFromPortableSddl `
  -LiteralPath $containerItem.FullName `
  -PortableSddl $rollbackSddl `
  -ExpectedOwnerSid $ExpectedOwnerSid
$restoredAcl = Get-Acl -LiteralPath $containerItem.FullName
$restoredSddlSha256 = Get-Utf8Sha256String -Value (Get-PortableFileSecuritySddl -Acl $restoredAcl)
if ($restoredSddlSha256 -cne $ExpectedBeforeSddlSha256) {
  throw 'rollback verification failed'
}
if ($restoredAcl.GetOwner([Security.Principal.SecurityIdentifier]).Value -cne $ExpectedOwnerSid) {
  throw 'rollback owner verification failed'
}

[pscustomobject]@{
  mode = 'Rollback'
  status = 'ACL_ROLLBACK_VERIFIED'
  pathSha256 = $actualPathSha256
  restoredSddlSha256 = $restoredSddlSha256
  ownerVerified = $true
  mutationPerformed = $true
} | ConvertTo-Json -Compress

[CmdletBinding()]
param()

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$common = Join-Path $scriptRoot 'AclPreflight.Common.ps1'
$sut = Join-Path $scriptRoot 'Invoke-ContainerAclPreflight.ps1'
. $common

function Assert-Equal {
  param($Expected, $Actual, [string]$Message)
  if ($Expected -cne $Actual) { throw "$Message; expected=$Expected actual=$Actual" }
}

function Assert-ThrowsLike {
  param([scriptblock]$Action, [string]$Pattern, [string]$Message)
  try {
    & $Action
  }
  catch {
    if ($_.Exception.Message -notlike $Pattern) {
      throw "$Message; unexpected error: $($_.Exception.Message)"
    }
    return
  }
  throw "$Message; expected failure did not occur"
}

if ($PSVersionTable.PSEdition -ne 'Desktop' -or $PSVersionTable.PSVersion.Major -ne 5) {
  throw 'tests must run under Windows PowerShell 5.1 Desktop'
}

Assert-Equal `
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' `
  (Get-Utf8Sha256String -Value '') `
  'empty UTF-8 SHA-256 mismatch'
Assert-Equal `
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' `
  (Get-Utf8Sha256String -Value 'abc') `
  'ASCII UTF-8 SHA-256 mismatch'
$unicodeValue = 'R:\' +
  [char]0x03b4 + [char]0x03bf + [char]0x03ba + [char]0x03b9 + [char]0x03bc + [char]0x03ae +
  '\' + [char]0x5bb9 + [char]0x5668 + '.hc'
Assert-Equal `
  '7615246e5f39d9e1c07ea0efe6ad01d7f03a74730df6bce0a150d7bd67612eb9' `
  (Get-Utf8Sha256String -Value $unicodeValue) `
  'Unicode UTF-8 SHA-256 mismatch'

$scratch = Join-Path ([IO.Path]::GetTempPath()) ('ruins-010b1-acl-005-' + [Guid]::NewGuid().ToString('N'))
$rollbackRoot = Join-Path $scratch 'protected-rollback'
$testFile = Join-Path $scratch 'synthetic-container.bin'
$pathRecord = Join-Path $scratch 'container-path.txt'
$rollbackFile = Join-Path $rollbackRoot 'container-acl-before.sddl'
$ownerSid = [Security.Principal.WindowsIdentity]::GetCurrent().User

try {
  [void](New-Item -ItemType Directory -Path $scratch)
  [void](New-Item -ItemType Directory -Path $rollbackRoot)
  [IO.File]::WriteAllBytes($testFile, [byte[]](1, 3, 3, 7, 42))
  [IO.File]::WriteAllText($pathRecord, $testFile, (New-Object Text.UTF8Encoding($false)))

  $rollbackRootAcl = Get-Acl -LiteralPath $rollbackRoot
  $rollbackRootAcl.SetOwner($ownerSid)
  $rollbackRootAcl.SetAccessRuleProtection($true, $false)
  foreach ($rule in @($rollbackRootAcl.Access)) {
    [void]$rollbackRootAcl.RemoveAccessRuleSpecific($rule)
  }
  foreach ($sidValue in @($ownerSid.Value, 'S-1-5-18', 'S-1-5-32-544')) {
    $sid = New-Object Security.Principal.SecurityIdentifier($sidValue)
    $rule = New-Object Security.AccessControl.FileSystemAccessRule(
      $sid,
      [Security.AccessControl.FileSystemRights]::FullControl,
      [Security.AccessControl.InheritanceFlags]'ContainerInherit, ObjectInherit',
      [Security.AccessControl.PropagationFlags]::None,
      [Security.AccessControl.AccessControlType]::Allow
    )
    [void]$rollbackRootAcl.AddAccessRule($rule)
  }
  Set-Acl -LiteralPath $rollbackRoot -AclObject $rollbackRootAcl

  $pathSha = Get-Utf8Sha256String -Value $testFile
  $originalAcl = Get-Acl -LiteralPath $testFile
  $originalSddlSha = Get-Utf8Sha256String -Value (Get-PortableFileSecuritySddl -Acl $originalAcl)
  $root = [IO.Path]::GetPathRoot($testFile)
  $commonArgs = @{
    PathRecord = $pathRecord
    ExpectedPathSha256 = $pathSha
    ExpectedLength = 5
    ExpectedDriveRoot = $root
    ExpectedOwnerSid = $ownerSid.Value
    ExpectedBeforeSddlSha256 = $originalSddlSha
    ExpectedCurrentSddlSha256 = $originalSddlSha
    RollbackSddlPath = $rollbackFile
  }

  $preview = (& $sut @commonArgs -Mode Preview) | ConvertFrom-Json
  Assert-Equal 'ACL_PREFLIGHT_PASS' $preview.status 'preview status mismatch'
  Assert-Equal $false $preview.mutationPerformed 'preview mutated state'

  $wrongPathArgs = $commonArgs.Clone()
  $wrongPathArgs.ExpectedPathSha256 = ('0' * 64)
  Assert-ThrowsLike { & $sut @wrongPathArgs -Mode Preview } '*container path pin mismatch*' 'wrong path hash control'

  $wrongSddlArgs = $commonArgs.Clone()
  $wrongSddlArgs.ExpectedCurrentSddlSha256 = ('0' * 64)
  Assert-ThrowsLike { & $sut @wrongSddlArgs -Mode Preview } '*container ACL hash mismatch*' 'wrong SDDL hash control'

  $wrongLengthArgs = $commonArgs.Clone()
  $wrongLengthArgs.ExpectedLength = 6
  Assert-ThrowsLike { & $sut @wrongLengthArgs -Mode Preview } '*container length mismatch*' 'unexpected file identity control'

  $wrongOwnerArgs = $commonArgs.Clone()
  $wrongOwnerArgs.ExpectedOwnerSid = 'S-1-5-18'
  Assert-ThrowsLike { & $sut @wrongOwnerArgs -Mode Preview } '*container owner mismatch*' 'wrong owner control'

  Assert-ThrowsLike { & $sut @commonArgs -Mode Apply } '*mutation mode requires OwnerAuthorizedMutation*' 'authorization boundary control'

  $apply = (& $sut @commonArgs -Mode Apply -PauseForDismountDrive 'Z:' -DismountConfirmation 'Z: DISMOUNTED' -OwnerAuthorizedMutation) | ConvertFrom-Json
  Assert-Equal 'ACL_APPLY_VERIFIED' $apply.status 'apply status mismatch'
  $afterAcl = Get-Acl -LiteralPath $testFile
  Assert-OwnerSystemAdministratorsFullControlAcl `
    -Acl $afterAcl -OwnerSid $ownerSid.Value -RequireProtected
  $afterSddlSha = Get-Utf8Sha256String -Value (Get-PortableFileSecuritySddl -Acl $afterAcl)
  Assert-Equal $apply.afterSddlSha256 $afterSddlSha 'post-apply ACL hash mismatch'

  $rollbackArgs = $commonArgs.Clone()
  $rollbackArgs.ExpectedCurrentSddlSha256 = $afterSddlSha
  $rollbackArgs.ExpectedRollbackSddlSha256 = $apply.rollbackSddlSha256
  $wrongRollbackArgs = $rollbackArgs.Clone()
  $wrongRollbackArgs.ExpectedRollbackSddlSha256 = ('0' * 64)
  Assert-ThrowsLike { & $sut @wrongRollbackArgs -Mode Rollback -OwnerAuthorizedMutation } '*rollback descriptor hash mismatch*' 'wrong rollback hash control'
  $rollback = (& $sut @rollbackArgs -Mode Rollback -PauseForDismountDrive 'Z:' -DismountConfirmation 'Z: DISMOUNTED' -OwnerAuthorizedMutation) | ConvertFrom-Json
  Assert-Equal 'ACL_ROLLBACK_VERIFIED' $rollback.status 'rollback status mismatch'
  $restoredAcl = Get-Acl -LiteralPath $testFile
  Assert-Equal $originalSddlSha (Get-Utf8Sha256String -Value (Get-PortableFileSecuritySddl -Acl $restoredAcl)) 'rollback did not restore exact ACL'

  [pscustomobject]@{
    status = 'POWERSHELL_5_1_ACL_TEST_PASS'
    powershell = $PSVersionTable.PSVersion.ToString()
    utf8Vectors = 3
    preview = $true
    wrongPathHashRejected = $true
    wrongSddlHashRejected = $true
    wrongFileIdentityRejected = $true
    wrongOwnerRejected = $true
    unauthorizedMutationRejected = $true
    dismountGuardExercised = $true
    applyVerified = $true
    wrongRollbackHashRejected = $true
    rollbackVerified = $true
    disposableFileOnly = $true
  } | ConvertTo-Json -Compress
}
finally {
  if (Test-Path -LiteralPath $scratch) {
    Remove-Item -LiteralPath $scratch -Recurse -Force
  }
}

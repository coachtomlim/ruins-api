Set-StrictMode -Version 2.0

function Get-Utf8Sha256String {
  param([Parameter(Mandatory = $true)][AllowEmptyString()][string]$Value)

  $utf8 = New-Object System.Text.UTF8Encoding($false)
  $sha256 = [Security.Cryptography.SHA256]::Create()
  try {
    $bytes = $utf8.GetBytes($Value)
    $digest = $sha256.ComputeHash($bytes)
    return ([BitConverter]::ToString($digest).Replace('-', '').ToLowerInvariant())
  }
  finally {
    $sha256.Dispose()
  }
}

function Assert-Sha256Value {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Value
  )

  if ($Value -cnotmatch '^[0-9a-f]{64}$') {
    throw "$Name must be a lowercase SHA-256 value"
  }
}

function Get-PortableFileSecuritySddl {
  param([Parameter(Mandatory = $true)][Security.AccessControl.FileSystemSecurity]$Acl)

  $sections = [Security.AccessControl.AccessControlSections]::Owner -bor
    [Security.AccessControl.AccessControlSections]::Group -bor
    [Security.AccessControl.AccessControlSections]::Access
  return $Acl.GetSecurityDescriptorSddlForm($sections)
}

function Assert-NoReparsePointInExistingPath {
  param([Parameter(Mandatory = $true)][string]$LiteralPath)

  $item = Get-Item -LiteralPath $LiteralPath -Force -ErrorAction Stop
  while ($null -ne $item) {
    if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw 'reparse point is forbidden in an approved ACL path'
    }
    $parent = $item.PSParentPath
    if ([string]::IsNullOrEmpty($parent)) { break }
    try {
      $item = Get-Item -LiteralPath $parent -Force -ErrorAction Stop
    }
    catch {
      break
    }
  }
}

function Get-RuleIdentitySid {
  param([Parameter(Mandatory = $true)]$Rule)

  return $Rule.IdentityReference.Translate(
    [Security.Principal.SecurityIdentifier]
  ).Value
}

function Assert-OwnerSystemAdministratorsFullControlAcl {
  param(
    [Parameter(Mandatory = $true)][Security.AccessControl.FileSystemSecurity]$Acl,
    [Parameter(Mandatory = $true)][string]$OwnerSid,
    [switch]$RequireProtected
  )

  if ($RequireProtected -and -not $Acl.AreAccessRulesProtected) {
    throw 'ACL inheritance is not protected'
  }

  $allowed = @($OwnerSid, 'S-1-5-18', 'S-1-5-32-544')
  $seen = @{}
  foreach ($rule in @($Acl.Access)) {
    $sid = Get-RuleIdentitySid -Rule $rule
    if ($allowed -notcontains $sid) { throw 'ACL contains an unexpected principal' }
    if ($rule.AccessControlType -ne [Security.AccessControl.AccessControlType]::Allow) {
      throw 'ACL contains a non-Allow rule'
    }
    if (($rule.FileSystemRights -band [Security.AccessControl.FileSystemRights]::FullControl) -ne
        [Security.AccessControl.FileSystemRights]::FullControl) {
      throw 'ACL contains a rule without FullControl'
    }
    $seen[$sid] = $true
  }

  foreach ($sid in $allowed) {
    if (-not $seen.ContainsKey($sid)) { throw 'ACL is missing an approved principal' }
  }
  if ($seen.Count -ne 3) { throw 'ACL principal count is not exactly three' }
}

function New-OwnerSystemAdministratorsFileAcl {
  param([Parameter(Mandatory = $true)][Security.Principal.SecurityIdentifier]$OwnerSid)

  $acl = New-Object Security.AccessControl.FileSecurity
  $acl.SetOwner($OwnerSid)
  $acl.SetAccessRuleProtection($true, $false)
  foreach ($sidValue in @($OwnerSid.Value, 'S-1-5-18', 'S-1-5-32-544')) {
    $sid = New-Object Security.Principal.SecurityIdentifier($sidValue)
    $rule = New-Object Security.AccessControl.FileSystemAccessRule(
      $sid,
      [Security.AccessControl.FileSystemRights]::FullControl,
      [Security.AccessControl.AccessControlType]::Allow
    )
    [void]$acl.AddAccessRule($rule)
  }
  return $acl
}

function Restore-FileAclFromPortableSddl {
  param(
    [Parameter(Mandatory = $true)][string]$LiteralPath,
    [Parameter(Mandatory = $true)][string]$PortableSddl,
    [Parameter(Mandatory = $true)][string]$ExpectedOwnerSid
  )

  $descriptor = New-Object Security.AccessControl.FileSecurity
  $sections = [Security.AccessControl.AccessControlSections]::Owner -bor
    [Security.AccessControl.AccessControlSections]::Group -bor
    [Security.AccessControl.AccessControlSections]::Access
  $descriptor.SetSecurityDescriptorSddlForm($PortableSddl, $sections)

  $restoreAcl = New-Object Security.AccessControl.FileSecurity
  $restoreOwnerSid = New-Object Security.Principal.SecurityIdentifier($ExpectedOwnerSid)
  $restoreAcl.SetOwner($restoreOwnerSid)
  $restoreAcl.SetAccessRuleProtection($descriptor.AreAccessRulesProtected, $false)
  foreach ($rule in @($descriptor.Access)) {
    if ($rule.IsInherited) { continue }
    $sid = $rule.IdentityReference.Translate([Security.Principal.SecurityIdentifier])
    $copy = New-Object Security.AccessControl.FileSystemAccessRule(
      $sid,
      $rule.FileSystemRights,
      $rule.InheritanceFlags,
      $rule.PropagationFlags,
      $rule.AccessControlType
    )
    [void]$restoreAcl.AddAccessRule($copy)
  }
  [IO.File]::SetAccessControl($LiteralPath, $restoreAcl)
}

function Confirm-ApprovedDriveDismounted {
  param(
    [Parameter(Mandatory = $true)][string]$Drive,
    [string]$Confirmation
  )

  $expectedConfirmation = $Drive.ToUpperInvariant() + ' DISMOUNTED'
  $receivedConfirmation = $Confirmation
  if ([string]::IsNullOrEmpty($receivedConfirmation)) {
    Write-Host ('Owner: cleanly dismount {0} in VeraCrypt, then return here.' -f $Drive)
    $receivedConfirmation = Read-Host ('Type exactly "{0}" after the dismount completes' -f $expectedConfirmation)
  }
  if ($receivedConfirmation -cne $expectedConfirmation) {
    throw 'dismount confirmation mismatch; container ACL was not changed'
  }
  $mountedRoot = $Drive + '\'
  if (Test-Path -LiteralPath $mountedRoot) {
    throw 'mounted VeraCrypt drive is still present; container ACL was not changed'
  }
}

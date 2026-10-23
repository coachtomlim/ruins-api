param([Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$ExpectedManifestSha256)
Set-StrictMode -Version 2.0;$ErrorActionPreference='Stop'
& (Join-Path $PSScriptRoot 'verify-bundle.ps1') -ExpectedManifestSha256 $ExpectedManifestSha256|Out-Null
. (Join-Path $PSScriptRoot 'lib-010b1.ps1')
Assert-EncryptedMount
if((Get-FullPath $AllowedRoot)-ne'R:\010b1\codex-independent-002'){throw 'STOP: refusing to change ACL on an unexpected path.'}
try{Assert-WorkspaceAcl;[pscustomobject]@{result='WORKSPACE_ACL_ALREADY_PROTECTED';path=$AllowedRoot};return}catch{}
$current=[Security.Principal.WindowsIdentity]::GetCurrent().User
$system=New-Object Security.Principal.SecurityIdentifier('S-1-5-18')
$admins=New-Object Security.Principal.SecurityIdentifier('S-1-5-32-544')
$acl=Get-Acl -LiteralPath $AllowedRoot
$acl.SetOwner($current);$acl.SetAccessRuleProtection($true,$false)
$acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])|ForEach-Object{[void]$acl.RemoveAccessRuleSpecific($_)}
$inherit=[Security.AccessControl.InheritanceFlags]'ContainerInherit, ObjectInherit';$prop=[Security.AccessControl.PropagationFlags]::None;$allow=[Security.AccessControl.AccessControlType]::Allow;$full=[Security.AccessControl.FileSystemRights]::FullControl
foreach($sid in @($current,$system,$admins)){$acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($sid,$full,$inherit,$prop,$allow)))}
Set-Acl -LiteralPath $AllowedRoot -AclObject $acl
Assert-WorkspaceAcl
[pscustomobject]@{result='WORKSPACE_ACL_PROTECTED';path=$AllowedRoot;ownerSid=$current.Value;allowedSids=@($current.Value,$system.Value,$admins.Value)}

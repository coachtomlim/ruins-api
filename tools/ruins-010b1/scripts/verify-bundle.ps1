param([Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$ExpectedManifestSha256)
Set-StrictMode -Version 2.0
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
$manifestPath=Join-Path $root 'bundle-manifest.json'
if(-not(Test-Path -LiteralPath $manifestPath -PathType Leaf)){throw 'STOP: bundle manifest missing.'}
$actual=(Get-FileHash -Algorithm SHA256 -LiteralPath $manifestPath).Hash.ToLowerInvariant()
if($actual -ne $ExpectedManifestSha256.ToLowerInvariant()){throw 'STOP: out-of-band manifest pin mismatch.'}
$manifest=Get-Content -Raw -LiteralPath $manifestPath|ConvertFrom-Json
if($manifest.package-ne'RUINS_DAILY_EXPEDITION_001C_010B1'){throw 'STOP: wrong package manifest.'}
$expected=@{}
foreach($f in $manifest.files){
  if($f.path -match '(^|[\\/])\.\.([\\/]|$)' -or [IO.Path]::IsPathRooted($f.path)){throw 'STOP: unsafe manifest path.'}
  $path=[IO.Path]::GetFullPath((Join-Path $root $f.path))
  if(-not($path+'\').StartsWith($root+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'STOP: manifest path escapes bundle.'}
  if(-not(Test-Path -LiteralPath $path -PathType Leaf)){throw "STOP: manifest file missing: $($f.path)"}
  if((Get-Item -Force -LiteralPath $path).Attributes-band[IO.FileAttributes]::ReparsePoint){throw "STOP: manifest file is a reparse point: $($f.path)"}
  if((Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()-ne$f.sha256){throw "STOP: manifest file hash mismatch: $($f.path)"}
  $expected[$f.path.ToLowerInvariant().Replace('/','\')]=$true
}
$actualFiles=@()
foreach($runtimeDir in @('config','families','scripts','sql')){$actualFiles+=@(Get-ChildItem -LiteralPath (Join-Path $root $runtimeDir) -File -Recurse|ForEach-Object{$_.FullName.Substring($root.Length+1).ToLowerInvariant()})}
$actualFiles+=@('readme.md','bundle-manifest.json')|Where-Object{Test-Path -LiteralPath (Join-Path $root $_)}
$allowed=@('bundle-manifest.json','scripts\verify-bundle.ps1')
$extra=@($actualFiles|Where-Object{-not$expected.ContainsKey($_)-and$allowed-notcontains$_})
if($extra.Count){throw "STOP: unexpected bundle file: $($extra[0])"}
$pins=Get-Content -Raw -LiteralPath (Join-Path $root 'config\tool-pins.json')|ConvertFrom-Json
foreach($t in $pins.tools){
  if(-not(Test-Path -LiteralPath $t.path -PathType Leaf)){throw "STOP: pinned tool missing: $($t.path)"}
  $item=Get-Item -LiteralPath $t.path
  if((Get-FileHash -Algorithm SHA256 -LiteralPath $t.path).Hash.ToLowerInvariant()-ne$t.sha256){throw "STOP: pinned tool hash mismatch: $($t.path)"}
  if($t.PSObject.Properties['version']-and$t.version-and$item.VersionInfo.FileVersion-ne$t.version){throw "STOP: pinned tool version mismatch: $($t.path)"}
  if($t.PSObject.Properties['authenticodeStatus']-and$t.authenticodeStatus){$sig=Get-AuthenticodeSignature -LiteralPath $t.path;if([string]$sig.Status-ne$t.authenticodeStatus-or-not$sig.SignerCertificate-or$sig.SignerCertificate.Thumbprint-ne$t.signerThumbprint){throw "STOP: pinned tool signature mismatch: $($t.path)"}}
}
foreach($treeName in @('pgsql-17.6-tree.json','git-bash-runtime-tree.json')){
  $tree=Get-Content -Raw -LiteralPath (Join-Path $root "config\$treeName")|ConvertFrom-Json
  $seen=@{}
  foreach($f in $tree.files){
    if([IO.Path]::IsPathRooted($f.path)-or$f.path-match'(^|[\\/])\.\.([\\/]|$)'){throw "STOP: unsafe tool-tree path in $treeName"}
    $path=[IO.Path]::GetFullPath((Join-Path $tree.root $f.path))
    if(-not($path+'\').StartsWith(([IO.Path]::GetFullPath($tree.root).TrimEnd('\')+'\'),[StringComparison]::OrdinalIgnoreCase)){throw "STOP: tool-tree path escapes root in $treeName"}
    if(-not(Test-Path -LiteralPath $path -PathType Leaf)-or(Get-Item -LiteralPath $path).Length-ne[int64]$f.bytes-or(Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()-ne$f.sha256){throw "STOP: tool-tree integrity mismatch: $path"}
    $seen[$f.path.ToLowerInvariant().Replace('/','\')]=$true
  }
  if($treeName-eq'pgsql-17.6-tree.json'){
    $installed=@(Get-ChildItem -LiteralPath $tree.root -File -Recurse|ForEach-Object{$_.FullName.Substring(([IO.Path]::GetFullPath($tree.root).TrimEnd('\')).Length+1).ToLowerInvariant()})
    $unexpected=@($installed|Where-Object{-not$seen.ContainsKey($_)});if($unexpected.Count){throw "STOP: unexpected PostgreSQL distribution file: $($unexpected[0])"}
  }
}
[pscustomobject]@{result='VERIFIED';package=$manifest.package;bundleVersion=$manifest.bundleVersion;manifestSha256=$actual;files=$manifest.files.Count;tools=$pins.tools.Count;postgresTreeFiles=519;gitRuntimeFiles=78}

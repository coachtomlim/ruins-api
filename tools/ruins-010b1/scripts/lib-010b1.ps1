Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
$script:BundleRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$script:Policy = Get-Content -Raw -LiteralPath (Join-Path $BundleRoot 'config\runtime-policy.json') | ConvertFrom-Json
$script:ToolPins = Get-Content -Raw -LiteralPath (Join-Path $BundleRoot 'config\tool-pins.json') | ConvertFrom-Json
$script:PgBin = 'R:\010b1\tools\pgsql\bin'
$script:Bash = 'C:\Program Files\Git\usr\bin\bash.exe'
$script:Families = Join-Path $BundleRoot 'families'
$script:Sql = Join-Path $BundleRoot 'sql'
$script:AllowedRoot = [IO.Path]::GetFullPath($Policy.workspaceRoot).TrimEnd('\')

if (-not ('Ruins010B1.Native' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
namespace Ruins010B1 { public static class Native {
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern uint QueryDosDevice(string name, StringBuilder target, int max);
}}
'@
}

function Get-Sha256([string]$Path) {
  (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

function Get-FullPath([string]$Path) {
  [IO.Path]::GetFullPath($Path).TrimEnd('\')
}

function Test-IsUnder([string]$Path, [string]$Parent) {
  $p = (Get-FullPath $Path) + '\'
  $r = (Get-FullPath $Parent) + '\'
  $p.StartsWith($r, [StringComparison]::OrdinalIgnoreCase)
}

function Assert-NoReparse([string]$Path, [switch]$IncludeChildren) {
  $full = Get-FullPath $Path
  $cursor = $full
  while (-not (Test-Path -LiteralPath $cursor)) {
    $next = Split-Path -Parent $cursor
    if (-not $next -or $next -eq $cursor) { throw "STOP: no existing ancestor for $full" }
    $cursor = $next
  }
  while ($cursor.Length -ge 3) {
    $item = Get-Item -Force -LiteralPath $cursor
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "STOP: reparse point is forbidden: $cursor" }
    $next = Split-Path -Parent $cursor
    if (-not $next -or $next -eq $cursor) { break }
    $cursor = $next
  }
  if ($IncludeChildren -and (Test-Path -LiteralPath $full -PathType Container)) {
    $link = Get-ChildItem -Force -LiteralPath $full -Recurse -ErrorAction Stop | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint } | Select-Object -First 1
    if ($link) { throw "STOP: reparse point is forbidden: $($link.FullName)" }
  }
}

function Assert-EncryptedPath([string]$Path, [switch]$IncludeChildren) {
  $full = Get-FullPath $Path
  if ($full -ne $AllowedRoot -and -not (Test-IsUnder $full $AllowedRoot)) { throw "STOP: path is outside the encrypted workspace: $full" }
  Assert-NoReparse $full -IncludeChildren:$IncludeChildren
  $full
}

function Assert-EncryptedMount {
  $sb = New-Object Text.StringBuilder 1024
  $rc = [Ruins010B1.Native]::QueryDosDevice($Policy.encryptedDrive, $sb, $sb.Capacity)
  if ($rc -eq 0 -or $sb.ToString() -cne $Policy.encryptedDevice) { throw "STOP: R: is not the pinned VeraCrypt device." }
  $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='R:'"
  if (-not $disk -or $disk.FileSystem -ne 'NTFS' -or $disk.VolumeSerialNumber -ne $Policy.encryptedVolumeSerial) { throw 'STOP: encrypted volume identity mismatch.' }
  if ((Get-FullPath $BundleRoot) -ne $AllowedRoot) { throw "STOP: bundle must execute from $AllowedRoot" }
  $containerPathFile=Assert-EncryptedPath (Join-Path $AllowedRoot 'operator-input\container-path.txt')
  if(-not(Test-Path -LiteralPath $containerPathFile -PathType Leaf)-or(Get-Item -Force -LiteralPath $containerPathFile).Attributes-band[IO.FileAttributes]::ReparsePoint){throw 'STOP: local container path input is missing or unsafe.'}
  $containerPath=([IO.File]::ReadAllText($containerPathFile)).Trim()
  if(-not[IO.Path]::IsPathRooted($containerPath)-or(Get-ByteArraySha256 ([Text.Encoding]::UTF8.GetBytes($containerPath)))-ne$Policy.containerPathSha256){throw 'STOP: local container path identity mismatch.'}
  $container = Get-Item -Force -LiteralPath $containerPath
  if ($container.Attributes -band [IO.FileAttributes]::ReparsePoint -or $container.Length -ne [int64]$Policy.containerBytes) { throw 'STOP: VeraCrypt container metadata mismatch.' }
  Assert-NoReparse $AllowedRoot -IncludeChildren
}

function Assert-RestrictedAcl([string]$Path) {
  $full=Get-FullPath $Path
  $acl=Get-Acl -LiteralPath $full
  if(-not$acl.AreAccessRulesProtected){throw 'STOP: encrypted workspace ACL still inherits broad permissions.'}
  $ownerSid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
  $allowed=@($ownerSid,'S-1-5-18','S-1-5-32-544')
  $full=@{}
  foreach($rule in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){
    $sid=$rule.IdentityReference.Value
    if($rule.IsInherited-or$allowed-notcontains$sid){throw "STOP: encrypted workspace ACL contains an unapproved principal: $sid"}
    if($rule.AccessControlType-ne[Security.AccessControl.AccessControlType]::Allow){throw "STOP: encrypted workspace ACL contains a deny rule: $sid"}
    if(($rule.FileSystemRights-band[Security.AccessControl.FileSystemRights]::FullControl)-eq[Security.AccessControl.FileSystemRights]::FullControl){$full[$sid]=$true}
  }
  foreach($sid in $allowed){if(-not$full.ContainsKey($sid)){throw "STOP: encrypted workspace ACL lacks FullControl for required principal: $sid"}}
}

function Assert-WorkspaceAcl { Assert-RestrictedAcl $AllowedRoot }

function Get-ByteArraySha256([byte[]]$Bytes) {
  $sha=[Security.Cryptography.SHA256]::Create()
  try {-join ($sha.ComputeHash($Bytes)|ForEach-Object{$_.ToString('x2')})} finally {$sha.Dispose()}
}

function Assert-SupabaseRootCertificate {
  param([Parameter(Mandatory)][string]$Path,[Parameter(Mandatory)][string]$ExpectedFileSha256)
  $full=Assert-EncryptedPath $Path
  if(-not(Test-Path -LiteralPath $full -PathType Leaf)){throw 'STOP: Supabase root certificate is missing.'}
  if((Get-Item -Force -LiteralPath $full).Attributes-band[IO.FileAttributes]::ReparsePoint){throw 'STOP: Supabase root certificate is a reparse point.'}
  if((Get-Sha256 $full)-ne$ExpectedFileSha256.ToLowerInvariant()){throw 'STOP: Supabase root certificate pin mismatch.'}
  try{$cert=[Security.Cryptography.X509Certificates.X509Certificate2]::new([IO.File]::ReadAllBytes($full))}catch{throw 'STOP: Supabase root certificate is not a valid X.509 certificate.'}
  try{
    $der=Get-ByteArraySha256 $cert.RawData
    if($der-ne$Policy.supabaseCaDerSha256){throw 'STOP: Supabase root certificate identity mismatch.'}
    $now=(Get-Date).ToUniversalTime()
    if($cert.NotBefore.ToUniversalTime()-gt$now-or$cert.NotAfter.ToUniversalTime()-lt$now.AddDays(30)){throw 'STOP: Supabase root certificate is outside its approved validity window.'}
    if($cert.Subject-ne$cert.Issuer-or$cert.HasPrivateKey){throw 'STOP: Supabase trust anchor structure is invalid.'}
    $basic=$cert.Extensions|Where-Object{$_.Oid.Value-eq'2.5.29.19'}|Select-Object -First 1
    $usage=$cert.Extensions|Where-Object{$_.Oid.Value-eq'2.5.29.15'}|Select-Object -First 1
    if(-not$basic-or-not$usage){throw 'STOP: Supabase trust anchor constraints are missing.'}
    $basicTyped=New-Object Security.Cryptography.X509Certificates.X509BasicConstraintsExtension($basic,$basic.Critical)
    $usageTyped=New-Object Security.Cryptography.X509Certificates.X509KeyUsageExtension($usage,$usage.Critical)
    if(-not$basicTyped.CertificateAuthority-or-not($usageTyped.KeyUsages-band[Security.Cryptography.X509Certificates.X509KeyUsageFlags]::KeyCertSign)){throw 'STOP: Supabase trust anchor is not authorized to sign certificates.'}
    [pscustomobject]@{path=$full;fileSha256=(Get-Sha256 $full);derSha256=$der;subject=$cert.Subject;notAfterUtc=$cert.NotAfter.ToUniversalTime().ToString('o')}
  }finally{$cert.Dispose()}
}

function Assert-SupabaseSessionPoolerHost([string]$HostName) {
  $hostValue=if($null-eq$HostName){''}else{$HostName.Trim().ToLowerInvariant()}
  $region=[regex]::Escape([string]$Policy.supabaseRegion)
  if($hostValue-notmatch("^aws-[0-9]+-$region\.pooler\.supabase\.com$")){throw 'STOP: hostname is not the approved regional Supabase session pooler form.'}
  $hostValue
}

function Assert-EncryptedWorkspace { Assert-EncryptedMount;Assert-WorkspaceAcl }

function Assert-PrivateShell {
  if ($env:PGPASSWORD -or $env:PGPASSFILE -or $env:PGSERVICE) { throw 'STOP: inherited PostgreSQL credential/service variables are forbidden.' }
  foreach ($key in @(
    'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\Transcription',
    'HKCU:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\Transcription')) {
    if (Test-Path $key) {
      $v = Get-ItemProperty -LiteralPath $key
      if ($v.EnableTranscripting -eq 1) { throw 'STOP: PowerShell transcription policy is enabled.' }
    }
  }
}

function ConvertTo-CommandLine([string[]]$Values) {
  $quoted = foreach ($a in $Values) {
    if ($a -notmatch '[\s"]') { $a } else {
      $s = '"'; $slashes = 0
      foreach ($ch in $a.ToCharArray()) {
        if ($ch -eq '\') { $slashes++; continue }
        if ($ch -eq '"') { $s += ('\' * (2 * $slashes + 1)) + '"'; $slashes = 0; continue }
        if ($slashes) { $s += '\' * $slashes; $slashes = 0 }
        $s += $ch
      }
      $s += ('\' * (2 * $slashes)) + '"'; $s
    }
  }
  $quoted -join ' '
}

function Invoke-IsolatedProcess {
  param([Parameter(Mandatory)][string]$FilePath,[string[]]$Arguments=@(),[hashtable]$Environment=@{},[string]$StdoutPath,[string]$StderrPath)
  if (-not (Test-Path -LiteralPath $FilePath -PathType Leaf)) { throw "STOP: executable missing: $FilePath" }
  if ($StdoutPath) { [void](Assert-EncryptedPath $StdoutPath) }
  if ($StderrPath) { [void](Assert-EncryptedPath $StderrPath) }
  $psi = New-Object Diagnostics.ProcessStartInfo
  $psi.FileName = $FilePath; $psi.Arguments = ConvertTo-CommandLine $Arguments
  $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true
  $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true
  foreach ($name in @('PGPASSWORD','PGPASSFILE','PGSERVICE','PGHOST','PGPORT','PGUSER','PGDATABASE','PGSSLMODE','PGSSLROOTCERT','PGOPTIONS','PGAPPNAME','PGTARGETSESSIONATTRS')) { $psi.EnvironmentVariables.Remove($name) }
  foreach ($entry in $Environment.GetEnumerator()) { $psi.EnvironmentVariables[$entry.Key] = [string]$entry.Value }
  $p = New-Object Diagnostics.Process; $p.StartInfo = $psi
  $outFile = $null; $errFile = $null
  try {
    if (-not $p.Start()) { throw "STOP: could not start $FilePath" }
    if ($StdoutPath) { $outFile = [IO.File]::Open($StdoutPath,[IO.FileMode]::Create,[IO.FileAccess]::Write,[IO.FileShare]::None); $outTask = $p.StandardOutput.BaseStream.CopyToAsync($outFile) } else { $outTask = $p.StandardOutput.ReadToEndAsync() }
    if ($StderrPath) { $errFile = [IO.File]::Open($StderrPath,[IO.FileMode]::Create,[IO.FileAccess]::Write,[IO.FileShare]::None); $errTask = $p.StandardError.BaseStream.CopyToAsync($errFile) } else { $errTask = $p.StandardError.ReadToEndAsync() }
    $p.WaitForExit(); $outTask.Wait(); $errTask.Wait()
    $stdout = if ($StdoutPath) { $null } else { $outTask.Result }
    $stderr = if ($StderrPath) { $null } else { $errTask.Result }
    [pscustomobject]@{ ExitCode=$p.ExitCode; Stdout=$stdout; Stderr=$stderr }
  } finally { if($outFile){$outFile.Dispose()};if($errFile){$errFile.Dispose()};if($p){$p.Dispose()} }
}

function New-PgEnvironment {
  param([string]$HostName,[int]$Port,[string]$User,[string]$Password,[switch]$Local,[string]$RootCertificate)
  $e = @{
    PGHOST=$HostName; PGPORT="$Port"; PGUSER=$User; PGPASSWORD=$Password; PGDATABASE='postgres';
    PGAPPNAME='ruins-010b1-readonly-backup'; PGCONNECT_TIMEOUT='15'; PGTARGETSESSIONATTRS='read-only';
    PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=0 -c lock_timeout=15000'
  }
  if ($Local) { $e.PGSSLMODE='disable'; $e.Remove('PGTARGETSESSIONATTRS'); $e.PGOPTIONS='-c statement_timeout=0' }
  else { $e.PGSSLMODE='verify-full'; $e.PGSSLROOTCERT=$RootCertificate }
  $e
}

function Invoke-Psql {
  param([hashtable]$Connection,[string[]]$Arguments,[string]$StdoutPath,[string]$StderrPath)
  $r = Invoke-IsolatedProcess -FilePath (Join-Path $PgBin 'psql.exe') -Arguments (@('-X','-q','-v','ON_ERROR_STOP=1')+$Arguments) -Environment $Connection -StdoutPath $StdoutPath -StderrPath $StderrPath
  if ($r.ExitCode -ne 0) { throw "STOP: psql exited $($r.ExitCode)." }
  $r
}

function New-CryptoHex([int]$Bytes=32) {
  $b = New-Object byte[] $Bytes
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($b); -join ($b | ForEach-Object {$_.ToString('x2')}) } finally { $rng.Dispose();[Array]::Clear($b,0,$b.Length) }
}

function Quote-PgIdent([string]$Value) {
  if($Value.IndexOf([char]0)-ge0-or$Value-match'[\r\n]'){throw 'STOP: unsafe PostgreSQL identifier metadata.'}
  '"'+$Value.Replace('"','""')+'"'
}

function Read-HashManifest([string]$Path) {
  $m=@{}; foreach($line in [IO.File]::ReadLines($Path)){if(-not $line){continue};$p=$line -split "`t",4;if($p.Count-ne 4){throw "STOP: malformed private hash manifest."};$m[$p[0]]=[pscustomobject]@{kind=$p[1];count=$p[2];sha256=$p[3]}};$m
}

function Write-PrivateHashes {
  param([hashtable]$Connection,[string]$Directory,[string]$Tag)
  [void](Assert-EncryptedPath $Directory)
  $tables=Join-Path $Directory "scope-tables-$Tag.txt"; $seqs=Join-Path $Directory "scope-sequences-$Tag.txt"
  $tableSql="select quote_ident(n.nspname)||'.'||quote_ident(c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and (n.nspname !~ '^(information_schema|pg_.*|graphql|graphql_public|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_.*|_timescaledb_.*|topology|vault|etl|extensions|pgbouncer|realtime|_analytics|_realtime|_supavisor)$' or n.nspname='supabase_migrations') and (n.nspname||'.'||c.relname) not in ('auth.schema_migrations','storage.migrations','supabase_functions.migrations','storage.buckets_vectors','storage.vector_indexes') order by 1"
  $seqSql="select quote_ident(n.nspname)||'.'||quote_ident(c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='S' and (n.nspname !~ '^(information_schema|pg_.*|graphql|graphql_public|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_.*|_timescaledb_.*|topology|vault|etl|extensions|pgbouncer|realtime|_analytics|_realtime|_supavisor)$' or n.nspname='supabase_migrations') order by 1"
  Invoke-Psql $Connection @('-At','-c',$tableSql,'-o',$tables) | Out-Null
  Invoke-Psql $Connection @('-At','-c',$seqSql,'-o',$seqs) | Out-Null
  $manifest=Join-Path $Directory "PRIVATE-hashes-$Tag.tsv"; $writer=New-Object IO.StreamWriter($manifest,$false,(New-Object Text.UTF8Encoding($false)))
  try {
    foreach($kindFile in @(@('table',$tables),@('sequence',$seqs))){
      foreach($id in [IO.File]::ReadLines($kindFile[1])){
        if($id -match '[\r\n]' -or $id -notmatch '^(?:[a-z_][a-z0-9_$]*|"(?:[^"]|"")+")\.(?:[a-z_][a-z0-9_$]*|"(?:[^"]|"")+")$'){throw 'STOP: unsafe catalog identifier.'}
        $stream=Join-Path $Directory ("PRIVATE-stream-"+(New-CryptoHex 8)+'.tmp')
        try {
          if($kindFile[0]-eq 'table'){$q="copy (select replace(encode(convert_to(x::text,'UTF8'),'base64'), E'\n','') from $id x order by x::text collate `"C`") to stdout"}
          else{$q="copy (select last_value::text||'/'||is_called::text from $id) to stdout"}
          Invoke-Psql $Connection @('-At','-c',$q) -StdoutPath $stream | Out-Null
          $count=0;foreach($unused in [IO.File]::ReadLines($stream)){$count++}
          $writer.WriteLine("$id`t$($kindFile[0])`t$count`t$(Get-Sha256 $stream)")
        } finally { if(Test-Path $stream){Remove-Item -Force -LiteralPath $stream} }
      }
    }
  } finally {$writer.Dispose()}
  $manifest
}

function Compare-HashManifests([string]$SourcePath,[string]$TargetPath) {
  $sourceMap=Read-HashManifest $SourcePath;$targetMap=Read-HashManifest $TargetPath
  $missing=@($sourceMap.Keys|Where-Object{-not $targetMap.ContainsKey($_)});$extra=@($targetMap.Keys|Where-Object{-not $sourceMap.ContainsKey($_)});$changed=@($sourceMap.Keys|Where-Object{$targetMap.ContainsKey($_)-and($sourceMap[$_].count-ne$targetMap[$_].count-or$sourceMap[$_].sha256-ne$targetMap[$_].sha256)})
  [pscustomobject]@{A=$sourceMap.Count;B=$targetMap.Count;Missing=$missing.Count;Extra=$extra.Count;Changed=$changed.Count;Equal=($missing.Count+$extra.Count+$changed.Count -eq 0)}
}

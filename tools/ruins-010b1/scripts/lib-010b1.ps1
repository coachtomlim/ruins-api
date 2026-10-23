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

function Assert-EncryptedWorkspace {
  $sb = New-Object Text.StringBuilder 1024
  $rc = [Ruins010B1.Native]::QueryDosDevice($Policy.encryptedDrive, $sb, $sb.Capacity)
  if ($rc -eq 0 -or $sb.ToString() -cne $Policy.encryptedDevice) { throw "STOP: R: is not the pinned VeraCrypt device." }
  $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='R:'"
  if (-not $disk -or $disk.FileSystem -ne 'NTFS' -or $disk.VolumeSerialNumber -ne $Policy.encryptedVolumeSerial) { throw 'STOP: encrypted volume identity mismatch.' }
  if ((Get-FullPath $BundleRoot) -ne $AllowedRoot) { throw "STOP: bundle must execute from $AllowedRoot" }
  $container = Get-Item -Force -LiteralPath $Policy.containerPath
  if ($container.Attributes -band [IO.FileAttributes]::ReparsePoint -or $container.Length -ne [int64]$Policy.containerBytes) { throw 'STOP: VeraCrypt container metadata mismatch.' }
  Assert-NoReparse $AllowedRoot -IncludeChildren
}

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

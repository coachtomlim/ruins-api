param(
  [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$ExpectedManifestSha256,
  [switch]$SyntheticTest,
  [int]$SyntheticPort=0,
  [Security.SecureString]$SyntheticPassword,
  [string]$RootCertificate,
  [ValidatePattern('^[0-9a-fA-F]{64}$')][string]$ExpectedRootCertificateSha256
)
Set-StrictMode -Version 2.0;$ErrorActionPreference='Stop'
$verify=& (Join-Path $PSScriptRoot 'verify-bundle.ps1') -ExpectedManifestSha256 $ExpectedManifestSha256
. (Join-Path $PSScriptRoot 'lib-010b1.ps1')
Assert-EncryptedWorkspace;Assert-PrivateShell
$ProjectRef=$Policy.projectRef
$PlatformRegex='^(information_schema|pg_.*|_analytics|_realtime|_supavisor|auth|etl|extensions|pgbouncer|realtime|storage|supabase_functions|supabase_migrations|cron|dbdev|graphql|graphql_public|net|pgmq|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_.*|_timescaledb_.*|topology|vault)$'
$expectedSchemas=if($SyntheticTest){@($Policy.expectedSyntheticSchemas)}else{@($Policy.expectedLiveSchemas)}
$runId=(Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')+'-'+(New-CryptoHex 4)
$captureRoot=Join-Path $AllowedRoot $(if($SyntheticTest){'synthetic\captures'}else{'live\captures'})
[void](Assert-EncryptedPath $captureRoot)
$out=Join-Path $captureRoot $runId;$dump=Join-Path $out 'dump'
$summary=[ordered]@{package=$Policy.package;bundleVersion=$Policy.bundleVersion;bundleManifestSha256=$ExpectedManifestSha256.ToLowerInvariant();runId=$runId;mode=$(if($SyntheticTest){'SYNTHETIC_LOCAL_TEST'}else{'LIVE_STAGING'});targetProjectRef=$(if($SyntheticTest){'synthetic-local'}else{$ProjectRef});startedUtc=(Get-Date).ToUniversalTime().ToString('o');steps=[ordered]@{};result='INCOMPLETE'}
function Save-Summary{if($out-and(Test-Path -LiteralPath $out)){[IO.File]::WriteAllText((Join-Path $out 'summary-metadata.json'),($summary|ConvertTo-Json -Depth 10)+"`n",(New-Object Text.UTF8Encoding($false)))}}
$plain=$null;$secure=$null;$b=[IntPtr]::Zero;$conn=$null
try{
  if($SyntheticTest){
    if($SyntheticPort-le 0-or-not$SyntheticPassword){throw 'STOP: synthetic port and SecureString password are required.'}
    $secure=$SyntheticPassword;$hostName='127.0.0.1';$user='postgres'
  }else{
    if(-not$RootCertificate-or-not$ExpectedRootCertificateSha256){throw 'STOP: pinned Supabase root certificate is required before credential entry.'}
    $certPath=Assert-EncryptedPath $RootCertificate
    if(-not(Test-Path -LiteralPath $certPath -PathType Leaf)-or(Get-Sha256 $certPath)-ne$ExpectedRootCertificateSha256.ToLowerInvariant()){throw 'STOP: Supabase root certificate pin mismatch.'}
    $hostName=(Read-Host "Session pooler hostname for $ProjectRef").Trim()
    if($hostName-notmatch'^aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com$'){throw 'STOP: hostname is not an approved Supabase session pooler.'}
    $user="postgres.$ProjectRef";$secure=Read-Host 'Database password (hidden)' -AsSecureString
  }
  $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure);$plain=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)
  $conn=if($SyntheticTest){New-PgEnvironment $hostName $SyntheticPort $user $plain -Local}else{New-PgEnvironment $hostName 5432 $user $plain -RootCertificate $certPath}
  New-Item -ItemType Directory -Path $dump|Out-Null
  New-Item -ItemType Directory -Force -Path (Join-Path $AllowedRoot 'tmp')|Out-Null
  $conn.TMP=Join-Path $AllowedRoot 'tmp';$conn.TEMP=$conn.TMP
  $summary.steps.connection=[ordered]@{hostPatternValid=$true;projectScopedUser=(-not$SyntheticTest);port=$(if($SyntheticTest){$SyntheticPort}else{5432});tls=$(if($SyntheticTest){'disabled-localhost-only'}else{'verify-full'});rootCertificateSha256=$(if($SyntheticTest){$null}else{$ExpectedRootCertificateSha256.ToLowerInvariant()});readOnlyEnforced=$true}
  $preflight=Join-Path $out 'preflight.json';Invoke-Psql $conn @('-At','-f',(Join-Path $Sql 'F0-preflight.sql'),'-o',$preflight) -StderrPath (Join-Path $out 'F0.stderr.txt')|Out-Null
  $pf=Get-Content -Raw -LiteralPath $preflight|ConvertFrom-Json
  $userSchemas=@($pf.schemas|Where-Object{$_.name-notmatch$PlatformRegex}|ForEach-Object{$_.name}|Sort-Object)
  $schemaDiff=@(Compare-Object $userSchemas @($expectedSchemas|Sort-Object))
  $summary.steps.preflight=[ordered]@{serverVersion=$pf.serverVersion;serverVersionNum=$pf.serverVersionNum;readOnlyTransaction=$pf.transactionReadOnly;ruinsPrivateSchemaExists=$pf.ruinsPrivateSchemaExists;ruinsRoleCount=@($pf.ruinsRoles).Count;userSchemas=$userSchemas;expectedUserSchemas=$expectedSchemas;schemaDifferences=$schemaDiff.Count;roleCount=@($pf.roles).Count;extensionCount=@($pf.extensions).Count}
  if($pf.transactionReadOnly-ne'on'){throw 'STOP: preflight was not read-only.'}
  if($pf.database-ne'postgres'-or$pf.currentUser-ne$user){throw 'STOP: preflight identity does not match the authorized database user.'}
  if([int]$pf.serverVersionNum-lt170000-or[int]$pf.serverVersionNum-ge180000){throw "STOP: source is not PostgreSQL 17.x ($($pf.serverVersion))."}
  if($pf.ruinsPrivateSchemaExists-or@($pf.ruinsRoles).Count){throw 'STOP: source is not pre-r2.'}
  if($schemaDiff.Count){throw 'STOP: application schema set differs from authorization.'}
  Save-Summary
  $preHash=Write-PrivateHashes $conn $out 'source-pre'
  $scopeTables=Join-Path $out 'scope-tables-source-pre.txt';$scoped=@([IO.File]::ReadAllLines($scopeTables)|ForEach-Object{$_.Replace('"','')})
  $missingManaged=@($Policy.requiredManagedDataRelations|Where-Object{$scoped-notcontains$_})
  if($missingManaged.Count){throw "STOP: required managed/migration relation absent from data scope: $($missingManaged-join', ')"}
  $min=@{'F1-roles'=50;'F2-schema'=500;'F3-data'=500;'F4a-migrations-schema'=200;'F4b-migrations-data'=100}
  $summary.steps.dumps=[ordered]@{}
  foreach($name in @('F1-roles','F2-schema','F3-data','F4a-migrations-schema','F4b-migrations-data')){
    $file=Join-Path $dump "$name.sql";$err=Join-Path $dump "$name.stderr.txt"
    $envMap=@{};foreach($k in $conn.Keys){$envMap[$k]=$conn[$k]};$envMap.PATH="$PgBin;C:\Program Files\Git\usr\bin;C:\Program Files\Git\bin";$envMap.LC_ALL='C'
    $r=Invoke-IsolatedProcess $Bash @('--noprofile','--norc',(Join-Path $Families "$name.sh")) $envMap $file $err
    $size=(Get-Item -LiteralPath $file).Length;$summary.steps.dumps[$name]=[ordered]@{exit=$r.ExitCode;bytes=$size;sha256=Get-Sha256 $file;stderrBytes=(Get-Item -LiteralPath $err).Length;familySha256=Get-Sha256 (Join-Path $Families "$name.sh")};Save-Summary
    if($r.ExitCode-ne0-or$size-lt$min[$name]){throw "STOP: $name failed or produced implausibly small output."}
  }
  $f5=Join-Path $dump 'F5-provider-auth-storage-ddl.sql';$f5err=Join-Path $dump 'F5.stderr.txt'
  $r=Invoke-IsolatedProcess (Join-Path $PgBin 'pg_dump.exe') @('--schema-only','--quote-all-identifiers','--schema','auth','--schema','storage','-f',$f5) $conn $null $f5err
  $size=(Get-Item -LiteralPath $f5).Length;$summary.steps.dumps['F5-provider-auth-storage-ddl']=[ordered]@{exit=$r.ExitCode;bytes=$size;sha256=Get-Sha256 $f5;stderrBytes=(Get-Item -LiteralPath $f5err).Length}
  if($r.ExitCode-ne0-or$size-lt500){throw 'STOP: provider Auth/Storage DDL capture failed.'}
  $scope=(@($userSchemas)+@('auth','storage','supabase_migrations'))-join',';$inventory=Join-Path $out 'inventory-source.json'
  Invoke-Psql $conn @('-At','-v',"scope=$scope",'-f',(Join-Path $Sql 'F7-inventory.sql'),'-o',$inventory) -StderrPath (Join-Path $out 'F7.stderr.txt')|Out-Null
  $objects=@(Get-Content -Raw -LiteralPath $inventory|ConvertFrom-Json).Count;$summary.steps.inventory=[ordered]@{scope=$scope;objects=$objects}
  $postHash=Write-PrivateHashes $conn $out 'source-post';$stable=Compare-HashManifests $preHash $postHash
  $summary.steps.sourceStability=[ordered]@{objects=$stable.A;missing=$stable.Missing;extra=$stable.Extra;changed=$stable.Changed;stable=$stable.Equal}
  if(-not$stable.Equal){throw 'STOP: source changed during capture.'}
  $artifacts=@();$artifactNames=@('preflight.json','inventory-source.json','PRIVATE-hashes-source-pre.tsv','PRIVATE-hashes-source-post.tsv','scope-tables-source-pre.txt','scope-tables-source-post.txt','scope-sequences-source-pre.txt','scope-sequences-source-post.txt')+@($summary.steps.dumps.Keys|ForEach-Object{"dump/$_.sql"})
  foreach($rel in $artifactNames){$p=Join-Path $out $rel;if(-not(Test-Path -LiteralPath $p -PathType Leaf)){throw "STOP: required artifact missing: $rel"};$artifacts+=[ordered]@{path=$rel;bytes=(Get-Item -LiteralPath $p).Length;sha256=Get-Sha256 $p}}
  $artifactPath=Join-Path $out 'capture-artifacts.json';[IO.File]::WriteAllText($artifactPath,($artifacts|ConvertTo-Json -Depth 4)+"`n",(New-Object Text.UTF8Encoding($false)))
  $summary.artifactManifestSha256=Get-Sha256 $artifactPath;$summary.retentionDeleteAfterUtc=(Get-Date).ToUniversalTime().AddDays([int]$Policy.retentionDays).ToString('o');$summary.result='CAPTURE_COMPLETE'
}catch{$summary.result="STOPPED: $($_.Exception.Message)";throw}finally{
  if($b-ne[IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)}
  $plain=$null;$conn=$null;$secure=$null;[GC]::Collect();$summary.finishedUtc=(Get-Date).ToUniversalTime().ToString('o');Save-Summary
}
if($summary.result-eq'CAPTURE_COMPLETE'){
  [pscustomobject]@{result=$summary.result;runId=$summary.runId;captureDir=$out;artifactManifestSha256=$summary.artifactManifestSha256;objects=$summary.steps.inventory.objects;dataObjects=$summary.steps.sourceStability.objects;retentionDeleteAfterUtc=$summary.retentionDeleteAfterUtc}
}

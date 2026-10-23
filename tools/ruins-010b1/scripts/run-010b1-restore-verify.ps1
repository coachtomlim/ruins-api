param(
  [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$ExpectedManifestSha256,
  [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{64}$')][string]$ExpectedArtifactManifestSha256,
  [Parameter(Mandatory)][string]$CaptureDir,
  [switch]$KeepTarget
)
Set-StrictMode -Version 2.0;$ErrorActionPreference='Stop'
$verify=& (Join-Path $PSScriptRoot 'verify-bundle.ps1') -ExpectedManifestSha256 $ExpectedManifestSha256
. (Join-Path $PSScriptRoot 'lib-010b1.ps1')
Assert-EncryptedWorkspace;Assert-PrivateShell
$capture=Assert-EncryptedPath $CaptureDir -IncludeChildren
$liveRoot=Join-Path $AllowedRoot 'live\captures';$syntheticRoot=Join-Path $AllowedRoot 'synthetic\captures'
if(-not(Test-IsUnder $capture $liveRoot)-and-not(Test-IsUnder $capture $syntheticRoot)){throw 'STOP: CaptureDir is outside an approved encrypted capture root.'}
$requiredTop=@('summary-metadata.json','preflight.json','inventory-source.json','PRIVATE-hashes-source-pre.tsv','PRIVATE-hashes-source-post.tsv','capture-artifacts.json')
foreach($name in $requiredTop){if(-not(Test-Path -LiteralPath (Join-Path $capture $name)-PathType Leaf)){throw "STOP: capture is incomplete; missing $name"}}
$cap=Get-Content -Raw -LiteralPath (Join-Path $capture 'summary-metadata.json')|ConvertFrom-Json
if($cap.package-ne$Policy.package-or$cap.bundleVersion-ne$Policy.bundleVersion-or$cap.bundleManifestSha256-ne$ExpectedManifestSha256.ToLowerInvariant()){throw 'STOP: capture provenance mismatch.'}
if($cap.result-ne'CAPTURE_COMPLETE'){throw "STOP: capture is not complete ($($cap.result))."}
if($cap.mode-eq'LIVE_STAGING'-and$cap.targetProjectRef-ne$Policy.projectRef){throw 'STOP: capture has wrong project reference.'}
$artifactPath=Join-Path $capture 'capture-artifacts.json'
$artifactHash=Get-Sha256 $artifactPath
if($artifactHash-ne$cap.artifactManifestSha256-or$artifactHash-ne$ExpectedArtifactManifestSha256.ToLowerInvariant()){throw 'STOP: capture artifact manifest does not match the independently supplied pin.'}
$listed=@{};foreach($a in (Get-Content -Raw -LiteralPath $artifactPath|ConvertFrom-Json)){
  if([IO.Path]::IsPathRooted($a.path)-or$a.path-match'(^|[\\/])\.\.([\\/]|$)'){throw 'STOP: unsafe capture artifact path.'}
  $p=[IO.Path]::GetFullPath((Join-Path $capture $a.path));if(-not(Test-IsUnder $p $capture)){throw 'STOP: artifact escapes capture.'}
  if(-not(Test-Path -LiteralPath $p -PathType Leaf)-or(Get-Item -LiteralPath $p).Length-ne[int64]$a.bytes-or(Get-Sha256 $p)-ne$a.sha256){throw "STOP: capture artifact failed integrity validation: $($a.path)"}
  $listed[$a.path.ToLowerInvariant().Replace('/','\')]=$true
}
$expectedDump=@('f1-roles.sql','f2-schema.sql','f3-data.sql','f4a-migrations-schema.sql','f4b-migrations-data.sql','f5-provider-auth-storage-ddl.sql')
$actualDump=@(Get-ChildItem -LiteralPath (Join-Path $capture 'dump') -File -Filter '*.sql'|ForEach-Object{$_.Name.ToLowerInvariant()})
if(@(Compare-Object ($expectedDump|Sort-Object) ($actualDump|Sort-Object)).Count){throw 'STOP: dump SQL file set is incomplete or unexpected.'}
foreach($name in $expectedDump){if(-not$listed.ContainsKey("dump\$name")){throw "STOP: dump is not covered by artifact manifest: $name"}}
$stability=Compare-HashManifests (Join-Path $capture 'PRIVATE-hashes-source-pre.tsv') (Join-Path $capture 'PRIVATE-hashes-source-post.tsv')
if(-not$stability.Equal-or-not$cap.steps.sourceStability.stable){throw 'STOP: capture source stability evidence is invalid.'}
$pf=Get-Content -Raw -LiteralPath (Join-Path $capture 'preflight.json')|ConvertFrom-Json
$restore=Join-Path $capture ('restore-'+(Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')+'-'+(New-CryptoHex 4))
[void](Assert-EncryptedPath $restore);if(Test-Path -LiteralPath $restore){throw 'STOP: restore target already exists.'};New-Item -ItemType Directory -Path $restore|Out-Null
$data=Join-Path $restore 'pgdata';$verification=[ordered]@{package=$Policy.package;captureRunId=$cap.runId;captureArtifactManifestSha256=$cap.artifactManifestSha256;bundleManifestSha256=$ExpectedManifestSha256.ToLowerInvariant();startedUtc=(Get-Date).ToUniversalTime().ToString('o');steps=[ordered]@{};result='INCOMPLETE'}
function Save-Verification{[IO.File]::WriteAllText((Join-Path $capture 'restore-verification-metadata.json'),($verification|ConvertTo-Json -Depth 12)+"`n",(New-Object Text.UTF8Encoding($false)))}
$suPw=New-CryptoHex 32;$pgPw=New-CryptoHex 32;$pwFile=Join-Path $restore 'initpw';$srv=$null;$port=0
try{
  [IO.File]::WriteAllText($pwFile,$suPw,(New-Object Text.UTF8Encoding($false)))
  $r=Invoke-IsolatedProcess (Join-Path $PgBin 'initdb.exe') @('-D',$data,'-U','supabase_admin','--pwfile',$pwFile,'-A','scram-sha-256','-E','UTF8','--no-locale') @{} (Join-Path $restore 'initdb.log') (Join-Path $restore 'initdb.stderr.txt')
  Remove-Item -Force -LiteralPath $pwFile
  if($r.ExitCode-ne0){throw 'STOP: initdb failed.'}
  $listener=New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback,0);$listener.Start();$port=([Net.IPEndPoint]$listener.LocalEndpoint).Port;$listener.Stop()
  $srv=Start-Process -FilePath (Join-Path $PgBin 'postgres.exe') -ArgumentList @('-D',$data,'-p',"$port",'-c','listen_addresses=127.0.0.1','-c','fsync=on','-c','full_page_writes=on','-c','ssl=off') -PassThru -WindowStyle Hidden -RedirectStandardError (Join-Path $restore 'server.log')
  $super=New-PgEnvironment '127.0.0.1' $port 'supabase_admin' $suPw -Local;$ready=$false
  for($i=0;$i-lt100;$i++){try{Invoke-Psql $super @('-At','-c','select 1')|Out-Null;$ready=$true;break}catch{Start-Sleep -Milliseconds 200}}
  if(-not$ready-or$srv.HasExited){throw 'STOP: local PostgreSQL target did not become ready.'}
  $sqlL=New-Object Collections.Generic.List[string]
  foreach($role in $pf.roles){
    if($role.name-eq'supabase_admin'-or$role.name-notmatch'^(anon|authenticated|authenticator|cli_login_.*|dashboard_user|pgbouncer|postgres|service_role|supabase_.*|pgsodium_keyholder|pgsodium_keyiduser|pgsodium_keymaker|pgtle_admin)$'){continue}
    $id=Quote-PgIdent $role.name;$attrs=@($(if($role.login){'LOGIN'}else{'NOLOGIN'}),$(if($role.inherit){'INHERIT'}else{'NOINHERIT'}),$(if($role.createrole){'CREATEROLE'}else{'NOCREATEROLE'}),$(if($role.createdb){'CREATEDB'}else{'NOCREATEDB'}),$(if($role.bypassrls){'BYPASSRLS'}else{'NOBYPASSRLS'}),$(if($role.replication){'REPLICATION'}else{'NOREPLICATION'}),"CONNECTION LIMIT $([int]$role.connlimit)")-join' '
    $password=if($role.name-eq'postgres'){" PASSWORD '$pgPw'"}else{''};$sqlL.Add("CREATE ROLE $id NOSUPERUSER $attrs$password;")
  }
  foreach($m in $pf.memberships){
    if($m.role-notmatch'^(anon|authenticated|authenticator|cli_login_.*|dashboard_user|pgbouncer|postgres|service_role|supabase_.*|pgsodium_keyholder|pgsodium_keyiduser|pgsodium_keymaker|pgtle_admin)$'-or$m.member-notmatch'^(anon|authenticated|authenticator|cli_login_.*|dashboard_user|pgbouncer|postgres|service_role|supabase_.*|pgsodium_keyholder|pgsodium_keyiduser|pgsodium_keymaker|pgtle_admin)$'-or$m.role-eq'supabase_admin'-or$m.member-eq'supabase_admin'){continue}
    $sqlL.Add("GRANT $(Quote-PgIdent $m.role) TO $(Quote-PgIdent $m.member) WITH ADMIN $($m.admin.ToString().ToUpper()), INHERIT $($m.inherit.ToString().ToUpper()), SET $($m.set.ToString().ToUpper());")
  }
  $sqlL.Add('ALTER DATABASE postgres OWNER TO postgres;');$sqlL.Add('GRANT SET ON PARAMETER session_replication_role TO postgres;')
  $available=@((Invoke-Psql $super @('-At','-c','select name from pg_available_extensions')).Stdout.Trim()-split"`r?`n")
  $missingExt=@();foreach($ext in $pf.extensions){if($ext.name-eq'plpgsql'){continue};if($available-notcontains$ext.name){$missingExt+=$ext.name;continue};$schema=Quote-PgIdent $ext.schema;$sqlL.Add("CREATE SCHEMA IF NOT EXISTS $schema;");$sqlL.Add("CREATE EXTENSION IF NOT EXISTS $(Quote-PgIdent $ext.name) WITH SCHEMA $schema;")}
  $platform=Join-Path $restore 'platform-layer.sql';[IO.File]::WriteAllLines($platform,$sqlL,(New-Object Text.UTF8Encoding($false)));Invoke-Psql $super @('--single-transaction','-f',$platform) -StderrPath (Join-Path $restore 'platform.stderr.txt')|Out-Null
  $verification.steps.platform=[ordered]@{statements=$sqlL.Count;extensionsUnavailable=@($missingExt)};Save-Verification
  $dump=Join-Path $capture 'dump';Invoke-Psql $super @('--single-transaction','-f',(Join-Path $dump 'F5-provider-auth-storage-ddl.sql')) -StderrPath (Join-Path $restore 'F5.stderr.txt')|Out-Null
  $postgres=New-PgEnvironment '127.0.0.1' $port 'postgres' $pgPw -Local
  Invoke-Psql $postgres @('--single-transaction','-f',(Join-Path $dump 'F1-roles.sql'),'-f',(Join-Path $dump 'F2-schema.sql'),'-c','SET session_replication_role = replica','-f',(Join-Path $dump 'F3-data.sql')) -StderrPath (Join-Path $restore 'recipe.stderr.txt')|Out-Null
  Invoke-Psql $postgres @('--single-transaction','-f',(Join-Path $dump 'F4a-migrations-schema.sql'),'-f',(Join-Path $dump 'F4b-migrations-data.sql')) -StderrPath (Join-Path $restore 'migrations.stderr.txt')|Out-Null
  # PostgreSQL 16+ automatically grants a newly created role back to a CREATEROLE creator.
  # Supabase's role dump cannot express the absence of that grant, so remove only auto-grants absent at source.
  $cleanup=New-Object Collections.Generic.List[string]
  foreach($role in $pf.roles){
    if($role.name-match'^(anon|authenticated|authenticator|cli_login_.*|dashboard_user|pgbouncer|postgres|service_role|supabase_.*|pgsodium_keyholder|pgsodium_keyiduser|pgsodium_keymaker|pgtle_admin)$'){continue}
    if(@($pf.memberships|Where-Object{$_.role-eq$role.name-and$_.member-eq'postgres'}).Count-eq0){$cleanup.Add("REVOKE $(Quote-PgIdent $role.name) FROM postgres;")}
  }
  if($cleanup.Count){$cleanupPath=Join-Path $restore 'role-auto-grant-cleanup.sql';[IO.File]::WriteAllLines($cleanupPath,$cleanup,(New-Object Text.UTF8Encoding($false)));Invoke-Psql $super @('--single-transaction','-f',$cleanupPath)|Out-Null}
  $scope=$cap.steps.inventory.scope;$targetInventory=Join-Path $restore 'inventory-target.json';Invoke-Psql $super @('-At','-v',"scope=$scope",'-f',(Join-Path $Sql 'F7-inventory.sql'),'-o',$targetInventory)|Out-Null
  $targetPreflight=Join-Path $restore 'preflight-target.json';Invoke-Psql $super @('-At','-f',(Join-Path $Sql 'F0-preflight.sql'),'-o',$targetPreflight)|Out-Null
  $tpf=Get-Content -Raw -LiteralPath $targetPreflight|ConvertFrom-Json
  $targetHashes=Write-PrivateHashes $super $restore 'target';$dataCompare=Compare-HashManifests (Join-Path $capture 'PRIVATE-hashes-source-post.tsv') $targetHashes
  $src=@{};foreach($o in(Get-Content -Raw -LiteralPath (Join-Path $capture 'inventory-source.json')|ConvertFrom-Json)){$src["$($o.k)|$($o.obj)"]=$o.detail}
  $tgt=@{};foreach($o in(Get-Content -Raw -LiteralPath $targetInventory|ConvertFrom-Json)){$tgt["$($o.k)|$($o.obj)"]=$o.detail}
  $missing=@($src.Keys|Where-Object{-not$tgt.ContainsKey($_)});$extra=@($tgt.Keys|Where-Object{-not$src.ContainsKey($_)});$changed=@($src.Keys|Where-Object{$tgt.ContainsKey($_)-and$tgt[$_]-ne$src[$_]})
  $kinds=[ordered]@{};foreach($key in $src.Keys){$kind=$key.Split('|')[0];$kinds[$kind]=1+[int]$kinds[$kind]}
  $roleShape={param($r)@($r|Where-Object{$_.name-ne'supabase_admin'}|ForEach-Object{$super=if($_.name-eq'postgres'){$false}else{$_.super};"$($_.name)|$super|$($_.login)|$($_.inherit)|$($_.createrole)|$($_.createdb)|$($_.bypassrls)|$($_.replication)|$($_.connlimit)"}|Sort-Object)}
  $membershipShape={param($m)@($m|Where-Object{$_.role-ne'supabase_admin'-and$_.member-ne'supabase_admin'}|ForEach-Object{"$($_.role)|$($_.member)|$($_.admin)|$($_.inherit)|$($_.set)"}|Sort-Object)}
  $roleDiff=@(Compare-Object (&$roleShape $pf.roles) (&$roleShape $tpf.roles));$membershipDiff=@(Compare-Object (&$membershipShape $pf.memberships) (&$membershipShape $tpf.memberships))
  $extensionShape={param($e)@($e|ForEach-Object{"$($_.name)|$($_.version)|$($_.schema)"}|Sort-Object)};$extensionDiff=@(Compare-Object (&$extensionShape $pf.extensions) (&$extensionShape $tpf.extensions))
  $effectiveDiff=@($missing|Where-Object{$_-like'effective|*'}).Count+@($extra|Where-Object{$_-like'effective|*'}).Count+@($changed|Where-Object{$_-like'effective|*'}).Count
  $legacy=@('games','class_sessions','rooms','role_seats','network_tests','role_sessions','events','deliveries','control_state','branch_state','turn_states','control_snapshots')
  $legacyKeys=@($src.Keys|Where-Object{$key=$_;@($legacy|Where-Object{$key-eq"relation|sl_sim.$_ [r]"}).Count-gt0});$legacyMismatch=@($legacyKeys|Where-Object{-not$tgt.ContainsKey($_)-or$tgt[$_]-ne$src[$_]}).Count
  $sourceData=Read-HashManifest (Join-Path $capture 'PRIVATE-hashes-source-post.tsv');$authData=@($sourceData.Keys|Where-Object{$_-like'auth.*'}).Count;$storageData=@($sourceData.Keys|Where-Object{$_-like'storage.*'}).Count;$migrationData=@($sourceData.Keys|Where-Object{$_-like'supabase_migrations.*'}).Count
  $pwRecovered=[int](Invoke-Psql $super @('-At','-c',"select count(*) from pg_authid where rolpassword is not null and rolname not in ('supabase_admin','postgres')")).Stdout.Trim()
  $verification.steps.restore=[ordered]@{recipe='OK';migrationHistory='OK';providerDdl='OK'}
  $verification.steps.verification=[ordered]@{sourceObjects=$src.Count;targetObjects=$tgt.Count;sourceObjectsByKind=$kinds;missing=$missing.Count;extra=$extra.Count;changed=$changed.Count;effectivePrivilegeDifferences=$effectiveDiff;legacySlSimTablesCompared=$legacyKeys.Count;legacySlSimMismatches=$legacyMismatch;roleDefinitionDifferences=$roleDiff.Count;roleMembershipDifferences=$membershipDiff.Count;extensionDifferences=$extensionDiff.Count;dataObjects=$dataCompare.A;dataMissing=$dataCompare.Missing;dataExtra=$dataCompare.Extra;dataChanged=$dataCompare.Changed;authDataObjects=$authData;storageDataObjects=$storageData;migrationHistoryDataObjects=$migrationData;rolePasswordsRecovered=$pwRecovered;authContinuity='NOT_PROVEN';storageBinaries='OUT_OF_SCOPE';vault='OUT_OF_SCOPE'}
  [IO.File]::WriteAllLines((Join-Path $restore 'PRIVATE-diff-keys.txt'),@($missing+$extra+$changed),(New-Object Text.UTF8Encoding($false)))
  $ok=$missing.Count-eq0-and$extra.Count-eq0-and$changed.Count-eq0-and$dataCompare.Equal-and$pwRecovered-eq0-and$roleDiff.Count-eq0-and$membershipDiff.Count-eq0-and$extensionDiff.Count-eq0-and$legacyKeys.Count-eq12-and$legacyMismatch-eq0
  $verification.result=if($ok){'RESTORE_VERIFIED'}else{'RESTORE_MISMATCH'}
  if(-not$ok){throw 'STOP: restored target differs from source evidence.'}
}catch{if($verification.result-eq'INCOMPLETE'){$verification.result="STOPPED: $($_.Exception.Message)"};throw}finally{
  if(Test-Path -LiteralPath $pwFile){Remove-Item -Force -LiteralPath $pwFile}
  if($srv-and-not$srv.HasExited){Stop-Process -Id $srv.Id -ErrorAction SilentlyContinue;$srv.WaitForExit(10000)|Out-Null};if($srv){$srv.Dispose()}
  if(-not$KeepTarget-and(Test-Path -LiteralPath $data)){[void](Assert-EncryptedPath $data -IncludeChildren);Remove-Item -LiteralPath $data -Recurse -Force;$verification.disposableTargetDeleted=-not(Test-Path -LiteralPath $data)}
  $suPw=$null;$pgPw=$null;[GC]::Collect();$verification.finishedUtc=(Get-Date).ToUniversalTime().ToString('o');Save-Verification
}
if($verification.result-eq'RESTORE_VERIFIED'){
  [pscustomobject]@{result=$verification.result;captureRunId=$verification.captureRunId;sourceObjects=$verification.steps.verification.sourceObjects;targetObjects=$verification.steps.verification.targetObjects;dataObjects=$verification.steps.verification.dataObjects;missing=$verification.steps.verification.missing;extra=$verification.steps.verification.extra;changed=$verification.steps.verification.changed;dataChanged=$verification.steps.verification.dataChanged;effectivePrivilegeDifferences=$verification.steps.verification.effectivePrivilegeDifferences;legacySlSimTablesCompared=$verification.steps.verification.legacySlSimTablesCompared;legacySlSimMismatches=$verification.steps.verification.legacySlSimMismatches;roleDefinitionDifferences=$verification.steps.verification.roleDefinitionDifferences;roleMembershipDifferences=$verification.steps.verification.roleMembershipDifferences;rolePasswordsRecovered=$verification.steps.verification.rolePasswordsRecovered}
}

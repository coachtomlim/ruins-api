param(
  [Parameter(Mandatory)][ValidatePattern('^[0-9a-f]{64}$')][string]$ManifestSha256,
  [Parameter(Mandatory)][string]$RootCertificate,
  [Parameter(Mandatory)][ValidatePattern('^[0-9a-f]{64}$')][string]$ExpectedRootCertificateSha256,
  [switch]$Deploy
)
Set-StrictMode -Version 2.0;$ErrorActionPreference='Stop'
$sourceRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
$targetRoot='R:\010b1\codex-independent-002'
if($Deploy){
  if(-not(Test-Path -LiteralPath 'R:\010b1' -PathType Container)){throw 'R:\010b1 is unavailable.'}
  New-Item -ItemType Directory -Force -Path $targetRoot|Out-Null
  foreach($name in @('config','families','scripts','sql')){
    $dst=Join-Path $targetRoot $name
    if(Test-Path -LiteralPath $dst){if(-not([IO.Path]::GetFullPath($dst).StartsWith($targetRoot+'\',[StringComparison]::OrdinalIgnoreCase))){throw 'unsafe deployment target'};Remove-Item -LiteralPath $dst -Recurse -Force}
    Copy-Item -LiteralPath (Join-Path $sourceRoot $name) -Destination $dst -Recurse
  }
  foreach($name in @('README.md','bundle-manifest.json')){Copy-Item -Force -LiteralPath (Join-Path $sourceRoot $name) -Destination (Join-Path $targetRoot $name)}
}
$verify=Join-Path $targetRoot 'scripts\verify-bundle.ps1';& $verify -ExpectedManifestSha256 $ManifestSha256|Out-Null
& (Join-Path $targetRoot 'scripts\protect-workspace-acl.ps1') -ExpectedManifestSha256 $ManifestSha256|Out-Null
. (Join-Path $targetRoot 'scripts\lib-010b1.ps1');Assert-EncryptedWorkspace
$testId=(Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')+'-'+(New-CryptoHex 4)
$testRoot=Join-Path $targetRoot "synthetic\e2e\$testId";New-Item -ItemType Directory -Path $testRoot -Force|Out-Null
$sourceData=Join-Path $testRoot 'source-pgdata';$sourcePw=New-CryptoHex 32;$pwFile=Join-Path $testRoot 'source-initpw';$server=$null
$receipt=[ordered]@{package=$Policy.package;testId=$testId;postgresVersion=$Policy.postgresVersion;bundleManifestSha256=$ManifestSha256;tests=[ordered]@{};result='INCOMPLETE'}
try{
  [IO.File]::WriteAllText($pwFile,$sourcePw,(New-Object Text.UTF8Encoding($false)))
  $r=Invoke-IsolatedProcess (Join-Path $PgBin 'initdb.exe') @('-D',$sourceData,'-U','postgres','--pwfile',$pwFile,'-A','scram-sha-256','-E','UTF8','--no-locale') @{} (Join-Path $testRoot 'source-initdb.log') (Join-Path $testRoot 'source-initdb.stderr.txt');Remove-Item -Force -LiteralPath $pwFile
  if($r.ExitCode-ne0){throw 'source initdb failed'}
  $listener=New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback,0);$listener.Start();$port=([Net.IPEndPoint]$listener.LocalEndpoint).Port;$listener.Stop()
  $server=Start-Process -FilePath (Join-Path $PgBin 'postgres.exe') -ArgumentList @('-D',$sourceData,'-p',"$port",'-c','listen_addresses=127.0.0.1','-c','fsync=on','-c','full_page_writes=on','-c','ssl=off') -PassThru -WindowStyle Hidden -RedirectStandardError (Join-Path $testRoot 'source-server.log')
  $conn=New-PgEnvironment '127.0.0.1' $port 'postgres' $sourcePw -Local;$ready=$false
  for($i=0;$i-lt100;$i++){try{Invoke-Psql $conn @('-At','-c','select 1')|Out-Null;$ready=$true;break}catch{Start-Sleep -Milliseconds 200}}
  if(-not$ready){throw 'source server not ready'}
  Invoke-Psql $conn @('-f',(Join-Path $sourceRoot 'dev\synthetic-fixture.sql')) -StderrPath (Join-Path $testRoot 'fixture.stderr.txt')|Out-Null
  $secure=ConvertTo-SecureString $sourcePw -AsPlainText -Force
  $capture=& (Join-Path $targetRoot 'scripts\run-010b1-capture.ps1') -ExpectedManifestSha256 $ManifestSha256 -SyntheticTest -SyntheticPort $port -SyntheticPassword $secure
  $receipt.tests.capture=[ordered]@{result=$capture.result;objects=$capture.objects;dataObjects=$capture.dataObjects;artifactManifestSha256=$capture.artifactManifestSha256}
  $restore=& (Join-Path $targetRoot 'scripts\run-010b1-restore-verify.ps1') -ExpectedManifestSha256 $ManifestSha256 -ExpectedArtifactManifestSha256 $capture.artifactManifestSha256 -CaptureDir $capture.captureDir
  $receipt.tests.restore=$restore
  $wrongPinRejected=$false;try{& $verify -ExpectedManifestSha256 ('0'*64)|Out-Null}catch{$wrongPinRejected=$true}
  $receipt.tests.wrongBundlePinRejected=$wrongPinRejected
  $extra=Join-Path $targetRoot 'config\UNEXPECTED-TAMPER.txt';[IO.File]::WriteAllText($extra,'tamper');$extraRejected=$false;try{& $verify -ExpectedManifestSha256 $ManifestSha256|Out-Null}catch{$extraRejected=$true}finally{Remove-Item -Force -LiteralPath $extra}
  $receipt.tests.unexpectedBundleFileRejected=$extraRejected
  $sqlTamper=Join-Path $targetRoot 'sql\F0-preflight.sql';$original=[IO.File]::ReadAllBytes($sqlTamper);$sqlTamperRejected=$false
  try{[IO.File]::AppendAllText($sqlTamper,"`n-- adversarial mutation`n");try{& $verify -ExpectedManifestSha256 $ManifestSha256|Out-Null}catch{$sqlTamperRejected=$true}}finally{[IO.File]::WriteAllBytes($sqlTamper,$original)}
  $receipt.tests.sqlHashMutationRejected=$sqlTamperRejected
  $tamper=Join-Path $targetRoot "synthetic\captures\$($capture.runId)-tampered";Copy-Item -LiteralPath $capture.captureDir -Destination $tamper -Recurse
  [IO.File]::AppendAllText((Join-Path $tamper 'dump\F3-data.sql'),"`n-- adversarial mutation`n")
  $captureTamperRejected=$false;try{& (Join-Path $targetRoot 'scripts\run-010b1-restore-verify.ps1') -ExpectedManifestSha256 $ManifestSha256 -ExpectedArtifactManifestSha256 $capture.artifactManifestSha256 -CaptureDir $tamper|Out-Null}catch{$captureTamperRejected=$true}
  $receipt.tests.captureMutationRejectedBeforeRestore=$captureTamperRejected
  $outsideRejected=$false;try{& (Join-Path $targetRoot 'scripts\run-010b1-restore-verify.ps1') -ExpectedManifestSha256 $ManifestSha256 -ExpectedArtifactManifestSha256 ('0'*64) -CaptureDir $testRoot|Out-Null}catch{$outsideRejected=$true}
  $receipt.tests.outsideCaptureRootRejected=$outsideRejected
  $junction=Join-Path $targetRoot 'synthetic\captures\adversarial-junction';$junctionRejected=$false
  try{if(Test-Path -LiteralPath $junction){Remove-Item -Force -LiteralPath $junction};New-Item -ItemType Junction -Path $junction -Target $env:TEMP|Out-Null;try{& (Join-Path $targetRoot 'scripts\run-010b1-restore-verify.ps1') -ExpectedManifestSha256 $ManifestSha256 -ExpectedArtifactManifestSha256 ('0'*64) -CaptureDir $junction|Out-Null}catch{$junctionRejected=$true}}finally{if(Test-Path -LiteralPath $junction){Remove-Item -Force -LiteralPath $junction}}
  $receipt.tests.captureReparsePointRejected=$junctionRejected
  $receipt.tests.parentCredentialEnvironmentClean=(-not[bool]$env:PGPASSWORD-and-not[bool]$env:PGPASSFILE)
  $certEvidence=Assert-SupabaseRootCertificate -Path $RootCertificate -ExpectedFileSha256 $ExpectedRootCertificateSha256
  $receipt.tests.caIdentity=[ordered]@{fileSha256=$certEvidence.fileSha256;derSha256=$certEvidence.derSha256;notAfterUtc=$certEvidence.notAfterUtc}
  $wrongCaPinRejected=$false;try{Assert-SupabaseRootCertificate -Path $RootCertificate -ExpectedFileSha256 ('0'*64)|Out-Null}catch{$wrongCaPinRejected=$true}
  $receipt.tests.wrongCaPinRejected=$wrongCaPinRejected
  $badCert=Join-Path $testRoot 'malformed-ca.cer';[IO.File]::WriteAllText($badCert,'not a certificate',(New-Object Text.UTF8Encoding($false)));$malformedCaRejected=$false
  try{Assert-SupabaseRootCertificate -Path $badCert -ExpectedFileSha256 (Get-Sha256 $badCert)|Out-Null}catch{$malformedCaRejected=$true}
  $receipt.tests.malformedCaRejected=$malformedCaRejected
  $wrongHostRejected=$false;try{Assert-SupabaseSessionPoolerHost 'aws-0-ap-southeast-1.pooler.supabase.com.evil'|Out-Null}catch{$wrongHostRejected=$true}
  $receipt.tests.wrongHostnameRejected=$wrongHostRejected
  $aclProbe=Join-Path $testRoot 'inherited-acl-probe';New-Item -ItemType Directory -Path $aclProbe|Out-Null;$inheritedAclRejected=$false
  try{Assert-RestrictedAcl $aclProbe}catch{$inheritedAclRejected=$true}
  $receipt.tests.inheritedAclRejected=$inheritedAclRejected
  $containerInput=Join-Path $targetRoot 'operator-input\container-path.txt';$containerInputBytes=[IO.File]::ReadAllBytes($containerInput);$wrongContainerPathRejected=$false
  try{[IO.File]::WriteAllText($containerInput,'E:\nonexistent\wrong-container.hc',(New-Object Text.UTF8Encoding($false)));try{Assert-EncryptedMount}catch{$wrongContainerPathRejected=$true}}finally{[IO.File]::WriteAllBytes($containerInput,$containerInputBytes)}
  $receipt.tests.wrongContainerPathRejected=$wrongContainerPathRejected
  $captureRoot=Join-Path $targetRoot 'synthetic\captures';$beforeInterrupted=@(Get-ChildItem -LiteralPath $captureRoot -Directory -ErrorAction SilentlyContinue|ForEach-Object{$_.Name});$interruptedRejected=$false
  try{& (Join-Path $targetRoot 'scripts\run-010b1-capture.ps1') -ExpectedManifestSha256 $ManifestSha256 -SyntheticTest -SyntheticPort 1 -SyntheticPassword $secure|Out-Null}catch{$interruptedRejected=$true}
  $afterInterrupted=@(Get-ChildItem -LiteralPath $captureRoot -Directory -ErrorAction SilentlyContinue|Where-Object{$beforeInterrupted-notcontains$_.Name}|Sort-Object LastWriteTimeUtc -Descending)
  $interruptedSummary=if($afterInterrupted.Count){Join-Path $afterInterrupted[0].FullName 'summary-metadata.json'}else{$null}
  $interruptedFailsClosed=$interruptedRejected-and$interruptedSummary-and(Test-Path -LiteralPath $interruptedSummary)-and((Get-Content -Raw -LiteralPath $interruptedSummary|ConvertFrom-Json).result-like'STOPPED:*')-and-not(Test-Path -LiteralPath (Join-Path $afterInterrupted[0].FullName 'capture-artifacts.json'))
  $receipt.tests.interruptedExportFailsClosed=[bool]$interruptedFailsClosed
  $envCheck=New-PgEnvironment 'example.invalid' 5432 'postgres.example' 'not-a-real-secret' -RootCertificate (Join-Path $targetRoot 'operator-input\ca.cer')
  $receipt.tests.tlsPolicy=[ordered]@{sslmode=$envCheck.PGSSLMODE;hostnameVerification=($envCheck.PGSSLMODE-eq'verify-full');rootCertificateExplicit=[bool]$envCheck.PGSSLROOTCERT;targetSessionReadOnly=($envCheck.PGTARGETSESSIONATTRS-eq'read-only');serverReadOnly=($envCheck.PGOPTIONS-like'*default_transaction_read_only=on*')}
  $all=@($wrongPinRejected,$extraRejected,$sqlTamperRejected,$captureTamperRejected,$outsideRejected,$junctionRejected,$receipt.tests.parentCredentialEnvironmentClean,$wrongCaPinRejected,$malformedCaRejected,$wrongHostRejected,$inheritedAclRejected,$wrongContainerPathRejected,$interruptedFailsClosed,$restore.result-eq'RESTORE_VERIFIED',$envCheck.PGSSLMODE-eq'verify-full')
  $receipt.result=if($all-notcontains$false){'PASS'}else{'FAIL'}
}finally{
  if(Test-Path -LiteralPath $pwFile){Remove-Item -Force -LiteralPath $pwFile}
  if($server-and-not$server.HasExited){Stop-Process -Id $server.Id -ErrorAction SilentlyContinue;$server.WaitForExit(10000)|Out-Null};if($server){$server.Dispose()}
  if(Test-Path -LiteralPath $sourceData){[void](Assert-EncryptedPath $sourceData -IncludeChildren);Remove-Item -LiteralPath $sourceData -Recurse -Force}
  $sourcePw=$null;[GC]::Collect();$receipt.finishedUtc=(Get-Date).ToUniversalTime().ToString('o')
  [IO.File]::WriteAllText((Join-Path $testRoot 'synthetic-e2e-receipt.json'),($receipt|ConvertTo-Json -Depth 12)+"`n",(New-Object Text.UTF8Encoding($false)))
}
$receipt

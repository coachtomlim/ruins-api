param([Parameter(Mandatory)][string]$Root)
Set-StrictMode -Version 2.0;$ErrorActionPreference='Stop'
$rootFull=[IO.Path]::GetFullPath($Root).TrimEnd('\')
$include=@('config','families','scripts','sql','README.md')
$files=@()
foreach($name in $include){
  $p=Join-Path $rootFull $name;if(-not(Test-Path -LiteralPath $p)){continue}
  $items=if(Test-Path -LiteralPath $p -PathType Leaf){@(Get-Item -LiteralPath $p)}else{@(Get-ChildItem -LiteralPath $p -File -Recurse)}
  foreach($item in $items){
    $rel=$item.FullName.Substring($rootFull.Length+1).Replace('\','/')
    if($rel-eq'scripts/verify-bundle.ps1'){continue}
    $files+=[ordered]@{path=$rel;bytes=$item.Length;sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $item.FullName).Hash.ToLowerInvariant()}
  }
}
$doc=[ordered]@{package='RUINS_DAILY_EXPEDITION_001C_010B1';bundleVersion='codex-independent-002';files=@($files|Sort-Object path)}
$json=($doc|ConvertTo-Json -Depth 6).Replace("`r`n","`n")
[IO.File]::WriteAllText((Join-Path $rootFull 'bundle-manifest.json'),$json+"`n",(New-Object Text.UTF8Encoding($false)))

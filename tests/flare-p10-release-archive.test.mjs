import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';

const repoRoot=new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]):/,'$1:');
const read=p=>readFile(path.join(repoRoot,p),'utf8');

test('release and rollback archives + manifests exist',()=>{
  for(const f of [
    'docs/release/web-flare-p10-rc1-release.zip','docs/release/web-flare-p10-rc1-release.manifest.json',
    'docs/release/web-flare-update006-rollback.zip','docs/release/web-flare-update006-rollback.manifest.json'
  ])assert.ok(existsSync(path.join(repoRoot,f)),`missing ${f}`);
});

test('release archive manifest matches the P10 flare-s8b portion of the runtime manifest, excludes config.js, and has no zero-byte entries',async()=>{
  const archiveManifest=JSON.parse(await read('docs/release/web-flare-p10-rc1-release.manifest.json'));
  const runtimeManifest=JSON.parse(await read('docs/release/WEB-FLARE-RC1-MANIFEST.json'));
  const expected=runtimeManifest.files.filter(f=>f.path.startsWith('public/flare-s8b/')).length;
  assert.equal(archiveManifest.fileCount,expected);
  assert.ok(!archiveManifest.files.some(f=>f.path==='config.js'));
  for(const f of archiveManifest.files){
    assert.ok(f.bytes>0,`zero-byte archive entry: ${f.path}`);
    assert.match(f.sha256,/^[0-9a-f]{64}$/);
  }
});

test('release archive contains no real secret material (only known guard-regex references)',()=>{
  const outDir=path.join(repoRoot,'docs/release/_test-extract');
  execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
    `Expand-Archive -Path '${path.join(repoRoot,'docs/release/web-flare-p10-rc1-release.zip')}' -DestinationPath '${outDir}' -Force`]);
  try{
    const hits=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
      `Get-ChildItem -Recurse '${outDir}' -File | Select-String -Pattern 'service_role|sb_secret_' | Select-Object -ExpandProperty Line`
    ]).toString();
    const lines=hits.split(/\r?\n/).filter(Boolean);
    for(const line of lines){
      const isGuard=/startsWith\('sb_secret_'\)|==='service_role'|\/service_role\|sb_secret_|startsWith\(`sb_secret_`\)/.test(line);
      assert.ok(isGuard,`unexpected service_role/sb_secret_ reference in release archive, not a known guard pattern: ${line}`);
    }
  }finally{
    execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Remove-Item -Recurse -Force '${outDir}'`]);
  }
});

test('config.js is never present in either archive (it is generated per-deployment, never repo-tracked)',async()=>{
  const rel=JSON.parse(await read('docs/release/web-flare-p10-rc1-release.manifest.json'));
  const roll=JSON.parse(await read('docs/release/web-flare-update006-rollback.manifest.json'));
  assert.ok(!rel.files.some(f=>f.path.endsWith('config.js')));
  assert.ok(!roll.files.some(f=>f.path.endsWith('config.js')));
});

test('the fallback/rollback documentation exists and states the real database-migration rollback limitation',async()=>{
  const doc=await read('docs/release/DEPLOYMENT_FALLBACK_AND_ROLLBACK.md');
  assert.match(doc,/Back up first/);
  assert.match(doc,/Database migrations are not rolled back/);
  assert.match(doc,/has not been executed end-to-end against production/);
});

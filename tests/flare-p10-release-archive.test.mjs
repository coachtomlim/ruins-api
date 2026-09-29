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
    'docs/release/web-flare-friend-feedback-nav-001-release.zip','docs/release/web-flare-friend-feedback-nav-001-release.manifest.json',
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

test('config.js is never present in any release/rollback archive (it is deployment-generated)',async()=>{
  const rel=JSON.parse(await read('docs/release/web-flare-p10-rc1-release.manifest.json'));
  const friend=JSON.parse(await read('docs/release/web-flare-friend-feedback-nav-001-release.manifest.json'));
  const roll=JSON.parse(await read('docs/release/web-flare-update006-rollback.manifest.json'));
  assert.ok(!rel.files.some(f=>f.path.endsWith('config.js')));
  assert.ok(!friend.files.some(f=>f.path.endsWith('config.js')));
  assert.ok(!roll.files.some(f=>f.path.endsWith('config.js')));
});

test('the fallback/rollback documentation exists and states the real database-migration rollback limitation',async()=>{
  const doc=await read('docs/release/DEPLOYMENT_FALLBACK_AND_ROLLBACK.md');
  assert.match(doc,/Back up first/);
  assert.match(doc,/Database migrations are not rolled back/);
  assert.match(doc,/has not been executed end-to-end against production/);
});


test('friend-feedback multi-root archive matches the complete runtime manifest and its committed source tree',async()=>{
  const archiveManifest=JSON.parse(await read('docs/release/web-flare-friend-feedback-nav-001-release.manifest.json'));
  const runtimeManifest=JSON.parse(await read('docs/release/WEB-FLARE-RC1-MANIFEST.json'));
  assert.match(archiveManifest.sourceSha,/^[0-9a-f]{40}$/);
  execFileSync('git',['-C',repoRoot,'merge-base','--is-ancestor',archiveManifest.sourceSha,'HEAD']);
  assert.equal(archiveManifest.fileCount,runtimeManifest.fileCount);
  assert.equal(archiveManifest.files.length,runtimeManifest.files.length);
  for(const entry of runtimeManifest.files){
    const source=execFileSync('git',['-C',repoRoot,'show',`${archiveManifest.sourceSha}:${entry.path}`]);
    const sourceHash=createHash('sha256').update(source).digest('hex');
    assert.equal(sourceHash,entry.sha256,`runtime manifest does not match sourceSha for ${entry.path}`);
    const archived=archiveManifest.files.find(f=>f.path===entry.path.replace(/^public\//,''));
    assert.ok(archived,`archive manifest missing ${entry.path}`);
    assert.equal(archived.sha256,entry.sha256,`archive manifest hash mismatch for ${entry.path}`);
  }
  assert.ok(archiveManifest.files.some(f=>f.path==='flare-s8a/challenge.html'));
  assert.ok(archiveManifest.files.some(f=>f.path==='flare-s8a/index.html'));
  assert.ok(archiveManifest.files.some(f=>f.path==='flare-s8a/builder.mjs'));
  assert.ok(archiveManifest.files.some(f=>f.path==='flare-s8a/starter-runner-adapter.mjs'));
  assert.ok(archiveManifest.files.some(f=>f.path==='flare-s8a/result-receipt.mjs'));
  assert.ok(archiveManifest.files.some(f=>f.path==='flare-s8a/result-view-model.mjs'));
  assert.ok(!archiveManifest.files.some(f=>f.path.endsWith('config.js')));
});

test('friend-feedback archive contains the paths declared by its manifest',()=>{
  const outDir=path.join(repoRoot,'docs/release/_friend-test-extract');
  execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
    `Expand-Archive -Path '${path.join(repoRoot,'docs/release/web-flare-friend-feedback-nav-001-release.zip')}' -DestinationPath '${outDir}' -Force`]);
  try{
    const manifest=JSON.parse(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
      `Get-Content -Raw '${path.join(repoRoot,'docs/release/web-flare-friend-feedback-nav-001-release.manifest.json')}'`
    ]).toString());
    for(const entry of manifest.files)assert.ok(existsSync(path.join(outDir,entry.path)),`archive missing ${entry.path}`);
  }finally{
    execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Remove-Item -Recurse -Force '${outDir}'`]);
  }
});


test('release builder refuses worktree/runtime-manifest drift from the selected source SHA',async()=>{
  const src=await read('scripts/release/build-release-archive.mjs');
  assert.match(src,/Runtime manifest differs from committed source/);
  assert.match(src,/gitShow\(P10_SHA,entry\.path\)/);
  assert.match(src,/committedHash!==entry\.sha256/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('release identity exports a fixed, non-sensitive identifier with no credential or endpoint material',async()=>{
  const src=await read('public/flare-s8b/release-identity.mjs');
  assert.match(src,/RELEASE_ID='WEB-FLARE-RC1'/);
  assert.match(src,/RELEASE_SOURCE_SHA='[0-9a-f]{40}'/);
  assert.doesNotMatch(src,/service_role|sb_secret_|AI_ENCOUNTER_PROVIDER_KEY|CPANEL_API_TOKEN/i);
});

test('the Hub wires the release identity badge into its footer',async()=>{
  const html=await read('public/flare-s8b/index.html');
  const app=await read('public/flare-s8b/account-app.mjs');
  assert.match(html,/id="releaseIdentityBadge"/);
  assert.match(app,/releaseIdentityLabel/);
});

test('the runtime manifest generator produces a deterministic, non-empty, independently-traced file list',async()=>{
  const manifest=JSON.parse(await read('docs/release/WEB-FLARE-RC1-MANIFEST.json'));
  assert.equal(manifest.releaseId,'WEB-FLARE-RC1');
  assert.ok(manifest.fileCount>=45,'expected the P10 closure (S9 progression + P9/P10 AI files included) to exceed the old 19-file Update 006 list');
  assert.equal(manifest.files.length,manifest.fileCount);
  for(const entry of manifest.files){
    assert.match(entry.sha256,/^[0-9a-f]{64}$/,`bad sha256 for ${entry.path}`);
    assert.ok(entry.mime,`missing mime for ${entry.path}`);
    assert.ok(entry.bytes>0,`zero-byte file listed: ${entry.path}`);
  }
  // config.js is generated per-deployment, never repo-tracked — it must never appear in the manifest
  assert.ok(!manifest.files.some(f=>f.path.endsWith('config.js')));
  // every listed sha256 must match the actual file on disk right now (no stale/hand-edited entries)
  for(const entry of manifest.files){
    const buf=await readFile(new URL(`../${entry.path}`,import.meta.url));
    const actual=createHash('sha256').update(buf).digest('hex');
    assert.equal(actual,entry.sha256,`stale sha256 for ${entry.path} — rerun scripts/release/generate-manifest.mjs`);
  }
});

test('the manifest generator is deterministic: two consecutive runs produce byte-identical file lists (ignoring the timestamp)',()=>{
  const cwd=new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]):/,'$1:');
  execFileSync('node',['scripts/release/generate-manifest.mjs'],{cwd});
  const first=JSON.parse(execFileSync('node',['-e',"process.stdout.write(require('fs').readFileSync('docs/release/WEB-FLARE-RC1-MANIFEST.json','utf8'))"],{cwd}).toString());
  execFileSync('node',['scripts/release/generate-manifest.mjs'],{cwd});
  const second=JSON.parse(execFileSync('node',['-e',"process.stdout.write(require('fs').readFileSync('docs/release/WEB-FLARE-RC1-MANIFEST.json','utf8'))"],{cwd}).toString());
  assert.equal(first.fileCount,second.fileCount);
  assert.deepEqual(first.files,second.files);
});

test('the manifest excludes the older Update 006 HostGator helper and its frozen predecessor branch files',async()=>{
  const manifest=JSON.parse(await read('docs/release/WEB-FLARE-RC1-MANIFEST.json'));
  assert.ok(!manifest.files.some(f=>f.path.includes('hostgator-flare-s8b-update')));
});


test('runtime manifest includes the S8A friend receiver as a first-class release root and closure',async()=>{
  const manifest=JSON.parse(await read('docs/release/WEB-FLARE-RC1-MANIFEST.json'));
  assert.ok(Array.isArray(manifest.entryPoints));
  assert.ok(manifest.entryPoints.includes('public/flare-s8a/challenge.html'));
  for(const required of [
    'public/flare-s8a/challenge.html',
    'public/flare-s8a/challenge.mjs',
    'public/flare-s8a/invitation-view-model.mjs',
    'public/flare-s8a/result-receipt.mjs',
    'public/flare-s8a/result-view-model.mjs',
    'public/flare-s8a/style.css'
  ])assert.ok(manifest.files.some(f=>f.path===required),`missing S8A receiver dependency: ${required}`);
});

test('manifest generator maps site-absolute Quick Dungeon paths back into public runtime paths',async()=>{
  const src=await read('scripts/release/generate-manifest.mjs');
  assert.match(src,/clean\.startsWith\('\/quick-dungeon\/'\)/);
  assert.match(src,/return 'public\/'\+clean\.slice\('\/quick-dungeon\/'\.length\)/);
  assert.match(src,/public\/flare-s8a\/challenge\.html/);
  assert.match(src,/const fetches=/);
  assert.match(src,/while\(\(m=fetches\.exec\(src\)\)\)/);
  assert.match(src,/local\s*:/);
});

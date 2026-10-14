import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdtempSync,rmSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';

// 002E9G: HostGator/cPanel (Linux) extractors need POSIX member names. These tests inspect the RAW central-directory
// names with Python's zipfile and extract with it - they deliberately do NOT use PowerShell Expand-Archive, which
// tolerates the backslash names that broke the 002E9F deployment.
const repoRoot=new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]):/,'$1:').replace(/%20/g,' ');
const tool=path.join(repoRoot,'scripts/release/portable_zip.py');
const rel=p=>path.join(repoRoot,'docs/release',p);
function py(args){
  for(const exe of [process.env.PYTHON,'python','python3'].filter(Boolean)){
    try{return execFileSync(exe,[tool,...args],{encoding:'utf8',maxBuffer:64*1024*1024});}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  throw new Error('python not found');
}
const audit=zip=>JSON.parse(py(['audit',rel(zip)]));
const ARCHIVES=[
  ['web-flare-p10-rc1-release.zip','web-flare-p10-rc1-release.manifest.json'],
  ['web-flare-friend-feedback-nav-001-release.zip','web-flare-friend-feedback-nav-001-release.manifest.json'],
  ['web-flare-update006-rollback.zip','web-flare-update006-rollback.manifest.json']
];
const FRIEND=ARCHIVES[1];
const CRITICAL=['flare-p0/src/core/challenge.mjs','flare-p0/src/core/flare.mjs','flare-p0/src/core/navigation.mjs','flare-p0/src/core/simulation.mjs','flare-p0/src/view/renderer.mjs'];
const CRITICAL_DIRS=['flare-p0/','flare-p0/src/','flare-p0/src/core/','flare-p0/src/view/'];

for(const [zip,manifestName] of ARCHIVES){
  test(`${zip}: RAW member names are POSIX, safe, unique, with explicit directories, and cover the manifest exactly`,()=>{
    const manifest=JSON.parse(readFileSync(rel(manifestName),'utf8'));
    const a=audit(zip);
    assert.equal(a.backslashEntries,0,'no backslash member names');
    assert.equal(a.unsafeEntries,0,JSON.stringify(a.unsafe));
    assert.equal(a.duplicateEntries,0);
    assert.equal(a.fileEntries,manifest.fileCount,'file entries == manifest fileCount');
    assert.equal(a.totalEntries,a.fileEntries+a.directoryEntries);
    assert.deepEqual(a.files,manifest.files.map(f=>f.path).sort(),'every manifest file appears exactly once under its POSIX path');
    for(const d of a.directories)assert.ok(d.endsWith('/')&&!d.includes('\\'));
    // every parent directory of every file has an explicit entry
    const dirs=new Set(a.directories);
    for(const f of a.files){const parts=f.split('/').slice(0,-1);for(let i=1;i<=parts.length;i++)assert.ok(dirs.has(parts.slice(0,i).join('/')+'/'),`missing directory entry for ${f}`);}
  });
  test(`${zip}: Python (Linux-style) extraction yields every manifest file with matching size and SHA-256`,()=>{
    const manifest=JSON.parse(readFileSync(rel(manifestName),'utf8'));
    const out=mkdtempSync(path.join(tmpdir(),'zip-portability-'));
    try{
      py(['extract',rel(zip),out]);
      let ok=0;
      for(const f of manifest.files){
        const p=path.join(out,...f.path.split('/'));
        assert.ok(existsSync(p),`not extracted: ${f.path}`);
        const buf=readFileSync(p);
        assert.equal(buf.length,f.bytes,`size ${f.path}`);
        assert.equal(createHash('sha256').update(buf).digest('hex'),f.sha256,`sha256 ${f.path}`);
        ok++;
      }
      assert.equal(ok,manifest.fileCount,'no tolerated omissions');
    }finally{rmSync(out,{recursive:true,force:true});}
  });
}

test('the Friend release contains and extracts the five modules the failed 002E9F deployment lost',()=>{
  const manifest=JSON.parse(readFileSync(rel(FRIEND[1]),'utf8'));
  const a=audit(FRIEND[0]);
  for(const f of CRITICAL){assert.ok(a.files.includes(f),`ZIP lacks ${f}`);assert.ok(manifest.files.some(m=>m.path===f),`manifest lacks ${f}`);}
  for(const d of CRITICAL_DIRS)assert.ok(a.directories.includes(d),`ZIP lacks directory entry ${d}`);
  assert.ok(a.files.includes('flare-s8a/challenge.mjs')&&a.files.includes('flare-s8a/challenge-app.mjs'));
  const out=mkdtempSync(path.join(tmpdir(),'zip-critical-'));
  try{
    py(['extract',rel(FRIEND[0]),out]);
    for(const f of CRITICAL){
      const entry=manifest.files.find(m=>m.path===f);
      const h=createHash('sha256').update(readFileSync(path.join(out,...f.split('/')))).digest('hex');
      assert.equal(h,entry.sha256,f);
    }
  }finally{rmSync(out,{recursive:true,force:true});}
});

test('the path-safety audit rejects backslash, absolute, drive, dotdot and duplicate members (it is not a rubber stamp)',()=>{
  const dir=mkdtempSync(path.join(tmpdir(),'zip-bad-'));
  try{
    const bad=path.join(dir,'bad.zip');
    // Hand-built stored ZIP so the unsafe names reach the central directory verbatim (zipfile rewrites os.sep on Windows).
    const helper=path.join(repoRoot,'tests/helpers/make_unsafe_zip.py');
    let made=false;
    for(const exe of [process.env.PYTHON,'python','python3'].filter(Boolean)){try{execFileSync(exe,[helper,bad]);made=true;break;}catch(e){if(e.code!=='ENOENT')throw e;}}
    assert.ok(made);
    let status=0,report;
    try{py(['audit',bad]);}catch(e){status=e.status;report=JSON.parse(e.stdout);}
    assert.equal(status,2,'audit exits non-zero for an unsafe archive');
    assert.equal(report.backslashEntries,1);assert.ok(report.unsafeEntries>=4);assert.ok(report.duplicateEntries>=1);
    assert.throws(()=>py(['extract',bad,path.join(dir,'x')]));
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('the packager writes ZIPs with portable_zip.py (POSIX names, explicit directories), not PowerShell Compress-Archive',()=>{
  const src=readFileSync(path.join(repoRoot,'scripts/release/build-release-archive.mjs'),'utf8');
  assert.ok(!/Compress-Archive/.test(src.replace(/\/\/[^\n]*/g,'')),'Compress-Archive is not used for construction');
  assert.match(src,/portable_zip\.py/);
  const py_=readFileSync(tool,'utf8');
  assert.match(py_,/replace\('\\\\',\s*'\/'\)/);
  assert.match(py_,/zipfile\.ZipInfo\(d,/);
  assert.ok(statSync(tool).size>0);
});

#!/usr/bin/env node
// Deterministic WEB-FLARE-RC1 runtime manifest generator.
//
// Independently traces the real static import closure from the three actual browser entry points
// (Hub, Practice, Daily Trial) — it does NOT reuse or copy any prior HostGator update helper's file
// list. Every file it lists is one it actually found reachable by following <script src>/<link href>
// tags, `import ... from '...'` specifiers, and `new URL('...', import.meta.url)` asset references.
//
// Run: node scripts/release/generate-manifest.mjs
// Output: docs/release/WEB-FLARE-RC1-MANIFEST.json (path, sha256, mime, byte size per runtime file)
import {readFileSync,writeFileSync,existsSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'../..');

const MIME_BY_EXT={
  '.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'
};

const seen=new Set();
const queue=[];

function addHtmlEntry(htmlPath){
  const abs=path.join(root,htmlPath);
  if(!existsSync(abs))throw new Error(`Missing entry point: ${htmlPath}`);
  const html=readFileSync(abs,'utf8');
  seen.add(htmlPath);
  const re=/(?:src|href)="([^"]+\.(?:mjs|js|css|json))"/g;
  let m;
  while((m=re.exec(html)))resolveAndQueue(m[1],path.dirname(htmlPath));
}

function resolveAndQueue(spec,fromDir){
  if(/^https?:|^\/\//.test(spec))return; // external, not part of this runtime tree
  const resolved=path.normalize(path.join(fromDir,spec)).split(path.sep).join('/');
  if(seen.has(resolved))return;
  if(!existsSync(path.join(root,resolved)))return; // cross-link to another product surface, not a dependency
  seen.add(resolved);
  queue.push(resolved);
}

function scanModule(modPath){
  const src=readFileSync(path.join(root,modPath),'utf8');
  const dir=path.dirname(modPath);
  const re=/from\s*['"]([^'"]+)['"]/g;
  let m;
  while((m=re.exec(src))){
    if(!m[1].startsWith('.'))continue;
    resolveAndQueue(m[1],dir);
  }
  const re2=/new URL\('([^']+)'\s*,\s*import\.meta\.url\)/g;
  while((m=re2.exec(src)))resolveAndQueue(m[1],dir);
}

for(const entry of ['public/flare-s8b/index.html','public/flare-s8b/practice.html','public/flare-s8b/daily-trial.html'])
  addHtmlEntry(entry);

while(queue.length){
  const f=queue.shift();
  if(f.endsWith('.mjs')||f.endsWith('.js'))scanModule(f);
}

// config.js is generated per-deployment by the deploy helper, not sourced from git — exclude it from
// the manifest's content-hash set (its content is environment-specific, never repo-tracked).
seen.delete('public/flare-s8b/config.js');

const files=[...seen].sort().map(rel=>{
  const abs=path.join(root,rel);
  const buf=readFileSync(abs);
  const ext=path.extname(rel).toLowerCase();
  return {
    path:rel,
    sha256:createHash('sha256').update(buf).digest('hex'),
    mime:MIME_BY_EXT[ext]||'application/octet-stream',
    bytes:statSync(abs).size
  };
});

const manifest={
  releaseId:'WEB-FLARE-RC1',
  generatedAt:new Date().toISOString(),
  fileCount:files.length,
  files
};

const outPath=path.join(root,'docs/release/WEB-FLARE-RC1-MANIFEST.json');
writeFileSync(outPath,JSON.stringify(manifest,null,2)+'\n');
console.log(`Wrote ${outPath} — ${files.length} files`);

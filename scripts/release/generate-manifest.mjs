#!/usr/bin/env node
// Deterministic WEB-FLARE-RC1 runtime manifest generator.
//
// Traces the real static runtime closure from all browser entry points needed by the Runner Hub and
// friend receiver. It resolves both repository-relative references and site-absolute
// /quick-dungeon/... URLs back into public/... repository paths.
//
// Run: node scripts/release/generate-manifest.mjs
// Output: docs/release/WEB-FLARE-RC1-MANIFEST.json
import {readFileSync,writeFileSync,existsSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'../..');

const MIME_BY_EXT={
  '.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'
};

function canonicalRuntimeBytes(buffer,ext){
  // Git stores these text runtime assets with LF. Normalizing the Windows checkout's CRLF
  // representation keeps manifest hashes aligned with the committed bytes used by the archive,
  // while still exposing any substantive uncommitted source change to the archive's drift guard.
  if(['.html','.mjs','.js','.css','.json','.txt'].includes(ext))return Buffer.from(buffer.toString('utf8').replace(/\r\n/g,'\n'),'utf8');
  return buffer;
}

const ENTRY_POINTS=Object.freeze([
  'public/flare-s8a/index.html',
  'public/flare-s8a/challenge.html',
  'public/flare-s8b/index.html',
  'public/flare-s8b/practice.html',
  'public/flare-s8b/daily-trial.html'
]);

const seen=new Set();
const queue=[];

function repoPathForSpec(spec,fromDir){
  const clean=String(spec||'').split(/[?#]/,1)[0];
  if(!clean||clean.startsWith('#')||/^https?:|^\/\//.test(clean))return null;
  if(clean.startsWith('/quick-dungeon/'))return 'public/'+clean.slice('/quick-dungeon/'.length);
  if(clean.startsWith('/'))return null;
  return path.normalize(path.join(fromDir,clean)).split(path.sep).join('/');
}

function resolveAndQueue(spec,fromDir){
  const resolved=repoPathForSpec(spec,fromDir);
  if(!resolved||seen.has(resolved))return;
  const abs=path.join(root,resolved);
  if(!existsSync(abs)||!statSync(abs).isFile())return;
  seen.add(resolved);
  queue.push(resolved);
}

function addHtmlEntry(htmlPath){
  const abs=path.join(root,htmlPath);
  if(!existsSync(abs))throw new Error(`Missing entry point: ${htmlPath}`);
  const html=readFileSync(abs,'utf8');
  seen.add(htmlPath);
  const re=/(?:src|href)=["']([^"']+)["']/g;
  let m;
  while((m=re.exec(html)))resolveAndQueue(m[1],path.dirname(htmlPath));
}

function scanModule(modPath){
  const src=readFileSync(path.join(root,modPath),'utf8');
  const dir=path.dirname(modPath);
  let m;

  const imports=/\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  while((m=imports.exec(src)))resolveAndQueue(m[1],dir);

  const urls=/new URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g;
  while((m=urls.exec(src)))resolveAndQueue(m[1],dir);

  const fetches=/\bfetch\(\s*['"]([^'"]+)['"]/g;
  while((m=fetches.exec(src)))resolveAndQueue(m[1],dir);

  // Reachable room catalogs use literal local: paths that are passed to new URL(spec.local,
  // import.meta.url). Trace those literals as runtime dependencies rather than relying on a
  // hard-coded room file list.
  const localPaths=/\blocal\s*:\s*['"]([^'"]+)['"]/g;
  while((m=localPaths.exec(src)))resolveAndQueue(m[1],dir);
}

for(const entry of ENTRY_POINTS)addHtmlEntry(entry);

while(queue.length){
  const f=queue.shift();
  if(f.endsWith('.mjs')||f.endsWith('.js'))scanModule(f);
}

// config.js is produced per deployment and contains environment-specific public configuration.
seen.delete('public/flare-s8b/config.js');

const files=[...seen].sort().map(rel=>{
  const abs=path.join(root,rel);
  const ext=path.extname(rel).toLowerCase();
  const buf=canonicalRuntimeBytes(readFileSync(abs),ext);
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
  entryPoints:ENTRY_POINTS,
  fileCount:files.length,
  files
};

const outPath=path.join(root,'docs/release/WEB-FLARE-RC1-MANIFEST.json');
writeFileSync(outPath,JSON.stringify(manifest,null,2)+'\n');
console.log(`Wrote ${outPath} — ${files.length} files`);

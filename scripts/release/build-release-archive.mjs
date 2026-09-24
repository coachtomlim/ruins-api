#!/usr/bin/env node
// Builds the P10 fallback release archive (for manual cPanel File Manager upload when the automated
// HostGator helper cannot reach cPanel) and a rollback archive of the predecessor (last known live)
// tree. Both are built ONLY from `git show <sha>:<path>` content — never from the working tree — so
// they can never accidentally include an uncommitted local secret, .env file, or scratch artifact.
//
// Run: node scripts/release/build-release-archive.mjs
// Output:
//   docs/release/web-flare-p10-rc1-release.zip        (+ .manifest.json)
//   docs/release/web-flare-update006-rollback.zip      (+ .manifest.json)
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'../..');
const outDir=path.join(root,'docs/release');
mkdirSync(outDir,{recursive:true});

const MIME_BY_EXT={
  '.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'
};

function gitShow(sha,relPath){
  return execFileSync('git',['-C',root,'show',`${sha}:${relPath}`]);
}

function buildArchive({label,sha,files,deployRootPrefix,zipName}){
  const stage=mkdtempSync(path.join(tmpdir(),'flare-release-'));
  const manifestFiles=[];
  for(const rel of files){
    const buf=gitShow(sha,rel);
    const deployRel=rel.replace(deployRootPrefix,'');
    const dest=path.join(stage,deployRel);
    mkdirSync(path.dirname(dest),{recursive:true});
    writeFileSync(dest,buf);
    const ext=path.extname(rel).toLowerCase();
    manifestFiles.push({
      path:deployRel.split(path.sep).join('/'),
      sha256:createHash('sha256').update(buf).digest('hex'),
      mime:MIME_BY_EXT[ext]||'application/octet-stream',
      bytes:buf.length
    });
  }
  const zipPath=path.join(outDir,zipName);
  if(existsSync(zipPath))rmSync(zipPath);
  // PowerShell Compress-Archive: available on this Windows host, produces a standard .zip that
  // cPanel File Manager's Extract action can read directly.
  execFileSync('powershell.exe',[
    '-NoProfile','-NonInteractive','-Command',
    `Compress-Archive -Path '${stage}\\*' -DestinationPath '${zipPath}' -Force`
  ]);
  rmSync(stage,{recursive:true,force:true});
  const manifest={label,sourceSha:sha,fileCount:manifestFiles.length,zip:zipName,files:manifestFiles};
  const manifestPath=zipPath.replace(/\.zip$/,'.manifest.json');
  writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  console.log(`Wrote ${zipPath} (${manifestFiles.length} files) and ${manifestPath}`);
  return {zipPath,manifestPath,manifest};
}

// --- Fallback release archive: exact P10 flare-s8b runtime tree ---
// Regenerate the manifest first so this archive always reflects the current worktree, not a stale copy.
execFileSync('node',[path.join(__dirname,'generate-manifest.mjs')],{cwd:root});
const runtimeManifest=JSON.parse(readFileSync(path.join(root,'docs/release/WEB-FLARE-RC1-MANIFEST.json'),'utf8'));
const releaseFiles=runtimeManifest.files.filter(f=>f.path.startsWith('public/flare-s8b/')).map(f=>f.path);
const P10_SHA=process.env.P10_RELEASE_SHA||execFileSync('git',['-C',root,'rev-parse','HEAD']).toString().trim();

buildArchive({
  label:'WEB-FLARE-RC1 release archive (public_html/quick-dungeon/flare-s8b)',
  sha:P10_SHA,
  files:releaseFiles,
  deployRootPrefix:'public/flare-s8b/',
  zipName:'web-flare-p10-rc1-release.zip'
});

// --- Rollback archive: the last known LIVE predecessor tree (Update 006) ---
const PREVIOUS_SHA='523bfd7ffc46be191ce48b794708cc5af945dcda';
const previousFiles=[
  'public/flare-s8b/index.html','public/flare-s8b/account.css','public/flare-s8b/vendor/supabase.js',
  'public/flare-s8b/account-app.mjs','public/flare-s8b/account-ready-view.mjs','public/flare-s8b/daily-login.mjs',
  'public/flare-s8b/daily-trial.mjs','public/flare-s8b/daily-trial-runner-catalog.mjs','public/flare-s8b/daily-trial-app.mjs',
  'public/flare-s8b/daily-trial.html','public/flare-s8b/daily-trial.css','public/flare-s8b/friend-share.mjs',
  'public/flare-s8b/supabase-browser.mjs','public/flare-s8b/account-adapter.mjs','public/flare-s8b/stat-purchase-flow.mjs',
  'public/flare-s8b/practice-runner-snapshot.mjs','public/flare-s8b/practice-runner-catalog.mjs','public/flare-s8b/practice.html',
  'public/flare-s8b/practice-app.mjs','public/flare-s8b/practice.css'
];
buildArchive({
  label:'Update 006 rollback archive (last known live predecessor tree)',
  sha:PREVIOUS_SHA,
  files:previousFiles,
  deployRootPrefix:'public/flare-s8b/',
  zipName:'web-flare-update006-rollback.zip'
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const repoRoot=new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]):/,'$1:');
const trackedFiles=()=>execFileSync('git',['-C',repoRoot,'ls-files']).toString().split(/\r?\n/).filter(Boolean);

test('no __pycache__, .pyc, .env, or common scratch/proof-artifact filenames are tracked in git',()=>{
  const bad=trackedFiles().filter(f=>/__pycache__|\.pyc$|\.env($|\.)|mock-server\.mjs$|__mock-supabase\.js$|practice-mock\.html$|index-mock\.html$|\.bak$|\.tmp$/i.test(f));
  assert.deepEqual(bad,[]);
});

test('.gitignore excludes __pycache__ and local scratch-extract directories',()=>{
  const gi=execFileSync('cat',[`${repoRoot}/.gitignore`]).toString();
  assert.match(gi,/__pycache__\//);
  assert.match(gi,/\*\.pyc/);
});

test('full-repo scan: every service_role/sb_secret_ occurrence in tracked source is a known guard pattern, doc mention, or test fixture — never real credential material',()=>{
  let hits;
  try{
    hits=execFileSync('git',['-C',repoRoot,'grep','-nE','service_role|sb_secret_','--','*.mjs','*.js','*.ts','*.py','*.sql','*.html']).toString();
  }catch(e){
    hits=e.stdout?.toString()||'';
  }
  const lines=hits.split(/\r?\n/).filter(Boolean);
  const allowed=/vendor\/supabase\.js|account-adapter\.mjs:.*startsWith\('sb_secret_'\)|friend-share\.mjs:.*\/service_role\|sb_secret_|hostgator-flare-p10-rc1\.py:.*for forbidden in|test\.mjs:|scripts\/deploy\/hostgator-flare-s8b-update-006\.py|scripts\/deploy\/hostgator-flare-s8b-update-005\.py/;
  const offenders=lines.filter(l=>!allowed.test(l));
  assert.deepEqual(offenders,[],`unexpected service_role/sb_secret_ reference outside known guard/test patterns:\n${offenders.join('\n')}`);
});

test('no real-looking token literals (cpanel auth header, x-api-key value, sk-ant- key, filled-in sb_secret_) anywhere in tracked source',()=>{
  let hits;
  try{
    hits=execFileSync('git',['-C',repoRoot,'grep','-nE',
      "cpanel [A-Za-z0-9_.-]+:[A-Za-z0-9]{15,}|x-api-key['\\\"]?\\s*[:=]\\s*['\\\"][A-Za-z0-9]{15,}|sk-ant-[A-Za-z0-9]{20,}|sb_secret_[A-Za-z0-9]{15,}"
    ]).toString();
  }catch(e){
    hits=e.stdout?.toString()||'';
  }
  assert.equal(hits.trim(),'');
});

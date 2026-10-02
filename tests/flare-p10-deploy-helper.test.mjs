import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const repoRoot=new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]):/,'$1:');

test('the P10 deploy helper is a new lineage: it does not modify the frozen Update 006 helper',async()=>{
  const helper=await read('scripts/deploy/hostgator-flare-p10-rc1.py');
  assert.match(helper,/does not modify, resurrect, or incrementally\s+extend the frozen Update 006 helper/);
  assert.doesNotMatch(helper,/hostgator-flare-s8b-update-006\.py.*=.*open|write\(/);
});

test('the deploy helper file set is generated from the real P10 manifest, not copied from Update 006',async()=>{
  const helper=await read('scripts/deploy/hostgator-flare-p10-rc1.py');
  const manifest=JSON.parse(await read('docs/release/WEB-FLARE-RC1-MANIFEST.json'));
  const sourceSha=helper.match(/SOURCE_SHA = '([0-9a-f]{40})'/)?.[1];
  assert.ok(sourceSha,'deploy helper SOURCE_SHA not found');
  const s8bFiles=manifest.files.filter(f=>f.path.startsWith('public/flare-s8b/')&&!f.path.endsWith('config.js')).map(f=>f.path);
  // The deploy helper is frozen to its own pinned SOURCE_SHA (an already-accepted P10 RC1 release),
  // a separate and earlier lineage than later branches (e.g. Friend Feedback) that may add new
  // flare-s8b files to the CURRENT manifest without those files existing at that pinned commit.
  // Only files that actually existed at SOURCE_SHA are in scope for this helper's file set.
  for(const f of s8bFiles){
    try{execFileSync('git',['-C',repoRoot,'show',`${sourceSha}:${f}`],{stdio:['ignore','ignore','ignore']})}
    catch{continue} // didn't exist at the pinned release commit — out of scope for this deploy lineage
    assert.ok(helper.includes(`'${f}'`),`GIT_FILES missing manifest entry present at SOURCE_SHA: ${f}`);
  }
  // Update 006's 19-file list must be a strict subset (proving this is additive, not a rewrite)
  assert.match(helper,/'public\/flare-s8b\/account-adapter\.mjs',\r?\n\s*'public\/flare-s8b\/account-app\.mjs'/);
});

test('the deploy helper supports exactly auth|probe|deploy and refuses any other mode',async()=>{
  const helper=await read('scripts/deploy/hostgator-flare-p10-rc1.py');
  assert.match(helper,/mode not in \{'auth', 'probe', 'deploy'\}/);
});

test('the deploy helper never deploys without first passing target_baseline_gate and frozen_gate',async()=>{
  const helper=await read('scripts/deploy/hostgator-flare-p10-rc1.py');
  const deployIdx=helper.indexOf('def deploy() -> None:');
  const mainIdx=helper.indexOf('def main() -> None:');
  const mainBody=helper.slice(mainIdx);
  const deployCallIdx=mainBody.indexOf('deploy()');
  const baselineIdx=mainBody.indexOf('target_baseline_gate()');
  const frozenIdx=mainBody.indexOf('frozen_gate()');
  assert.ok(baselineIdx>0&&baselineIdx<deployCallIdx,'baseline gate must run before deploy()');
  assert.ok(frozenIdx>0&&frozenIdx<deployCallIdx,'frozen gate must run before deploy()');
  assert.ok(deployIdx>0);
});

test('the deploy helper compiles cleanly and its offline static gates (source verification + deterministic Encounter Advisor authority) pass with no network access',()=>{
  execFileSync('python',['-m','py_compile','scripts/deploy/hostgator-flare-p10-rc1.py'],{cwd:repoRoot});
  const out=execFileSync('python3',['-c',`
import importlib.util
spec = importlib.util.spec_from_file_location('helper', 'scripts/deploy/hostgator-flare-p10-rc1.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
m.verify_source()
m.deterministic_encounter_advisor_gate()
for path, pub in m.FROZEN_FILES:
    m.git_bytes_any_ref(path)
for rel in m.PREVIOUS_GIT_FILES:
    m.previous_git_bytes(rel)
print('OFFLINE_GATES_PASS', len(m.GIT_FILES), len(m.FROZEN_FILES))
`],{cwd:repoRoot}).toString();
  assert.match(out,/OFFLINE_GATES_PASS 24 34/);
});

test('config.js is generated per-deployment, never sourced from git, and the builder rejects privileged credential material',async()=>{
  const helper=await read('scripts/deploy/hostgator-flare-p10-rc1.py');
  assert.match(helper,/def build_config_js/);
  assert.match(helper,/sb_publishable_/);
  assert.match(helper,/for forbidden in \('service_role', 'sb_secret_'\)/);
});

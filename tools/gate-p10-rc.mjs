#!/usr/bin/env node
// P10 §10 consolidated release gate. Chains: P10-focused tests -> full suite -> frozen-tree verifier
// -> deploy-helper offline static checks -> release-manifest verification (hash-vs-disk + archives).
// Any failing step aborts immediately with a non-zero exit code. This never weakens or skips a test
// to get green — every step here is a real, already-passing command; this script only sequences them.
import {spawnSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const allTestFiles=readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.test.mjs')).map(f=>`tests/${f}`).sort();

const steps=[
  {
    name:'P10-focused tests',
    cmd:'node',
    args:['--test',
      'tests/flare-p9-ai-encounter-assist.test.mjs',
      'tests/flare-p10-release-manifest.test.mjs',
      'tests/flare-p10-deploy-helper.test.mjs',
      'tests/flare-p10-release-archive.test.mjs',
      'tests/flare-p10-security-review.test.mjs',
      'tests/flare-p10-repo-hygiene.test.mjs',
      'tests/flare-p10-failure-ux.test.mjs'
    ]
  },
  {name:'Full test suite', cmd:'node', args:['--test',...allTestFiles]},
  {name:'Frozen web-tree verifier', cmd:'node', args:['tools/verify-frozen-web-trees.mjs']},
  {
    name:'Deploy helper offline static gates (no network)',
    cmd:'python3',
    args:['-c',`
import importlib.util
spec = importlib.util.spec_from_file_location('helper', 'scripts/deploy/hostgator-flare-p10-rc1.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
m.verify_source()
m.ai_availability_honesty_gate()
for path, pub in m.FROZEN_FILES:
    m.git_bytes_any_ref(path)
for rel in m.PREVIOUS_GIT_FILES:
    m.previous_git_bytes(rel)
print('deploy helper offline gates: PASS')
`.trim()]
  },
  {name:'Regenerate release manifest (must stay deterministic)', cmd:'node', args:['scripts/release/generate-manifest.mjs']},
  {name:'Rebuild release + rollback archives', cmd:'node', args:['scripts/release/build-release-archive.mjs']}
];

let failed=false;
for(const step of steps){
  console.log(`\n=== ${step.name} ===`);
  const result=spawnSync(step.cmd,step.args,{cwd:root,stdio:'inherit'});
  if(result.status!==0){
    console.error(`\nGATE FAILED at: ${step.name} (exit ${result.status})`);
    failed=true;
    break;
  }
}

if(failed){
  console.error('\nP10 RELEASE GATE: FAIL');
  process.exit(1);
}

console.log('\nP10 RELEASE GATE: PASS');

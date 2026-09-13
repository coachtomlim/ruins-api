import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifyFrozenWebTrees,assertFrozenWebTrees} from '../tools/verify-frozen-web-trees.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../tools/frozen-web-trees.json',import.meta.url),'utf8'));

test('frozen predecessor manifest covers S2 through S7.1',()=>{
  assert.deepEqual(Object.keys(manifest.trees),['public/flare-s2','public/flare-s3','public/flare-s4','public/flare-s5','public/flare-s6','public/flare-s7','public/flare-s71']);
  assert.equal(manifest.authorityCommit,'e599229ce9373614b1b164e0aa9f7ec37fea53a0');
});

test('current branch preserves every frozen predecessor tree without requiring old Git history',()=>{
  const results=verifyFrozenWebTrees();
  assert.equal(results.length,7);
  assert.ok(results.every(x=>x.match),JSON.stringify(results.filter(x=>!x.match),null,2));
  assert.doesNotThrow(()=>assertFrozenWebTrees());
});

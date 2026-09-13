import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRunGearAward} from '../public/flare-s8b/run-gear-award.mjs';

test('post-run gear award keeps run and item provenance',()=>{
  const award=normalizeRunGearAward({awardId:'a1',runId:'run-1',itemId:'leather-boots',slot:'feet',sourceMonsterId:'guard-2'});
  assert.equal(award.itemId,'leather-boots');
  assert.equal(award.slot,'feet');
  assert.equal(award.sourceMonsterId,'guard-2');
});

test('invalid slot fails closed',()=>{
  assert.throws(()=>normalizeRunGearAward({awardId:'a',runId:'r',itemId:'ring',slot:'ring'}));
});

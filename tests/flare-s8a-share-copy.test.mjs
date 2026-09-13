import test from 'node:test';
import assert from 'node:assert/strict';
import {challengeShareCopy} from '../public/flare-s8a/share-copy.mjs';

test('shared invitation explains the precision-clear task before open',()=>{
  const copy=challengeShareCopy({sender:'<Tom>',targetHp:60});
  assert.equal(copy.title,'Dungeon Runner');
  assert.match(copy.text,/choose a dungeon/i);
  assert.match(copy.text,/exit near 60% HP/i);
  assert.match(copy.text,/30 seconds/i);
  assert.doesNotMatch(copy.text,/kill|defeat the Hero/i);
});

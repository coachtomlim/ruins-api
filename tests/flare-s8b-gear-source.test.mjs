import test from 'node:test';
import assert from 'node:assert/strict';
import {GEAR_SOURCES,normalizeGearSource,gearSourceLabel} from '../public/flare-s8b/gear-source.mjs';

test('gear sources cover starter purchase drop and reserved transfer',()=>{
  assert.deepEqual(GEAR_SOURCES,['STARTER','PURCHASE','DROP','FUTURE_TRANSFER']);
  assert.equal(gearSourceLabel('DROP'),'DUNGEON DROP');
});

test('gear source keeps item slot and source provenance separate',()=>{
  assert.deepEqual(normalizeGearSource({itemId:'leather-boots',slot:'feet',source:'DROP',sourceId:'drop-123'}),{itemId:'leather-boots',slot:'feet',source:'DROP',sourceId:'drop-123'});
});

test('unsupported sources fail closed',()=>{
  assert.throws(()=>normalizeGearSource({itemId:'x',slot:'feet',source:'UNKNOWN',sourceId:'y'}));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeGearAvailability,gearAvailableFrom} from '../public/flare-s8b/gear-availability.mjs';

test('one item may be available through Gold and run awards',()=>{
  const policy=normalizeGearAvailability({itemId:'boots',channels:['PURCHASE','RUN_AWARD']});
  assert.equal(gearAvailableFrom(policy,'PURCHASE'),true);
  assert.equal(gearAvailableFrom(policy,'RUN_AWARD'),true);
  assert.equal(gearAvailableFrom(policy,'FUTURE_TRANSFER'),false);
});

test('future transfer can be reserved independently without changing item stats',()=>{
  const policy=normalizeGearAvailability({itemId:'helm',channels:['FUTURE_TRANSFER']});
  assert.deepEqual(policy.channels,['FUTURE_TRANSFER']);
});

test('unknown and duplicate channels fail closed',()=>{
  assert.throws(()=>normalizeGearAvailability({itemId:'x',channels:['UNKNOWN']}));
  assert.throws(()=>normalizeGearAvailability({itemId:'x',channels:['PURCHASE','PURCHASE']}));
});

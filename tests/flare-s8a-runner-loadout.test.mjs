import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEquip,loadoutView} from '../public/flare-s8a/runner-loadout.mjs';

test('player can equip owned weapon or armor only into governed slots',()=>{
  const assets=[{playerId:'p1',assetKey:'blade-1'},{playerId:'p1',assetKey:'mail-1'}];
  assert.deepEqual(validateEquip({playerId:'p1',runnerId:'r1',slot:'weapon',assetId:'blade-1',offer:{slot:'weapon'},assets}),{playerId:'p1',runnerId:'r1',slot:'weapon',assetId:'blade-1'});
  assert.deepEqual(loadoutView({weapon:'blade-1',armor:'mail-1'}),{weapon:'blade-1',armor:'mail-1'});
});

test('cross-player or wrong-slot equip fails closed',()=>{
  const assets=[{playerId:'p2',assetKey:'blade-1'}];
  assert.throws(()=>validateEquip({playerId:'p1',runnerId:'r1',slot:'weapon',assetId:'blade-1',offer:{slot:'weapon'},assets}));
  assert.throws(()=>validateEquip({playerId:'p2',runnerId:'r1',slot:'armor',assetId:'blade-1',offer:{slot:'weapon'},assets}));
});

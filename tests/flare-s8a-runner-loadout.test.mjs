import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEquip,loadoutView} from '../public/flare-s8a/runner-loadout.mjs';

test('loadout exposes weapon shield and individual armor slots',()=>{
  const assets=[{playerId:'p1',assetKey:'club-1'},{playerId:'p1',assetKey:'shield-1'},{playerId:'p1',assetKey:'boots-1'}];
  assert.deepEqual(validateEquip({playerId:'p1',runnerId:'r1',slot:'shield',assetId:'shield-1',offer:{slot:'shield'},assets}),{playerId:'p1',runnerId:'r1',slot:'shield',assetId:'shield-1'});
  assert.deepEqual(loadoutView({weapon:'club-1',shield:'shield-1',feet:'boots-1'}),{weapon:'club-1',shield:'shield-1',head:null,chest:null,hands:null,legs:null,feet:'boots-1'});
});

test('cross-player or wrong-slot equip fails closed',()=>{
  const assets=[{playerId:'p2',assetKey:'shield-1'}];
  assert.throws(()=>validateEquip({playerId:'p1',runnerId:'r1',slot:'shield',assetId:'shield-1',offer:{slot:'shield'},assets}));
  assert.throws(()=>validateEquip({playerId:'p2',runnerId:'r1',slot:'head',assetId:'shield-1',offer:{slot:'shield'},assets}));
});

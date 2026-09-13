import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeGearInstance,activeGearInstances,gearInstanceIndex} from '../public/flare-s8b/gear-instance.mjs';

const boots={instanceId:'g1',accountId:'p1',itemId:'leather-boots',slot:'feet',source:'DROP',sourceId:'run-1'};

test('gear instance stores account, item, slot and source separately',()=>{
  assert.deepEqual(normalizeGearInstance(boots),{...boots,inactiveAt:null});
});

test('active gear list is account scoped and ignores inactive rows',()=>{
  const rows=[boots,{instanceId:'g2',accountId:'p2',itemId:'helm',slot:'head',source:'PURCHASE',sourceId:'buy-1'},{instanceId:'g3',accountId:'p1',itemId:'old',slot:'head',source:'DROP',sourceId:'run-2',inactiveAt:'later'}];
  assert.deepEqual(activeGearInstances(rows,'p1').map(x=>x.instanceId),['g1']);
});

test('gear instance index rejects duplicate identity',()=>{
  assert.throws(()=>gearInstanceIndex([boots,{...boots,itemId:'other'}]));
});

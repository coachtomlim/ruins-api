import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLoadoutInstances,validateLoadoutInstances} from '../public/flare-s8b/loadout-instance.mjs';

const gear=[
  {instanceId:'club-1',accountId:'p1',itemId:'wooden-club',slot:'weapon',source:'STARTER',sourceId:'starter'},
  {instanceId:'shield-1',accountId:'p1',itemId:'wooden-shield',slot:'shield',source:'STARTER',sourceId:'starter'},
  {instanceId:'boots-1',accountId:'p1',itemId:'leather-boots',slot:'feet',source:'DROP',sourceId:'run-1'}
];

test('loadout resolves account-owned gear instances by slot',()=>{
  const resolved=validateLoadoutInstances({accountId:'p1',loadout:{weapon:'club-1',shield:'shield-1',feet:'boots-1'},gearInstances:gear});
  assert.equal(resolved.weapon.itemId,'wooden-club');
  assert.equal(resolved.shield.itemId,'wooden-shield');
  assert.equal(resolved.feet.itemId,'leather-boots');
  assert.equal(resolved.head,null);
});

test('loadout normalization always exposes all seven slots',()=>{
  assert.deepEqual(Object.keys(normalizeLoadoutInstances({weapon:'x'})),['weapon','shield','head','chest','hands','legs','feet']);
});

test('cross-account and wrong-slot gear fail closed',()=>{
  assert.throws(()=>validateLoadoutInstances({accountId:'p2',loadout:{weapon:'club-1'},gearInstances:gear}));
  assert.throws(()=>validateLoadoutInstances({accountId:'p1',loadout:{head:'boots-1'},gearInstances:gear}));
});

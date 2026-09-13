import test from 'node:test';
import assert from 'node:assert/strict';
import {addOwnershipGrant,activeOwnershipForPlayer} from '../public/flare-s8b/ownership-grant.mjs';

const grant={ownershipId:'own-1',playerId:'p1',idempotencyKey:'drop:run1:boots',itemId:'leather-boots',slot:'feet',source:'DROP',sourceId:'drop-1'};

test('ownership grant is idempotent and preserves acquisition source',()=>{
  const first=addOwnershipGrant([],grant);
  assert.equal(first.duplicate,false);
  assert.equal(first.grant.source,'DROP');
  const retry=addOwnershipGrant(first.grants,{...grant,ownershipId:'ignored'});
  assert.equal(retry.duplicate,true);
  assert.equal(retry.grants.length,1);
  assert.equal(retry.grant.ownershipId,'own-1');
});

test('active ownership is scoped to player and ignores revoked records',()=>{
  const rows=[grant,{ownershipId:'own-2',playerId:'p2',idempotencyKey:'x',itemId:'helm',slot:'head',source:'PURCHASE',sourceId:'p'},{ownershipId:'own-3',playerId:'p1',idempotencyKey:'y',itemId:'old',slot:'head',source:'DROP',sourceId:'d',revokedAt:'later'}];
  assert.deepEqual(activeOwnershipForPlayer(rows,'p1').map(x=>x.itemId),['leather-boots']);
});

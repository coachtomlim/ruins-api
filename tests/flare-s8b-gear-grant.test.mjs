import test from 'node:test';
import assert from 'node:assert/strict';
import {applyGearGrant} from '../public/flare-s8b/gear-grant.mjs';

const row={grantId:'g1',accountId:'p1',itemId:'leather-boots',slot:'feet',source:'DROP',sourceId:'run-1',operationKey:'award:run-1:boots'};

test('gear grant is account-level and idempotent',()=>{
  const first=applyGearGrant([],row);
  assert.equal(first.duplicate,false);
  assert.equal(first.grant.accountId,'p1');
  const retry=applyGearGrant(first.rows,{...row,grantId:'ignored'});
  assert.equal(retry.duplicate,true);
  assert.equal(retry.rows.length,1);
  assert.equal(retry.grant.grantId,'g1');
});

test('same grant id cannot be reused for a different operation',()=>{
  assert.throws(()=>applyGearGrant([row],{...row,operationKey:'different'}));
});

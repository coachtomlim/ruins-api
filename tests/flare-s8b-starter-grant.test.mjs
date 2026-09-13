import test from 'node:test';
import assert from 'node:assert/strict';
import {starterRunnerState,starterOwnershipRecords} from '../public/flare-s8b/starter-grant.mjs';

test('starter grant owns and equips only club and wooden shield',()=>{
  const s=starterRunnerState();
  assert.deepEqual(s.ownedAssetIds,['wooden-club','wooden-shield']);
  assert.equal(s.loadout.weapon,'wooden-club');
  assert.equal(s.loadout.shield,'wooden-shield');
  for(const slot of ['head','chest','hands','legs','feet'])assert.equal(s.loadout[slot],null,slot);
});

test('starter ownership is a grant, not a Gold debit',()=>{
  const rows=starterOwnershipRecords({playerId:'p1'});
  assert.equal(rows.length,2);
  for(const row of rows){assert.equal(row.playerId,'p1');assert.equal(row.acquisitionReason,'STARTER_GRANT');assert.equal(row.ledgerEntryId,null);}
});

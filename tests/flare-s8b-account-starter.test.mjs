import test from 'node:test';
import assert from 'node:assert/strict';
import {createStarterAccountProgression} from '../public/flare-s8b/account-starter.mjs';

test('new account starts with zero Gold and only club plus shield gear',()=>{
  const created=createStarterAccountProgression({playerId:'p1'});
  assert.equal(created.goldBalance,0);
  assert.equal(created.account.ledgerEntries.length,0);
  assert.deepEqual(created.account.runners['warrior-l1'].ownedAssetIds,['wooden-club','wooden-shield']);
  assert.equal(created.account.runners['warrior-l1'].loadout.weapon,'wooden-club');
  assert.equal(created.account.runners['warrior-l1'].loadout.shield,'wooden-shield');
  for(const slot of ['head','chest','hands','legs','feet'])assert.equal(created.account.runners['warrior-l1'].loadout[slot],null,slot);
});

test('starter ownership records are grants and not Gold transactions',()=>{
  const created=createStarterAccountProgression({playerId:'p1'});
  assert.equal(created.starterOwnership.length,2);
  for(const row of created.starterOwnership){assert.equal(row.acquisitionReason,'STARTER_GRANT');assert.equal(row.ledgerEntryId,null);}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGuestClaimRequest} from '../public/flare-s8b/claim-request.mjs';

test('guest claim request sends only token and idempotency key',()=>{
  const request=buildGuestClaimRequest({claimToken:'claim-abc',idempotencyKey:'claim:abc:p1',playerId:'evil',builderGold:999});
  assert.deepEqual(request,{claim_token:'claim-abc',idempotency_key:'claim:abc:p1'});
  assert.doesNotMatch(JSON.stringify(request),/player|gold|reward/i);
});

test('claim request fails closed when retry identity is missing',()=>{
  assert.throws(()=>buildGuestClaimRequest({claimToken:'claim-abc'}));
  assert.throws(()=>buildGuestClaimRequest({idempotencyKey:'x'}));
});

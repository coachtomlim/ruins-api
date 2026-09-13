import test from 'node:test';
import assert from 'node:assert/strict';
import {ACCOUNT_CAPABILITIES,unavailableAccountAdapter,validateAccountAdapter} from '../public/flare-s8b/account-adapter.mjs';

test('unconfigured adapter is explicit and fails closed',async()=>{
  const adapter=unavailableAccountAdapter();
  assert.equal(adapter.available,false);
  assert.equal(adapter.provider,'unconfigured');
  assert.equal(validateAccountAdapter(adapter),true);
  await assert.rejects(()=>adapter.register({}),/ACCOUNT_SERVICE_NOT_CONFIGURED/);
  await assert.rejects(()=>adapter.claimGuestRun({}),/ACCOUNT_SERVICE_NOT_CONFIGURED/);
});

test('adapter contract requires every account capability',()=>{
  assert.deepEqual(ACCOUNT_CAPABILITIES,['register','signIn','signOut','getMe','claimGuestRun']);
  assert.throws(()=>validateAccountAdapter({register(){}}),/missing signIn/i);
});

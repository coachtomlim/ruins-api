import test from 'node:test';
import assert from 'node:assert/strict';
import {buildErrorViewModel} from '../public/flare-s8a/error-view-model.mjs';

test('invalid invite fails closed without fabricated gameplay or reward',()=>{
  const vm=buildErrorViewModel('invalidInvite');
  assert.equal(vm.title,'THIS CHALLENGE CANNOT OPEN');
  assert.equal(vm.rewardAllowed,false);
  assert.equal(vm.primary,null);
});

test('asset and run initialization failures provide explicit retry paths',()=>{
  assert.equal(buildErrorViewModel('assetLoad').primary,'TRY AGAIN');
  assert.equal(buildErrorViewModel('runInit').primary,'TRY RUN AGAIN');
  assert.equal(buildErrorViewModel('interrupted').rewardAllowed,false);
});

test('unknown result never becomes a success or reward state',()=>{
  const vm=buildErrorViewModel('something-new');
  assert.equal(vm.kind,'unknownResult');
  assert.equal(vm.rewardAllowed,false);
  assert.match(vm.title,/RESULT UNAVAILABLE/);
});

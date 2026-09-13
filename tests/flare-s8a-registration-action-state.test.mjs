import test from 'node:test';
import assert from 'node:assert/strict';
import {registrationActionState} from '../public/flare-s8a/registration-action-state.mjs';

test('S8A registration screen does not fake a working account service',()=>{
  const state=registrationActionState();
  assert.equal(state.label,'CREATE ACCOUNT');
  assert.equal(state.enabled,false);
  assert.match(state.status,/NOT CONNECTED YET/);
  assert.match(state.note,/No account or assets are saved yet/i);
  assert.equal(state.fallbackAction,'BACK TO REWARDS');
});

test('future S8B can enable the same account action contract',()=>{
  const state=registrationActionState({accountServiceAvailable:true});
  assert.equal(state.enabled,true);
  assert.equal(state.status,'READY');
});

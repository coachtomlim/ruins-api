import test from 'node:test';
import assert from 'node:assert/strict';
import {JOURNEY_STATES} from '../public/flare-s8a/journey.mjs';
import {screenShellState} from '../public/flare-s8a/screen-shell.mjs';

test('receiver journey maps to stable viewport panel identities',()=>{
  const states=[JOURNEY_STATES.INVITATION,JOURNEY_STATES.MISSION,JOURNEY_STATES.READY,JOURNEY_STATES.CUSTOMIZE,JOURNEY_STATES.RUNTIME,JOURNEY_STATES.REWARDS,JOURNEY_STATES.REGISTRATION];
  const ids=states.map(s=>screenShellState(s).panelId);
  assert.equal(new Set(ids).size,states.length);
  assert.equal(screenShellState(JOURNEY_STATES.REWARDS).title,'Rewards');
  assert.equal(screenShellState(JOURNEY_STATES.REGISTRATION).headingId,'heading-registration');
});

test('unknown receiver panel state fails closed',()=>{
  assert.throws(()=>screenShellState('mystery'));
});

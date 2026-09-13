import test from 'node:test';
import assert from 'node:assert/strict';
import * as prepared from '../public/flare-s8a/prepared.mjs';

test('prepared S8A module barrel is Node-safe and exposes integration contracts',()=>{
  for(const name of ['builderGoldForResult','transitionJourney','missionCopy','buildRegistrationHandoff','buildResultViewModel','createReplayContext','buildRuntimeHudViewModel','buildCustomizeViewModel','buildMissionViewModel','buildReadyViewModel','buildInvitationViewModel','buildErrorViewModel','createReceiverSession','encodeInviteCode'])assert.equal(typeof prepared[name],'function',name);
});

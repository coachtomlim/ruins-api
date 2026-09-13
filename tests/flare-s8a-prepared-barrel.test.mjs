import test from 'node:test';
import assert from 'node:assert/strict';
import * as prepared from '../public/flare-s8a/prepared.mjs';

test('prepared S8A module barrel is Node-safe and exposes integration contracts',()=>{
  for(const name of ['builderGoldForResult','rewardTeaser','transitionJourney','createFinishHpGoal','missionCopy','challengeShareCopy','buildRegistrationHandoff','buildRegistrationViewModel','buildResultViewModel','createReplayContext','buildRuntimeHudViewModel','buildCustomizeViewModel','buildMissionViewModel','buildReadyViewModel','buildInvitationViewModel','buildErrorViewModel','buildRoomCarousel','roomSwipeDirection','createReceiverSession','buildReceiverView','focusTargetForJourney','mobilePolicy','encodeInviteCode'])assert.equal(typeof prepared[name],'function',name);
});

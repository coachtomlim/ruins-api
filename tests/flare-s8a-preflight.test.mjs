import test from 'node:test';
import assert from 'node:assert/strict';
import { builderGoldForResult, rewardSummary } from '../public/flare-s8a/rewards.mjs';
import { JOURNEY_STATES, transitionJourney, canTransition } from '../public/flare-s8a/journey.mjs';

test('builder gold rewards only successful precision clears',()=>{
  assert.equal(builderGoldForResult({status:'cleared'},0),5);
  assert.equal(builderGoldForResult({status:'cleared'},24.999),5);
  assert.equal(builderGoldForResult({status:'cleared'},25),10);
  assert.equal(builderGoldForResult({status:'cleared'},49.999),10);
  assert.equal(builderGoldForResult({status:'cleared'},50),15);
  assert.equal(builderGoldForResult({status:'cleared'},74.999),15);
  assert.equal(builderGoldForResult({status:'cleared'},75),20);
  assert.equal(builderGoldForResult({status:'cleared'},99.999),20);
  assert.equal(builderGoldForResult({status:'cleared'},100),25);
  for (const status of ['dead','blocked','timeout','invalid']) assert.equal(builderGoldForResult({status},98),0);
  assert.equal(builderGoldForResult({status:'cleared'},101),0);
  assert.equal(builderGoldForResult({status:'cleared'},-1),0);
});

test('friend Hero gold remains separate from builder reward',()=>{
  const r=rewardSummary({result:{status:'cleared',gold:24},score:98,senderName:'Tom'});
  assert.deepEqual(r,{status:'cleared',senderName:'Tom',heroGold:24,builderGold:20,cleared:true});
});

test('receiver journey supports novice path, optional edit, rewards and registration',()=>{
  let s=JOURNEY_STATES.INVITATION;
  s=transitionJourney(s,'ACCEPT');assert.equal(s,JOURNEY_STATES.MISSION);
  s=transitionJourney(s,'USE_DUNGEON');assert.equal(s,JOURNEY_STATES.READY);
  s=transitionJourney(s,'RUN');assert.equal(s,JOURNEY_STATES.RUNTIME);
  s=transitionJourney(s,'COMPLETE');assert.equal(s,JOURNEY_STATES.REWARDS);
  assert.equal(canTransition(s,'RUN_AGAIN'),true);
  assert.equal(canTransition(s,'EDIT_DUNGEON'),true);
  assert.equal(canTransition(s,'SAVE_GOAL'),true);
  s=transitionJourney(s,'SAVE_GOAL');assert.equal(s,JOURNEY_STATES.REGISTRATION);
  s=transitionJourney(s,'BACK_TO_REWARDS');assert.equal(s,JOURNEY_STATES.REWARDS);
});

test('invalid journey transitions fail closed',()=>{
  assert.equal(canTransition(JOURNEY_STATES.INVITATION,'RUN'),false);
  assert.throws(()=>transitionJourney(JOURNEY_STATES.INVITATION,'RUN'));
  assert.throws(()=>transitionJourney(JOURNEY_STATES.RUNTIME,'SAVE_GOAL'));
});

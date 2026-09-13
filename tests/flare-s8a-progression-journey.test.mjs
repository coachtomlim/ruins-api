import test from 'node:test';
import assert from 'node:assert/strict';
import {PROGRESSION_STATES,transitionProgression,canTransitionProgression} from '../public/flare-s8a/progression-journey.mjs';

test('upgrade journey supports stats equipment and armor purchase confirmation',()=>{
  for(const [event,state] of [['OPEN_STATS',PROGRESSION_STATES.STATS],['OPEN_EQUIPMENT',PROGRESSION_STATES.EQUIPMENT],['OPEN_ARMOR',PROGRESSION_STATES.ARMOR]])assert.equal(transitionProgression(PROGRESSION_STATES.HOME,event),state);
  assert.equal(transitionProgression(PROGRESSION_STATES.STATS,'SELECT_OFFER'),PROGRESSION_STATES.CONFIRM);
  assert.equal(transitionProgression(PROGRESSION_STATES.CONFIRM,'PURCHASE_OK'),PROGRESSION_STATES.SUCCESS);
  assert.equal(transitionProgression(PROGRESSION_STATES.SUCCESS,'DONE'),PROGRESSION_STATES.HOME);
});

test('invalid progression shortcuts fail closed',()=>{
  assert.equal(canTransitionProgression(PROGRESSION_STATES.HOME,'PURCHASE_OK'),false);
  assert.throws(()=>transitionProgression(PROGRESSION_STATES.HOME,'PURCHASE_OK'));
});

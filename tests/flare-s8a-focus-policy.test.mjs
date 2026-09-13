import test from 'node:test';
import assert from 'node:assert/strict';
import {JOURNEY_STATES} from '../public/flare-s8a/journey.mjs';
import {focusTargetForJourney,restoreFocusTarget} from '../public/flare-s8a/focus-policy.mjs';

test('every receiver panel has a deterministic heading focus target',()=>{
  for(const state of Object.values(JOURNEY_STATES))assert.match(focusTargetForJourney(state),/^heading-/);
});

test('return actions restore focus to the control that opened the panel',()=>{
  assert.equal(restoreFocusTarget('BACK_TO_REWARDS'),'save-goal');
  assert.equal(restoreFocusTarget('DONE'),'customize');
  assert.equal(restoreFocusTarget('EDIT_DUNGEON'),'edit-dungeon');
  assert.equal(restoreFocusTarget('RUN'),null);
});

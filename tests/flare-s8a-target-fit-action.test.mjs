import test from 'node:test';
import assert from 'node:assert/strict';
import {targetFitAction} from '../public/flare-s8a/target-fit-action.mjs';

test('target-fit action tells player how to move toward goal',()=>{
  assert.equal(targetFitAction(80,50).action,'ADD CHALLENGE');
  assert.equal(targetFitAction(55,50).action,'RUN THIS SETUP');
  assert.equal(targetFitAction(30,50).action,'EASE DUNGEON');
});

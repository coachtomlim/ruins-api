import test from 'node:test';
import assert from 'node:assert/strict';
import {roomSwipeDirection} from '../public/flare-s8a/swipe.mjs';

test('horizontal room swipes map to next and previous room directions',()=>{
  assert.equal(roomSwipeDirection({startX:200,startY:100,endX:120,endY:104}),1);
  assert.equal(roomSwipeDirection({startX:100,startY:100,endX:180,endY:103}),-1);
});

test('short or mostly vertical gestures do not change rooms',()=>{
  assert.equal(roomSwipeDirection({startX:100,startY:100,endX:125,endY:102}),0);
  assert.equal(roomSwipeDirection({startX:100,startY:100,endX:160,endY:190}),0);
});

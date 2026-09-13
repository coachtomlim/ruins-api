import test from 'node:test';
import assert from 'node:assert/strict';
import {applyCameraMode,toggleCameraMode} from '../public/flare-s8a/camera-controller.mjs';

test('overview mode explicitly invalidates stale camera and updates label',()=>{
  const renderer={overview:false,camera:{s:.5,x:10,y:20}};
  const state=applyCameraMode(renderer,'overview');
  assert.equal(renderer.overview,true);
  assert.equal(renderer.camera,null);
  assert.equal(state.label,'FOLLOW HERO');
});

test('camera toggle returns to hero follow and invalidates camera again',()=>{
  const renderer={overview:true,camera:{s:.3,x:0,y:0}};
  const state=toggleCameraMode(renderer);
  assert.equal(renderer.overview,false);
  assert.equal(renderer.camera,null);
  assert.equal(state.label,'OVERVIEW');
});

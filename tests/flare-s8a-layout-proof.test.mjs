import test from 'node:test';
import assert from 'node:assert/strict';
import {rectVisibleInViewport,minTouchTarget,primaryActionProof,missionAbovePrimary,overflowAmount,cameraModeChanged} from './helpers/s8a-layout-proof.mjs';

const viewport={width:390,height:844};

test('primary action must fit viewport and meet touch minimum',()=>{
  const rect={left:20,top:760,right:370,bottom:816,width:350,height:56};
  assert.equal(rectVisibleInViewport(rect,viewport),true);
  assert.equal(minTouchTarget(rect),true);
  assert.deepEqual(primaryActionProof({rect,viewport}),{visible:true,touch:true});
});

test('below-fold primary action fails visibility proof',()=>{
  const rect={left:20,top:820,right:370,bottom:876,width:350,height:56};
  assert.equal(rectVisibleInViewport(rect,viewport),false);
});

test('tiny controls fail touch proof',()=>{
  const rect={left:10,top:10,right:40,bottom:40,width:30,height:30};
  assert.equal(minTouchTarget(rect),false);
});

test('mission appears before primary action',()=>{
  assert.equal(missionAbovePrimary({missionRect:{bottom:400},primaryRect:{top:700}}),true);
  assert.equal(missionAbovePrimary({missionRect:{bottom:760},primaryRect:{top:700}}),false);
});

test('overflow metric reports only positive overflow',()=>{
  assert.equal(overflowAmount({scrollHeight:900,clientHeight:844}),56);
  assert.equal(overflowAmount({scrollHeight:800,clientHeight:844}),0);
});

test('camera proof requires material geometry change',()=>{
  assert.equal(cameraModeChanged({s:.5,x:10,y:20},{s:.51,x:15,y:25}),false);
  assert.equal(cameraModeChanged({s:.5,x:10,y:20},{s:.35,x:10,y:20}),true);
  assert.equal(cameraModeChanged({s:.5,x:10,y:20},{s:.5,x:50,y:20}),true);
});

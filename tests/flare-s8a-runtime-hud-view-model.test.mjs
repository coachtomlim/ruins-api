import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRuntimeHudViewModel} from '../public/flare-s8a/runtime-hud-view-model.mjs';

test('runtime HUD distinguishes Hero Gold from future Builder reward',()=>{
  const vm=buildRuntimeHudViewModel({hp:73,maxHp:120,heroGold:24,seconds:11.73,cameraMode:'follow',paused:false});
  assert.equal(vm.hp.value,73);
  assert.equal(vm.hp.max,120);
  assert.equal(vm.heroGold.label,'HERO GOLD');
  assert.equal(vm.heroGold.value,24);
  assert.match(vm.heroGold.note,/collected by the Hero/i);
  assert.equal(vm.builderRewardVisible,false);
  assert.equal(vm.pauseAction,'PAUSE');
});

test('runtime HUD exposes camera and pause actions explicitly',()=>{
  const overview=buildRuntimeHudViewModel({cameraMode:'overview',paused:true});
  assert.equal(overview.cameraAction,'FOLLOW HERO');
  assert.equal(overview.pauseAction,'RESUME');
});

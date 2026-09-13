import test from 'node:test';
import assert from 'node:assert/strict';
import {targetFitCue} from '../public/flare-s8a/target-fit.mjs';

test('target fit describes precision rather than lethality',()=>{
  assert.deepEqual(targetFitCue(80,50),{id:'gentle',label:'TOO GENTLE',note:'The Hero may finish too healthy. Add a little challenge.'});
  assert.deepEqual(targetFitCue(55,50),{id:'close',label:'CLOSE TO TARGET',note:'This setup is a good starting point for the target.'});
  assert.deepEqual(targetFitCue(30,50),{id:'harsh',label:'TOO HARSH',note:'The Hero may take too much damage. Ease the dungeon.'});
});

test('target fit never labels a setup Easy/Fair/Brutal',()=>{
  for(const [estimate,target] of [[80,50],[55,50],[30,50]])assert.doesNotMatch(targetFitCue(estimate,target).label,/Easy|Fair|Brutal/i);
});

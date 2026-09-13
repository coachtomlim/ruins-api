import test from 'node:test';
import assert from 'node:assert/strict';
import {missionCopy,rewardCopy,registrationCopy} from '../public/flare-s8a/mission-copy.mjs';

test('mission explains precision clear and reward incentive',()=>{
  const m=missionCopy({targetHp:50,sender:'Tom'});
  assert.equal(m.title,'GET THE HERO TO THE EXIT AT ~50% HP');
  assert.match(m.incentive,/higher score \+ more gold/i);
  assert.match(m.warning,/Do not kill the Hero/i);
  assert.match(m.warning,/must clear/i);
  assert.match(m.rewardCue,/WIN UP TO 25 GOLD/);
  assert.match(m.senderLine,/Tom/);
});

test('mission sanitizes sender and clamps target',()=>{
  const m=missionCopy({targetHp:150,sender:'<Eve>'});
  assert.match(m.title,/100% HP/);
  assert.doesNotMatch(m.senderLine,/[<>]/);
});

test('reward copy separates hero and builder ownership',()=>{
  const r=rewardCopy({sender:'Buddy',heroGold:24,builderGold:20,cleared:true});
  assert.equal(r.heroLabel,"BUDDY'S HERO EARNED");
  assert.equal(r.heroValue,'24 GOLD');
  assert.equal(r.builderLabel,'YOU EARNED');
  assert.equal(r.builderValue,'20 GOLD');
  assert.equal(r.outcome,'HERO CLEARED');
});

test('failed run copy cannot imply a successful clear',()=>{
  const r=rewardCopy({sender:'Buddy',heroGold:3,builderGold:0,cleared:false});
  assert.equal(r.outcome,'HERO DID NOT CLEAR');
  assert.equal(r.builderValue,'0 GOLD');
});

test('registration copy explains future persistence without claiming a save',()=>{
  const r=registrationCopy({targetHp:60,sender:'Tom'});
  assert.equal(r.title,'CREATE YOUR DUNGEON RUNNER ACCOUNT');
  assert.match(r.body,/save this goal/i);
  assert.match(r.carriedGoal,/60% HP/);
  assert.match(r.notSaved,/Nothing has been saved yet/);
});

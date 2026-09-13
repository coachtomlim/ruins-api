import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('./fixtures/s8a-mobile-panels.html',import.meta.url),'utf8');

test('mobile fixture contains the complete no-scroll receiver panel journey',()=>{
  for(const panel of ['invitation','mission','customize','ready','runtime','rewards','registration'])assert.match(html,new RegExp(`data-screen="${panel}"`));
  for(const copy of ['GET THE HERO TO THE EXIT AT ~60% HP','CLEAR NEAR 60% HP · WIN UP TO 25 GOLD','CUSTOMIZE — OPTIONAL','RUN THE HERO','TOM\'S HERO EARNED','YOU EARNED','SAVE THIS GOAL & BUILD YOUR OWN','CREATE YOUR DUNGEON RUNNER ACCOUNT'])assert.match(html,new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});

test('fixture uses stable interaction selectors from the DOM contract',()=>{
  for(const id of ['acceptChallenge','missionTarget','roomPreview','useDungeon','openCustomize','finishCustomize','runHero','scene','cameraToggle','pauseToggle','heroRewardGold','builderRewardGold','saveGoalBuildOwn','createAccount','backToRewards'])assert.match(html,new RegExp(`id="${id}"`));
});

test('fixture registration action is visibly present but disabled in S8A',()=>{
  assert.match(html,/<button class="dr-primary" id="createAccount" disabled>CREATE ACCOUNT<\/button>/);
  assert.match(html,/Nothing has been saved yet/);
});

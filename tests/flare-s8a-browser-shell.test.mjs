import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL(`../public/flare-s8a/${name}`,import.meta.url),'utf8');
test('S8A builder and receiver shells own isolated browser routes',async()=>{
  const [index,challenge]=await Promise.all([read('index.html'),read('challenge.html')]);
  assert.match(index,/builder\.mjs/);assert.match(index,/CREATE CHALLENGE LINK/);
  assert.match(challenge,/flare-s8a\/challenge\.mjs/);assert.doesNotMatch(challenge,/flare-s71\/challenge\.mjs/);
});
test('receiver shell exposes every governed screen and stable DOM control',async()=>{
  const html=await read('challenge.html');
  for(const screen of ['invitation','mission','customize','ready','runtime','rewards','registration'])assert.match(html,new RegExp(`data-screen="${screen}"`));
  for(const id of ['acceptChallenge','useDungeon','openCustomize','finishCustomize','runHero','scene','cameraToggle','runAgain','editThisDungeon','saveGoalBuildOwn','createAccount','backToRewards'])assert.match(html,new RegExp(`id="${id}"`));
});

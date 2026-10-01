import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const [source,html]=await Promise.all([readFile(new URL('../public/flare-s8a/challenge.mjs',import.meta.url),'utf8'),readFile(new URL('../public/flare-s8a/challenge.html',import.meta.url),'utf8')]);
test('terminal result renders separate Hero and Builder reward ownership',()=>{assert.match(source,/m\.heroReward\.label/);assert.match(source,/m\.heroReward\.value/);assert.match(source,/m\.builderReward\.value/);assert.match(html,/USE GOLD TO UPGRADE YOUR RUNNER/);});
test('reward continuations preserve replay edit and registration journey events',()=>{for(const event of ['EDIT_DUNGEON','SAVE_GOAL','BACK_TO_REWARDS'])assert.match(source,new RegExp(event));});
test('registration has no credential form of its own and defers account creation to the real S8B flow',()=>{assert.match(html,/CREATE YOUR DUNGEON RUNNER ACCOUNT/);assert.match(html,/id="createAccount"[^>]*disabled/);assert.doesNotMatch(html,/type="password"|type="email"|Buddy \/ Test/);});
test('account handoff carries only the public-safe goal fields, never credentials or identifiers',()=>{
  assert.match(source,/sessionStorage\.setItem\(FRIEND_GOAL_CLAIM_KEY/);
  const start=source.indexOf("$('createAccount').addEventListener");
  const handoffBlock=source.slice(start,source.indexOf('\n',start));
  assert.match(handoffBlock,/senderName:session\.senderName/);
  assert.match(handoffBlock,/runnerId:invite\.runnerId/);
  assert.match(handoffBlock,/targetHp:invite\.targetHp/);
  assert.doesNotMatch(handoffBlock,/email|password|token|uuid|session\.id/i);
  assert.doesNotMatch(source,/localStorage|indexedDB/);
});

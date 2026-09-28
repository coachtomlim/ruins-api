import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildPersistedFriendShareLink,friendShareUrlIsSafe,publicChallengeTokenFromLocation} from '../public/flare-s8b/friend-share.mjs';
import {buildResultReceipt,submitResultReceipt} from '../public/flare-s8a/result-receipt.mjs';
import {buildResultViewModel} from '../public/flare-s8a/result-view-model.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const model={runners:{'warrior-l1':{}},defaultRunner:'warrior-l1'};
const token='abcdefghijklmnopqrstuvwxyzABCDEFG';

test('persisted public link adds opaque correlation while preserving four-character route',()=>{
  const link=buildPersistedFriendShareLink({baseUrl:'https://think-2-thrive.com/quick-dungeon/flare-s8b/',challenge:{challenge_id:'internal-id',runner_id:'warrior-l1',target_hp:60,invite_code:'Qs2Z',sender_name:'Makidon Antiva',public_token:token},model});
  assert.match(link.url,/\/m\/Qs2Z\?from=Makidon\+Antiva&c=/);
  assert.equal(publicChallengeTokenFromLocation({search:new URL(link.url).search}),token);
  assert.equal(friendShareUrlIsSafe(link.url),true);
  assert.doesNotMatch(link.url,/internal-id|@|access_token|service_role/);
});

test('historical link remains valid without correlation token',()=>{
  const link=buildPersistedFriendShareLink({baseUrl:'https://think-2-thrive.com/',challenge:{challenge_id:'internal-id',runner_id:'warrior-l1',target_hp:60,invite_code:'Qs2Z',sender_name:'Tom'},model});
  assert.equal(new URL(link.url).pathname,'/m/Qs2Z');
  assert.equal(new URL(link.url).searchParams.has('c'),false);
});

test('receipt is bounded and submitted only through the narrow idempotent RPC',async()=>{
  const payload=buildResultReceipt({publicToken:token,roomId:'iron-labyrinth-01',encounter:{summary:'Goblin'},rulesVersion:'s8a-1',result:{status:'cleared',hp:56,maxHp:100},score:92,heroGold:24,builderGold:20,inputHash:'0123456789abcdef'});
  const calls=[],client={async rpc(name,args){calls.push([name,args]);return {data:[{result_id:'result-a',duplicate:false}],error:null}}};
  assert.equal((await submitResultReceipt({client,payload})).result_id,'result-a');
  assert.equal(calls[0][0],'submit_builder_challenge_result');
  assert.equal(Object.keys(payload).some(key=>['wallet','xp','equipment','owner_player_id'].some(term=>key.includes(term))),false);
});

test('result comparison preserves distinct rewards and failure clarity',()=>{
  const success=buildResultViewModel({result:{status:'cleared',hp:56,maxHp:100,gold:24},score:92,targetHp:60,senderName:'Makidon Antiva'});
  assert.equal(success.differenceFromTarget,4);assert.equal(success.resultHeading,'CHALLENGE COMPLETE');
  const failed=buildResultViewModel({result:{status:'dead',hp:0,maxHp:100,gold:0},score:0,targetHp:60,senderName:'Makidon Antiva'});
  assert.equal(failed.resultHeading,'HERO DID NOT CLEAR');assert.equal(failed.builderReward.gold,0);
});

test('Runner Hub exposes four top-level destinations and bounded result detail',async()=>{
  const [html,css,app]=await Promise.all([read('public/flare-s8b/index.html'),read('public/flare-s8b/account.css'),read('public/flare-s8b/account-app.mjs')]);
  for(const label of ['HOME','CHALLENGES','LEVEL &amp; STATS','EQUIPMENT'])assert.match(html,new RegExp(label));
  assert.match(html,/CHALLENGE ACTIVITY/);assert.match(html,/id="resultDetailDialog"/);assert.match(app,/markBuilderChallengeResultRead/);
  assert.match(css,/position:fixed[\s\S]*safe-area-inset-bottom/);assert.match(css,/100dvh/);
});

test('receiver invitation and result are viewport states with explicit precision copy',async()=>{
  const [html,css]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/style.css')]);
  for(const text of ['HAS CHALLENGED YOU','YOU ARE THE DUNGEON BUILDER','TOO HARSH','TOO GENTLE','Builder reward = 0','CHOOSE A DUNGEON','Level &amp; Stats · Equipment'])assert.match(html,new RegExp(text));
  assert.match(css,/height:100dvh;overflow:hidden/);assert.match(html,/resultDifference/);assert.match(html,/retryResultReceipt/);
});

test('migration isolates feedback from economy and hardens SECURITY DEFINER functions',async()=>{
  const sql=await read('supabase/migrations/20260928_friend_challenge_feedback_nav.sql');
  assert.match(sql,/public_token/);assert.match(sql,/unique\(challenge_id,deterministic_input_hash\)/);assert.match(sql,/grant execute[\s\S]*to anon,authenticated/);
  assert.match(sql,/security definer set search_path=''/g);assert.match(sql,/owner_player_id=auth\.uid\(\)/);
  assert.doesNotMatch(sql,/insert into public\.(wallet_ledger|runner_xp_event|runner_stat_event|runner_item_ownership)/i);
});

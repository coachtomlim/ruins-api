import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createAttemptToken} from '../public/flare-s8a/attempt-token.mjs';
import {fetchPublicChallengeSnapshot} from '../public/flare-s8b/public-challenge-snapshot.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

test('createAttemptToken produces a bounded opaque identifier, not derived from run facts',()=>{
  const a=createAttemptToken(),b=createAttemptToken();
  assert.match(a,/^[A-Za-z0-9_-]{16,128}$/);
  assert.notEqual(a,b);
});

test('a fresh run gets a new attempt token; the same completed run reuses it across retries',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/startRuntime\(\)\{chooseSessionRoom\(\);currentAttemptToken=createAttemptToken\(\);/);
  assert.match(mjs,/replayRuntime\(\)\{currentAttemptToken=createAttemptToken\(\);/);
  assert.match(mjs,/attemptToken:currentAttemptToken/);
  // completeRuntime builds lastReceiptPayload once per completion; sendResultReceipt (used by both
  // the initial send and the retry button) always resubmits that same frozen payload, so a retry
  // never regenerates the attempt token.
  const start=mjs.indexOf('async function sendResultReceipt');
  const body=mjs.slice(start,mjs.indexOf('\n',start));
  assert.doesNotMatch(body,/createAttemptToken/);
});

test('buildResultReceipt requires an attempt token shaped like createAttemptToken output',async()=>{
  const {buildResultReceipt}=await import('../public/flare-s8a/result-receipt.mjs');
  const base={publicToken:'a'.repeat(32),roomId:'iron-labyrinth-01',encounter:{enemyTypes:['none','none','none'],trapTypes:[],supportTypes:[]},rulesVersion:'s8a-1',result:{status:'cleared',hp:60,maxHp:100},heroGold:5};
  assert.throws(()=>buildResultReceipt(base),/ATTEMPT_TOKEN_REQUIRED/);
  const payload=buildResultReceipt({...base,attemptToken:createAttemptToken()});
  assert.match(payload.p_attempt_token,/^[A-Za-z0-9_-]{16,128}$/);
});

test('submitResultReceipt calls the attempt-aware v2 RPC',async()=>{
  const {submitResultReceipt}=await import('../public/flare-s8a/result-receipt.mjs');
  const calls=[],client={async rpc(name,args){calls.push(name);return {data:[{result_id:'r1',duplicate:false,is_current:true}],error:null}}};
  await submitResultReceipt({client,payload:{}});
  assert.deepEqual(calls,['submit_builder_challenge_result_v2']);
});

test('Challenge Activity now reads through get_builder_challenge_results_v2',async()=>{
  const mjs=await read('public/flare-s8b/account-adapter.mjs');
  assert.match(mjs,/client\.rpc\('get_builder_challenge_results_v2',\{p_limit:Number\(limit\)\|\|10\}\)/);
});

test('fetchPublicChallengeSnapshot validates the token and returns only the safe fields the RPC provides',async()=>{
  await assert.rejects(()=>fetchPublicChallengeSnapshot({client:{rpc:async()=>({data:null,error:null})},publicToken:'too-short'}),/PUBLIC_CHALLENGE_TOKEN_REQUIRED/);
  const calls=[];
  const client={async rpc(name,args){calls.push([name,args]);return {data:[{sender_name:'Tom',target_hp:60,runner_snapshot:{runner:{display_name:'Tough Warrior'}}}],error:null}}};
  const snapshot=await fetchPublicChallengeSnapshot({client,publicToken:'a'.repeat(32)});
  assert.deepEqual(calls,[['get_builder_challenge_public_snapshot',{p_public_token:'a'.repeat(32)}]]);
  assert.equal(snapshot.senderName,'Tom');
  assert.equal(snapshot.targetHp,60);
  assert.deepEqual(snapshot.runnerSnapshot,{runner:{display_name:'Tough Warrior'}});
});

test('fetchPublicChallengeSnapshot returns null for an unknown token instead of throwing',async()=>{
  const client={async rpc(){return {data:[],error:null}}};
  const snapshot=await fetchPublicChallengeSnapshot({client,publicToken:'a'.repeat(32)});
  assert.equal(snapshot,null);
});

test('fetchPublicChallengeSnapshot never requests or forwards private identifiers',async()=>{
  const src=await read('public/flare-s8b/public-challenge-snapshot.mjs');
  assert.doesNotMatch(src,/owner_player_id|owner_runner_id|email|auth_token|access_token/);
});

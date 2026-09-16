import test from 'node:test';
import assert from 'node:assert/strict';
import {createStatPurchaseFlow} from '../public/flare-s8b/stat-purchase-flow.mjs';

const offer={offerId:'endurance-i',name:'Endurance I',goldCost:20,action:{disabled:false}};

test('cancel performs no transaction and a new intent receives a new key',()=>{
  const calls=[],keys=['key-a','key-b'];
  const flow=createStatPurchaseFlow({purchase:async payload=>calls.push(payload),refresh:async()=>{},randomUUID:()=>keys.shift()});
  assert.equal(flow.begin(offer,'runner-a').idempotencyKey,'key-a');
  flow.cancel();
  assert.equal(flow.intent,null);
  assert.equal(calls.length,0);
  assert.equal(flow.begin(offer,'runner-a').idempotencyKey,'key-b');
});

test('rapid confirm is locked to one RPC and refreshes authoritative state',async()=>{
  let resolvePurchase,calls=0,refreshes=0;
  const purchase=new Promise(resolve=>{resolvePurchase=resolve});
  const flow=createStatPurchaseFlow({purchase:async()=>{calls++;return purchase},refresh:async()=>{refreshes++},randomUUID:()=> 'stable-key'});
  flow.begin(offer,'runner-a');
  const first=flow.confirm(),second=await flow.confirm();
  assert.equal(second.status,'ignored');
  assert.equal(calls,1);
  resolvePurchase({balance:80});
  assert.equal((await first).status,'success');
  assert.equal(refreshes,1);
  assert.equal(flow.intent,null);
});

test('unknown outcome retains the same idempotency key for retry',async()=>{
  const payloads=[];let attempt=0;
  const flow=createStatPurchaseFlow({
    purchase:async payload=>{payloads.push(payload);if(attempt++===0)throw new Error('network lost');return {balance:80}},
    refresh:async()=>{},randomUUID:()=> 'stable-key'
  });
  flow.begin(offer,'runner-a');
  const first=await flow.confirm();
  assert.equal(first.feedback.kind,'unknown');
  assert.equal(flow.intent.idempotencyKey,'stable-key');
  assert.equal((await flow.confirm()).status,'success');
  assert.deepEqual(payloads.map(row=>row.idempotencyKey),['stable-key','stable-key']);
});

test('known governed rejection clears intent after authoritative refresh',async()=>{
  let refreshes=0;
  const flow=createStatPurchaseFlow({purchase:async()=>{throw new Error('PROJECTED_RUNNER_OUTSIDE_PREFERRED_ENVELOPE')},refresh:async()=>{refreshes++},randomUUID:()=> 'key'});
  flow.begin(offer,'runner-a');
  const result=await flow.confirm();
  assert.equal(result.feedback.kind,'known');
  assert.equal(flow.intent,null);
  assert.equal(refreshes,1);
});

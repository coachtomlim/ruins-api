import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createBrowserAccountAdapter} from '../public/flare-s8b/supabase-browser.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('browser adapter uses injected public config and official SDK persistence',()=>{
  const calls=[];
  const client={auth:{getSession(){}},from(){},rpc(){}};
  const sdk={createClient(...args){calls.push(args);return client}};
  const adapter=createBrowserAccountAdapter({
    config:{url:'https://project.supabase.co',publishableKey:'sb_publishable_test'},sdk
  });
  assert.equal(adapter.provider,'supabase');
  assert.deepEqual(calls,[['https://project.supabase.co','sb_publishable_test',{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  }]]);
});

test('static account surface has auth states, Runner Hub panels, and display-only training',async()=>{
  const html=await read('public/flare-s8b/index.html');
  for(const text of ['RUNNER HUB','CREATE ACCOUNT','SIGN IN','CHECK YOUR EMAIL','ACCOUNT READY','STATS','EQUIPMENT','ARMOR','SAVE TOM · L3 · 60%','SIGN OUT'])assert.match(html,new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(html,/Confirm your email address, then sign in to continue\./);
  assert.match(html,/id="statsPanel"/);
  assert.match(html,/id="equipmentPanel"/);
  assert.match(html,/id="armorPanel"/);
  assert.match(html,/RUNNER TRAINING/);
  assert.match(html,/DISPLAY ONLY/);
  assert.match(html,/id="trainingOffers"/);
  assert.doesNotMatch(html,/>\s*(?:BUY|PURCHASE)\b/i);
  assert.doesNotMatch(html,/>100<|>12<|>1</);
  assert.match(html,/vendor\/supabase\.js/);
  assert.doesNotMatch(html,/https:\/\/[^"']*(unpkg|jsdelivr|esm\.sh)/i);
});

test('account UI calls governed goal and Runner paths and does not activate reward claiming',async()=>{
  const [app,adapter,view]=await Promise.all([
    read('public/flare-s8b/account-app.mjs'),read('public/flare-s8b/account-adapter.mjs'),read('public/flare-s8b/account-ready-view.mjs')
  ]);
  assert.match(app,/adapter\.saveGoal\(\{senderName:'Tom',runnerId:'warrior-l3',targetHp:60\}\)/);
  assert.match(app,/adapter\.ensureStarterAccount\(\)/);
  assert.match(app,/adapter\.loadAccountState\(\{playerRunnerId:/);
  assert.doesNotMatch(app,/claimGuestRun|claim_proof_builder_reward/);
  assert.doesNotMatch(app,/purchase_progression_offer|\.insert\s*\(/i);
  assert.match(app,/vm\.progressionOffers\.map\(trainingOfferCell\)/);
  assert.match(adapter,/from\('progression_offer_catalog'\)/);
  assert.match(adapter,/get_account_runner_state/);
  assert.match(adapter,/PRODUCT_REWARD_CLAIM_NOT_ENABLED/);
  assert.doesNotMatch(view,/rookieStarterSnapshot|ITEM_CATALOG|wooden-club|wooden-shield/);
});

test('mobile controls meet minimum target and config contains no credential',async()=>{
  const [css,config,version]=await Promise.all([
    read('public/flare-s8b/account.css'),read('public/flare-s8b/config.js'),read('public/flare-s8b/vendor/SUPABASE_VERSION.txt')
  ]);
  assert.match(css,/\.primary,.secondary\{min-height:54px/);
  assert.match(css,/\.text-action\{min-height:44px/);
  assert.match(css,/\.runner-tab\{min-height:44px/);
  assert.match(config,/__FLARE_S8B_PUBLIC_CONFIG__/);
  assert.doesNotMatch(config,/sb_(?:publishable|secret)_|service_role/i);
  assert.equal(version.trim(),'@supabase/supabase-js 2.116.0');
});

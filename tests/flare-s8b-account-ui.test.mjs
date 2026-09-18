import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createBrowserAccountAdapter} from '../public/flare-s8b/supabase-browser.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

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

test('static account surface is player-facing and keeps stat training governed',async()=>{
  const html=await read('public/flare-s8b/index.html');
  for(const text of ['RUNNER HUB','CREATE ACCOUNT','SIGN IN','CHECK YOUR EMAIL','YOUR RUNNER','RUNNER STATS','STATS','EQUIPMENT','ARMOR','SIGN OUT']){
    assert.match(html,new RegExp(escapeRegExp(text)));
  }
  assert.match(html,/id="runnerHeroCanvas"/);
  assert.match(html,/Animated Rookie Warrior with Wooden Club and Wooden Shield/);
  assert.doesNotMatch(html,/ACCOUNT FOUNDATION|AUTHORITATIVE STATS|SAVE TOM · L3 · 60%/);
  assert.match(html,/Confirm your email address, then sign in to continue\./);
  assert.match(html,/id="statsPanel"/);
  assert.match(html,/id="equipmentPanel"/);
  assert.match(html,/id="armorPanel"/);
  assert.match(html,/RUNNER TRAINING/);
  assert.match(html,/PERMANENT STATS/);
  assert.match(html,/id="trainingOffers"/);
  assert.match(html,/CONFIRM PURCHASE/);
  assert.match(html,/id="purchaseDialog"/);
  assert.match(html,/id="confirmRemaining"/);
  const equipment=html.match(/id="equipmentPanel"[\s\S]*?<\/section>/)?.[0]||'';
  const armor=html.match(/id="armorPanel"[\s\S]*?<\/section>/)?.[0]||'';
  assert.doesNotMatch(equipment,/purchase|buy/i);
  assert.doesNotMatch(armor,/purchase|buy/i);
  assert.doesNotMatch(html,/>100<|>12<|>1</);
  assert.match(html,/vendor\/supabase\.js/);
  assert.doesNotMatch(html,/https:\/\/[^"']*(unpkg|jsdelivr|esm\.sh)/i);
});

test('account UI uses authoritative Runner paths, real Hero preview, and does not expose synthetic goal or reward actions',async()=>{
  const [app,adapter,view]=await Promise.all([
    read('public/flare-s8b/account-app.mjs'),read('public/flare-s8b/account-adapter.mjs'),read('public/flare-s8b/account-ready-view.mjs')
  ]);
  assert.doesNotMatch(app,/saveDemoGoal|senderName:'Tom',runnerId:'warrior-l3'/);
  assert.match(app,/adapter\.ensureStarterAccount\(\)/);
  assert.match(app,/adapter\.loadAccountState\(\{playerRunnerId:/);
  assert.doesNotMatch(app,/claimGuestRun|claim_proof_builder_reward/);
  assert.match(app,/adapter\.purchaseProgressionOffer\(payload\)/);
  assert.match(app,/loadS3ActorPack/);
  assert.match(app,/startComposedHeroStance/);
  assert.match(app,/emailRedirectTo:appRedirectUrl\(\)/);
  assert.doesNotMatch(app,/purchase_progression_offer|\.insert\s*\(/i);
  assert.match(app,/vm\.progressionOffers\.map\(trainingOfferCell\)/);
  assert.match(adapter,/from\('progression_offer_catalog'\)/);
  assert.match(adapter,/client\.rpc\('purchase_progression_offer'/);
  assert.match(adapter,/from\('progression_purchase'\)/);
  assert.doesNotMatch(adapter,/\.from\(['"](?:progression_purchase|runner_stat_upgrade_event|wallet_ledger)['"]\).*\.(?:insert|update|upsert|delete)/is);
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
  assert.match(css,/\.runner-portrait/);
  assert.match(config,/__FLARE_S8B_PUBLIC_CONFIG__/);
  assert.doesNotMatch(config,/sb_(?:publishable|secret)_|service_role/i);
  assert.equal(version.trim(),'@supabase/supabase-js 2.116.0');
});

test('purchase success acknowledgment sits above the Runner card and training offers, and Gold purpose is explained',async()=>{
  const html=await read('public/flare-s8b/index.html');
  assert.match(html,/id="purchaseStatus"[^>]*role="status"[^>]*aria-live="polite"/);
  const identityIndex=html.indexOf('id="displayName"');
  const statusIndex=html.indexOf('id="purchaseStatus"');
  const runnerCardIndex=html.indexOf('class="runner-card"');
  const trainingOffersIndex=html.indexOf('id="trainingOffers"');
  assert.ok(identityIndex>-1&&statusIndex>-1&&runnerCardIndex>-1&&trainingOffersIndex>-1,'expected markup missing');
  assert.ok(identityIndex<statusIndex,'purchaseStatus should follow the Player/Gold identity row');
  assert.ok(statusIndex<runnerCardIndex,'purchaseStatus should precede the Runner card');
  assert.ok(statusIndex<trainingOffersIndex,'purchaseStatus should precede the training offer list');
  assert.match(html,/Spend Gold to permanently upgrade your Runner\./);
  assert.doesNotMatch(html,/catalog|calibration|PREFERRED envelope/i);
});

test('success wording only fires after authoritative purchase success, never on cancel',async()=>{
  const app=await read('public/flare-s8b/account-app.mjs');
  assert.match(app,/status==='success'[\s\S]{0,80}byId\('purchaseStatus'\)\.textContent='RUNNER UPGRADED'/);
  assert.doesNotMatch(app,/closePurchaseConfirmation[\s\S]{0,120}RUNNER UPGRADED/);
  const cancelBody=app.match(/function closePurchaseConfirmation\(\)\{[\s\S]*?\}/)?.[0]||'';
  assert.doesNotMatch(cancelBody,/RUNNER UPGRADED/);
});

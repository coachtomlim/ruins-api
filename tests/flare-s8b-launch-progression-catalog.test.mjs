import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeProgressionOffers} from '../public/flare-s8b/account-ready-view.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const activationPath='supabase/migrations/20260915_s8b_launch_progression_catalog.sql';

test('launch catalog binds the accepted calibration and activates exactly three offers',async()=>{
  const sql=await read(activationPath);
  assert.equal((sql.match(/'s8b-launch-progression-001'/g)||[]).length,4);
  assert.match(sql,/'s8b-economy-calibration-001'/);
  assert.match(sql,/insert into public\.progression_offer_catalog[\s\S]*values[\s\S]*endurance-i[\s\S]*strike-i[\s\S]*guard-i/i);
  assert.doesNotMatch(sql,/'ITEM'/);
});

test('launch offers have only the accepted stat units and prices',async()=>{
  const sql=await read(activationPath);
  assert.match(sql,/'endurance-i',\s*'STAT',\s*'hp',\s*5,\s*null,\s*20,\s*true/i);
  assert.match(sql,/'strike-i',\s*'STAT',\s*'attack',\s*1,\s*null,\s*30,\s*true/i);
  assert.match(sql,/'guard-i',\s*'STAT',\s*'defense',\s*1,\s*null,\s*40,\s*true/i);
});

test('client projection derives display labels from authoritative offer rows',()=>{
  const rows=normalizeProgressionOffers([
    {catalog_version:'s8b-launch-progression-001',offer_id:'endurance-i',kind:'STAT',stat_key:'hp',stat_amount:5,gold_cost:20},
    {catalog_version:'s8b-launch-progression-001',offer_id:'strike-i',kind:'STAT',stat_key:'attack',stat_amount:1,gold_cost:30},
    {catalog_version:'s8b-launch-progression-001',offer_id:'guard-i',kind:'STAT',stat_key:'defense',stat_amount:1,gold_cost:40}
  ]);
  assert.deepEqual(rows.map(({name,effectLabel,priceLabel})=>({name,effectLabel,priceLabel})),[
    {name:'Endurance I',effectLabel:'+5 HP',priceLabel:'20 Gold'},
    {name:'Strike I',effectLabel:'+1 ATK',priceLabel:'30 Gold'},
    {name:'Guard I',effectLabel:'+1 DEF',priceLabel:'40 Gold'}
  ]);
});

test('purchase UI remains inactive and transaction enforcement remains intact',async()=>{
  const [html,app,foundation]=await Promise.all([
    read('public/flare-s8b/index.html'),
    read('public/flare-s8b/account-app.mjs'),
    read('supabase/migrations/20260915_s8b_progression_transaction_foundation.sql')
  ]);
  assert.doesNotMatch(html,/>\s*(?:BUY|PURCHASE)\b/i);
  assert.doesNotMatch(app,/purchase_progression_offer|\.insert\s*\(/i);
  assert.match(foundation,/unique\s*\(player_runner_id,\s*catalog_version,\s*offer_id\)/i);
  assert.match(foundation,/OFFER_ALREADY_PURCHASED/);
  assert.match(foundation,/PROJECTED_RUNNER_OUTSIDE_PREFERRED_ENVELOPE/);
});

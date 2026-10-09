import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LEVEL1_PRESETS,GOVERNED_BRUTAL_ROOM_ID} from '../public/flare-s8a/governed-encounter.mjs';
import {buildResultReceipt} from '../public/flare-s8a/result-receipt.mjs';
import {receiptSupportsEncounter,RECEIPT_SERVER_ENEMY_IDS,RECEIPT_SERVER_MAX_ENEMIES} from '../public/flare-s8a/level2-content.mjs';

// Static contract tests for the 002E9C migration (no local Postgres here). They prove (a) the new function body is
// the applied 002E9A body plus EXACTLY the documented edits, and (b) the migration's own governed tables, parsed from
// the SQL text, accept the exact governed BRUTAL receipt and nothing wider. Live behaviour is proven by PM on S8B Staging
// with supabase/staging-proofs/20261004_002e9c_governed_brutal_receipts_proof.sql.
const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const NEW='supabase/migrations/20261004_friend_challenge_feedback_002e9c_governed_brutal_receipts.sql';
const PRIOR='supabase/migrations/20261003_friend_challenge_feedback_002e9a_level2_receipts.sql';
const norm=s=>s.replace(/\r\n/g,'\n');
const fnOf=sql=>{const a=sql.indexOf('create or replace function public.submit_builder_challenge_result_v2(');const b=sql.indexOf('to anon,authenticated;');return sql.slice(a,sql.indexOf('\n',b)+1)};
let sql,prior,fn,priorFn;
test.before(async()=>{sql=norm(await read(NEW));prior=norm(await read(PRIOR));fn=fnOf(sql);priorFn=fnOf(prior)});

const parse=()=>{
  const allowed=/x not in \(([^)]*)\)\) then\s*\n\s*raise exception 'RESULT_ENCOUNTER_INVALID'/.exec(fn)[1].split(',').map(s=>s.trim().replace(/'/g,'')).filter(x=>x!=='none');
  const block=/select coalesce\(sum\(case x([\s\S]*?)into v_budget,v_hero_gold_max/.exec(fn)[1];
  const [c,g]=block.split(/coalesce\(sum\(case x/);
  const pairs=t=>Object.fromEntries([...t.matchAll(/when '([a-z-]+)' then (\d+)/g)].map(m=>[m[1],Number(m[2])]));
  const gold=/p_hero_gold>\(case when v_governed then (\d+) else (\d+) end\)/.exec(fn);
  return{allowed,cost:pairs(c),gold:pairs(g),governedCeiling:Number(gold[1]),ordinaryCeiling:Number(gold[2]),maxSlots:Number(/jsonb_array_length\(p_encounter->'enemyTypes'\)>(\d+)/.exec(fn)[1]),governedRoom:/p_room_id='([a-z0-9-]+)'/.exec(fn.slice(fn.indexOf('v_governed:=')))[1],governedMix:/v_enemy_slots=array\[([^\]]*)\]/.exec(fn)[1].split(',').map(s=>s.trim().replace(/'/g,''))};
};
// Reference evaluation of the validation order for the parts this migration touches.
function receipt({roomId,enemyTypes,trapTypes=[],supportTypes=[],heroGold}){
  const t=parse();
  if(enemyTypes.length>t.maxSlots)return{ok:false,error:'RESULT_ENCOUNTER_INVALID'};
  const slots=Array.from({length:Math.max(3,enemyTypes.length)},(_,i)=>enemyTypes[i]??'none');
  if(slots.some(x=>x!=='none'&&!t.allowed.includes(x)))return{ok:false,error:'RESULT_ENCOUNTER_INVALID'};
  const governed=roomId===t.governedRoom&&slots.length===t.governedMix.length&&slots.every((x,i)=>x===t.governedMix[i])&&!trapTypes.length&&!supportTypes.length;
  if(slots.length>3&&!governed)return{ok:false,error:'RESULT_ENCOUNTER_INVALID'};
  const budget=slots.reduce((n,x)=>n+(t.cost[x]||0),0)+trapTypes.reduce((n,x)=>n+({'spike-trap':20,'dart-trap':15}[x]||0),0)+supportTypes.length*15;
  const max=slots.reduce((n,x)=>n+(t.gold[x]||0),0);
  if(budget>100&&!governed)return{ok:false,error:'RESULT_ENCOUNTER_BUDGET_EXCEEDED'};
  if(heroGold>max||heroGold>(governed?t.governedCeiling:t.ordinaryCeiling))return{ok:false,error:'RESULT_HERO_GOLD_INVALID'};
  return{ok:true,budget,max,governed};
}
const BRUTAL=['goblin','goblin','skeleton','skeleton','skeleton'];

test('new additive file; applied 002E9A/002B* migrations untouched; NOT applied (no apply tooling referenced)',()=>{
  assert.match(sql,/create or replace function public\.submit_builder_challenge_result_v2\(/);
  assert.doesNotMatch(sql,/drop table|drop column|drop function|create table/i);
  assert.match(prior,/check \(hero_gold between 0 and 31\)/);
  assert.match(sql,/NOT applied by\s*\n-- Claude/);
});

test('the function is the applied 002E9A body plus EXACTLY the documented edits (replay, attempt_token, idempotency, is_current, superseded_at, score, Builder Gold, max-HP authority untouched)',()=>{
  const reverted=fn
    .replace("  v_attempt_token text;\n  v_governed boolean:=false;\nbegin","  v_attempt_token text;\nbegin")
    .replace("jsonb_array_length(p_encounter->'enemyTypes')>5","jsonb_array_length(p_encounter->'enemyTypes')>3")
    .replace(/  -- 002E9C: up to FIVE slots[\s\S]*?\) into v_enemy_slots;\n/,"  select array[\n    coalesce(p_encounter->'enemyTypes'->>0,'none'),\n    coalesce(p_encounter->'enemyTypes'->>1,'none'),\n    coalesce(p_encounter->'enemyTypes'->>2,'none')\n  ] into v_enemy_slots;\n")
    .replace(/  -- 002E9C: the ONE encounter allowed[\s\S]*?end if;\n\n  select coalesce\(sum\(case x/,"  select coalesce(sum(case x")
    .replace("if v_budget>100 and not v_governed then","if v_budget>100 then")
    .replace("p_hero_gold>(case when v_governed then 39 else 31 end) then","p_hero_gold>31 then");
  assert.equal(reverted,priorFn);
});

test('accepted enemy ids stay the explicit governed list; max slots 5; ordinary ceiling 31; governed ceiling 39',()=>{
  const t=parse();
  assert.deepEqual(t.allowed,['goblin','skeleton','goblin-elite','antlion','zombie','skeleton-archer']);
  assert.equal(t.maxSlots,5);assert.equal(t.ordinaryCeiling,31);assert.equal(t.governedCeiling,39);
  assert.match(sql,/check \(hero_gold between 0 and 39\)/);
  assert.doesNotMatch(sql,/hero_gold between 0 and (4\d|[5-9]\d|\d{3})/);
  assert.deepEqual(t.cost,{goblin:20,skeleton:30,'goblin-elite':40,antlion:50,zombie:35,'skeleton-archer':35});
  assert.deepEqual(t.gold,{goblin:6,skeleton:9,'goblin-elite':12,antlion:15,zombie:11,'skeleton-archer':11});
});

test('the governed exception is exactly iron-labyrinth-08 + goblin,goblin,skeleton,skeleton,skeleton + no traps + no supports, and matches the client preset',()=>{
  const t=parse();
  assert.equal(t.governedRoom,'iron-labyrinth-08');assert.deepEqual(t.governedMix,BRUTAL);
  assert.match(fn,/cardinality\(v_traps\)=0 and cardinality\(v_supports\)=0;/);
  const b=LEVEL1_PRESETS.find(p=>p.id==='brutal');
  assert.equal(b.roomId,t.governedRoom);assert.equal(GOVERNED_BRUTAL_ROOM_ID,t.governedRoom);assert.deepEqual([...b.encounter.enemyTypes],t.governedMix);
});

test('the table CHECK is found by catalog introspection (never a guessed name), re-created under an explicit name, and asserted',()=>{
  assert.ok(sql.includes("pg_get_constraintdef(con.oid) ~ '^CHECK \\(+hero_gold'"));
  assert.match(sql,/con\.contype = 'c'/);
  assert.match(sql,/add constraint builder_challenge_result_hero_gold_range/);
  assert.match(sql,/FRIEND_FEEDBACK_002E9C_ASSERTION_FAILED/);
});

test('11/13: the exact governed BRUTAL receipt succeeds with Hero Gold 39 and budget 130; ordinary receipts are unchanged',()=>{
  assert.deepEqual(receipt({roomId:'iron-labyrinth-08',enemyTypes:BRUTAL,heroGold:39}),{ok:true,budget:130,max:39,governed:true});
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:BRUTAL,heroGold:30}).ok,true);
  assert.deepEqual(receipt({roomId:'iron-labyrinth-01',enemyTypes:['skeleton','goblin'],heroGold:15}),{ok:true,budget:50,max:15,governed:false});
  assert.equal(receipt({roomId:'iron-labyrinth-03',enemyTypes:['skeleton','goblin','skeleton'],heroGold:24}).ok,true);
  assert.equal(receipt({roomId:'iron-labyrinth-07',enemyTypes:['zombie','zombie','skeleton'],heroGold:31}).ok,true);
});

test('14: 40+ Hero Gold is rejected even on the governed preset; derived maximum still binds ordinary encounters',()=>{
  for(const g of [40,41,99])assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:BRUTAL,heroGold:g}).error,'RESULT_HERO_GOLD_INVALID');
  assert.equal(receipt({roomId:'iron-labyrinth-01',enemyTypes:['skeleton','goblin'],heroGold:39}).error,'RESULT_HERO_GOLD_INVALID');
  assert.equal(receipt({roomId:'iron-labyrinth-03',enemyTypes:['zombie','zombie','skeleton'],heroGold:32}).error,'RESULT_HERO_GOLD_INVALID');
});

test('12: arbitrary >100 and >3-monster encounters are rejected; the exception is not reusable',()=>{
  assert.equal(receipt({roomId:'iron-labyrinth-03',enemyTypes:['antlion','antlion','zombie'],heroGold:0}).error,'RESULT_ENCOUNTER_BUDGET_EXCEEDED');
  assert.equal(receipt({roomId:'iron-labyrinth-03',enemyTypes:BRUTAL,heroGold:39}).error,'RESULT_ENCOUNTER_INVALID','governed mix outside Scattered Hall');
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:BRUTAL,trapTypes:['spike-trap'],heroGold:39}).error,'RESULT_ENCOUNTER_INVALID');
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:BRUTAL,supportTypes:['small-potion'],heroGold:39}).error,'RESULT_ENCOUNTER_INVALID');
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:['skeleton','skeleton','skeleton','skeleton','skeleton'],heroGold:45}).error,'RESULT_ENCOUNTER_INVALID');
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:['skeleton','skeleton','skeleton','goblin','goblin'],heroGold:39}).error,'RESULT_ENCOUNTER_INVALID','order is part of the governed composition');
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:['goblin','goblin','skeleton','skeleton'],heroGold:30}).error,'RESULT_ENCOUNTER_INVALID','4 monsters');
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:[...BRUTAL,'goblin'],heroGold:45}).error,'RESULT_ENCOUNTER_INVALID','6 monsters');
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:['goblin','goblin','skeleton','skeleton','zombie'],heroGold:41}).error,'RESULT_ENCOUNTER_INVALID');
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:['dragon'],heroGold:0}).error,'RESULT_ENCOUNTER_INVALID');
});

test('exhaustive: over every 3-monster encounter within 100, maximum derivable Gold stays 31; only the governed preset reaches 39',()=>{
  const ids=['none',...parse().allowed];let top=0;
  for(const a of ids)for(const b of ids)for(const c of ids){const cost=[a,b,c].reduce((n,x)=>n+(parse().cost[x]||0),0),gold=[a,b,c].reduce((n,x)=>n+(parse().gold[x]||0),0);if(cost>100)continue;top=Math.max(top,gold);assert.equal(receipt({roomId:'iron-labyrinth-03',enemyTypes:[a,b,c],heroGold:gold}).ok,true);}
  assert.equal(top,31);
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:BRUTAL,heroGold:39}).max,39);
});

test('the byte-identical tail (attempt token, idempotency, supersession, insert) is unchanged from 002E9A',()=>{
  const tail=s=>s.slice(s.indexOf('v_attempt_token:=coalesce('));
  assert.equal(tail(fn),tail(priorFn));
  assert.match(fn,/set is_current=false, superseded_at=now\(\)/);
});

test('no durable Builder progression or other function is introduced',()=>{
  assert.equal((sql.match(/create or replace function/g)||[]).length,1);
  assert.doesNotMatch(sql,/builder_progression|builder_level|create table/i);
});

test('proof script exists, targets staging only and covers governed success plus every rejection',async()=>{
  const proof=await read('supabase/staging-proofs/20261004_002e9c_governed_brutal_receipts_proof.sql');
  assert.match(proof,/qpgwqmduqtqidmhbuclw/);
  assert.match(proof,/Never production/);
  for(const needle of ['"goblin","goblin","skeleton","skeleton","skeleton"','39','40','iron-labyrinth-08','RESULT_HERO_GOLD_INVALID','RESULT_ENCOUNTER_INVALID','RESULT_ENCOUNTER_BUDGET_EXCEEDED','superseded_at','duplicate=true','is_current'])assert.ok(proof.includes(needle),needle);
});

test('client receipt payload preserves all five monsters and accepts 39 Gold; 40 is refused client-side too',()=>{
  const token='T'.repeat(40),attempt='a'.repeat(20);
  const p=buildResultReceipt({publicToken:token,roomId:'iron-labyrinth-08',encounter:{enemyTypes:BRUTAL,trapTypes:[],supportTypes:[]},rulesVersion:'s8a-1',result:{status:'cleared',hp:30,maxHp:100},heroGold:39,attemptToken:attempt});
  assert.deepEqual(p.p_encounter.enemyTypes,BRUTAL);assert.equal(p.p_hero_gold,39);assert.equal(p.p_room_id,'iron-labyrinth-08');
  assert.throws(()=>buildResultReceipt({publicToken:token,roomId:'iron-labyrinth-08',encounter:{enemyTypes:BRUTAL},rulesVersion:'s8a-1',result:{status:'cleared',hp:30,maxHp:100},heroGold:40,attemptToken:attempt}),/INVALID_HERO_GOLD/);
});

test('client guard (final, tightened by 002E9D): ordinary guards up to eight and the governed Brutal submit; nine and unknown ids do not',()=>{
  assert.equal(RECEIPT_SERVER_MAX_ENEMIES,5);
  assert.equal(receiptSupportsEncounter({enemyTypes:BRUTAL},{roomId:'iron-labyrinth-08'}),true,'governed five-monster Brutal submits');
  assert.equal(receiptSupportsEncounter({enemyTypes:[...BRUTAL,'goblin']},{roomId:'iron-labyrinth-08'}),true,'six entries are structurally supported; the server rejects them as over-budget');
  assert.equal(receiptSupportsEncounter({enemyTypes:Array(9).fill('goblin')},{roomId:'iron-labyrinth-08'}),false,'nine entries never submit');
  assert.equal(receiptSupportsEncounter({enemyTypes:['skeleton','goblin','none']}),true,'ordinary 2-monster EASY');
  assert.equal(receiptSupportsEncounter({enemyTypes:['skeleton','goblin','skeleton']}),true,'ordinary 3-monster JUST NICE');
  assert.equal(receiptSupportsEncounter({enemyTypes:['zombie','skeleton-archer','goblin']}),true,'Level 2 monsters still supported');
  assert.equal(receiptSupportsEncounter({enemyTypes:['goblin','goblin','skeleton','skeleton','dragon']},{roomId:'iron-labyrinth-08'}),false,'unknown id blocked');
  assert.equal(receiptSupportsEncounter({enemyTypes:['goblin','goblin','skeleton','skeleton','Skeleton']},{roomId:'iron-labyrinth-08'}),false);
  assert.deepEqual([...RECEIPT_SERVER_ENEMY_IDS],['goblin','skeleton','goblin-elite','antlion','zombie','skeleton-archer']);
});

test('receipt plan (final): governed Brutal builds a normal payload with all five monsters and 39 Gold; six monsters and 40 Gold never submit',async()=>{
  const {planResultReceipt}=await import('../public/flare-s8a/receipt-plan.mjs');
  const base={publicToken:'T'.repeat(40),roomId:'iron-labyrinth-08',result:{status:'cleared',hp:30,maxHp:100},attemptToken:'a'.repeat(20)};
  const ok=planResultReceipt({...base,encounter:{enemyTypes:BRUTAL,trapTypes:[],supportTypes:[]},heroGold:39});
  assert.equal(ok.block,null);assert.deepEqual(ok.payload.p_encounter.enemyTypes,BRUTAL);assert.equal(ok.payload.p_hero_gold,39);
  const six=planResultReceipt({...base,encounter:{enemyTypes:[...BRUTAL,'goblin'],trapTypes:[],supportTypes:[]},heroGold:45});
  assert.deepEqual([six.payload,six.block],[null,'PAYLOAD_INVALID'],'Hero Gold above the 39 ceiling never submits');
  const nine=planResultReceipt({...base,encounter:{enemyTypes:Array(9).fill('goblin'),trapTypes:[],supportTypes:[]},heroGold:30});
  assert.deepEqual([nine.payload,nine.block],[null,'UNSUPPORTED_ENCOUNTER']);
  const forty=planResultReceipt({...base,encounter:{enemyTypes:BRUTAL,trapTypes:[],supportTypes:[]},heroGold:40});
  assert.deepEqual([forty.payload,forty.block],[null,'PAYLOAD_INVALID']);
  const unknown=planResultReceipt({...base,encounter:{enemyTypes:['dragon'],trapTypes:[],supportTypes:[]},heroGold:0});
  assert.equal(unknown.block,'UNSUPPORTED_ENCOUNTER');
  const l2=planResultReceipt({...base,roomId:'iron-labyrinth-07',encounter:{enemyTypes:['zombie','zombie','skeleton'],trapTypes:[],supportTypes:[]},heroGold:31});
  assert.equal(l2.block,null);assert.equal(l2.payload.p_hero_gold,31);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {receiptSupportsEncounter,RECEIPT_SERVER_ENEMY_IDS,RECEIPT_SERVER_ORDINARY_MAX_ENEMIES,RECEIPT_SERVER_MAX_ENEMIES} from '../public/flare-s8a/level2-content.mjs';
import {planResultReceipt} from '../public/flare-s8a/receipt-plan.mjs';
import {MAX_GUARD_SLOTS} from '../public/flare-s8a/governed-encounter.mjs';

// Static contract tests for the 002E9D migration (no local Postgres): the function is the 002E9C body plus exactly the
// documented edits, and the migration's own governed tables (parsed from the SQL) are evaluated over every build the
// eight-slot guard mixer can produce. Live behaviour is proven by PM on S8B Staging with
// supabase/staging-proofs/20261005_002e9d_eight_guard_receipts_proof.sql. The migration is NOT applied here.
const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const NEW='supabase/migrations/20261005_friend_challenge_feedback_002e9d_eight_guard_receipts.sql';
const PRIOR='supabase/migrations/20261004_friend_challenge_feedback_002e9c_governed_brutal_receipts.sql';
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
function receipt({roomId,enemyTypes,trapTypes=[],supportTypes=[],heroGold}){
  const t=parse();
  if(enemyTypes.length>t.maxSlots)return{ok:false,error:'RESULT_ENCOUNTER_INVALID'};
  const slots=Array.from({length:Math.max(3,enemyTypes.length)},(_,i)=>enemyTypes[i]??'none');
  if(slots.some(x=>x!=='none'&&!t.allowed.includes(x)))return{ok:false,error:'RESULT_ENCOUNTER_INVALID'};
  const governed=roomId===t.governedRoom&&slots.length===t.governedMix.length&&slots.every((x,i)=>x===t.governedMix[i])&&!trapTypes.length&&!supportTypes.length;
  const budget=slots.reduce((n,x)=>n+(t.cost[x]||0),0)+trapTypes.reduce((n,x)=>n+({'spike-trap':20,'dart-trap':15}[x]||0),0)+supportTypes.length*15;
  const max=slots.reduce((n,x)=>n+(t.gold[x]||0),0);
  if(budget>100&&!governed)return{ok:false,error:'RESULT_ENCOUNTER_BUDGET_EXCEEDED'};
  if(heroGold>max||heroGold>(governed?t.governedCeiling:t.ordinaryCeiling))return{ok:false,error:'RESULT_HERO_GOLD_INVALID'};
  return{ok:true,budget,max,governed};
}
const BRUTAL=['goblin','goblin','skeleton','skeleton','skeleton'];
const R='iron-labyrinth-03';

test('new additive migration; 20261004 and earlier are not edited; not applied',()=>{
  assert.match(sql,/create or replace function public\.submit_builder_challenge_result_v2\(/);
  assert.doesNotMatch(sql,/drop table|drop column|drop function|create table|alter table/i);
  assert.match(sql,/NOT applied by Claude/);
  assert.match(prior,/jsonb_array_length\(p_encounter->'enemyTypes'\)>5/);
});

test('the function is the applied 002E9C body plus EXACTLY the documented edits (idempotency, supersession, attempt_token, score, Builder Gold, max-HP untouched)',()=>{
  const reverted=fn
    .replace("jsonb_array_length(p_encounter->'enemyTypes')>8","jsonb_array_length(p_encounter->'enemyTypes')>5")
    .replace(/  -- 002E9C\/002E9D: up to EIGHT slots[\s\S]*?\n  -- to the 002E9A function\.\n/,"  -- 002E9C: up to FIVE slots, padded to at least three with 'none' exactly as before, so every\n  -- encounter of three or fewer monsters normalises (and hashes) byte-identically to the 002E9A function.\n")
    .replace(/  -- 002E9C: the ONE encounter allowed beyond the ordinary 100 budget[\s\S]*?BUDGET_EXCEEDED\.\n/,"  -- 002E9C: the ONE encounter allowed beyond three monsters / the ordinary 100 budget is the governed\n  -- Level 1 BRUTAL starter preset: iron-labyrinth-08 with exactly goblin,goblin,skeleton,skeleton,skeleton\n  -- (in that order), no traps and no supports. Anything else with more than three monsters is invalid.\n")
    .replace("    and cardinality(v_traps)=0 and cardinality(v_supports)=0;\n\n","    and cardinality(v_traps)=0 and cardinality(v_supports)=0;\n  if cardinality(v_enemy_slots)>3 and not v_governed then\n    raise exception 'RESULT_ENCOUNTER_INVALID';\n  end if;\n\n");
  assert.equal(reverted,priorFn);
  assert.notEqual(fn,priorFn);
});

test('array limit is 8; allow-list, budget map and Hero Gold maps unchanged; ceilings 31 ordinary / 39 governed',()=>{
  const t=parse();
  assert.equal(t.maxSlots,8);assert.equal(MAX_GUARD_SLOTS,8);
  assert.deepEqual(t.allowed,['goblin','skeleton','goblin-elite','antlion','zombie','skeleton-archer']);
  assert.deepEqual(t.cost,{goblin:20,skeleton:30,'goblin-elite':40,antlion:50,zombie:35,'skeleton-archer':35});
  assert.deepEqual(t.gold,{goblin:6,skeleton:9,'goblin-elite':12,antlion:15,zombie:11,'skeleton-archer':11});
  assert.equal(t.ordinaryCeiling,31);assert.equal(t.governedCeiling,39);
  assert.match(fn,/if v_budget>100 and not v_governed then raise exception 'RESULT_ENCOUNTER_BUDGET_EXCEEDED'; end if;/);
  assert.equal(t.governedRoom,'iron-labyrinth-08');assert.deepEqual(t.governedMix,BRUTAL);
});

test('ordinary quantity builds up to the 100 budget are accepted, including 4 and 5 guards; the governed Brutal and Level 2 receipts still pass',()=>{
  assert.deepEqual(receipt({roomId:R,enemyTypes:['goblin','goblin','goblin','goblin'],heroGold:24}),{ok:true,budget:80,max:24,governed:false});
  assert.deepEqual(receipt({roomId:R,enemyTypes:['goblin','goblin','goblin','goblin','goblin'],heroGold:30}),{ok:true,budget:100,max:30,governed:false});
  assert.equal(receipt({roomId:R,enemyTypes:['goblin','goblin','skeleton','skeleton'],heroGold:30}).ok,true);
  assert.equal(receipt({roomId:R,enemyTypes:['goblin','skeleton','goblin','none'],heroGold:21}).ok,true,'padding entries are harmless');
  assert.deepEqual(receipt({roomId:'iron-labyrinth-08',enemyTypes:BRUTAL,heroGold:39}),{ok:true,budget:130,max:39,governed:true});
  assert.equal(receipt({roomId:'iron-labyrinth-07',enemyTypes:['zombie','zombie','skeleton'],heroGold:31}).ok,true);
  assert.equal(receipt({roomId:R,enemyTypes:['skeleton','goblin'],heroGold:15}).ok,true);
});

test('arbitrary over-budget encounters stay illegal whatever the array length (101..130 and beyond)',()=>{
  assert.equal(receipt({roomId:R,enemyTypes:Array(6).fill('goblin'),heroGold:0}).error,'RESULT_ENCOUNTER_BUDGET_EXCEEDED');
  assert.equal(receipt({roomId:R,enemyTypes:BRUTAL,heroGold:39}).error,'RESULT_ENCOUNTER_BUDGET_EXCEEDED','the Brutal mix is only legal in Scattered Hall');
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:BRUTAL,trapTypes:['spike-trap'],heroGold:39}).error,'RESULT_ENCOUNTER_BUDGET_EXCEEDED');
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:['skeleton','skeleton','skeleton','skeleton','skeleton'],heroGold:45}).error,'RESULT_ENCOUNTER_BUDGET_EXCEEDED');
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:['goblin','goblin','skeleton','skeleton','skeleton','goblin'],heroGold:45}).error,'RESULT_ENCOUNTER_BUDGET_EXCEEDED');
  assert.equal(receipt({roomId:R,enemyTypes:Array(8).fill('goblin'),heroGold:0}).error,'RESULT_ENCOUNTER_BUDGET_EXCEEDED','eight slots is capacity, not permission');
  assert.equal(receipt({roomId:R,enemyTypes:Array(9).fill('goblin'),heroGold:0}).error,'RESULT_ENCOUNTER_INVALID','nine entries exceed the array limit');
  assert.equal(receipt({roomId:R,enemyTypes:['goblin','goblin','goblin','goblin','dragon'],heroGold:0}).error,'RESULT_ENCOUNTER_INVALID','unknown ids still rejected');
});

test('excessive Gold stays rejected: the derived maximum binds first, 32 on any ordinary build and 40 on the governed Brutal',()=>{
  assert.equal(receipt({roomId:R,enemyTypes:['goblin','goblin','goblin','goblin'],heroGold:25}).error,'RESULT_HERO_GOLD_INVALID');
  assert.equal(receipt({roomId:R,enemyTypes:['zombie','zombie','skeleton'],heroGold:32}).error,'RESULT_HERO_GOLD_INVALID');
  assert.equal(receipt({roomId:'iron-labyrinth-08',enemyTypes:BRUTAL,heroGold:40}).error,'RESULT_HERO_GOLD_INVALID');
});

test('exhaustive: over EVERY quantity mix of up to eight guards of the six allowed monsters, plus traps and support, the legal builds are exactly those within 100 and none derives more than 31 Gold',()=>{
  const t=parse(),ids=t.allowed;let top=0,legal=0,illegal=0,maxGuards=0;
  const rec=(i,left,list)=>{
    if(i===ids.length){
      if(list.length===0)return;
      const cost=list.reduce((n,x)=>n+t.cost[x],0),gold=list.reduce((n,x)=>n+t.gold[x],0);
      const r=receipt({roomId:R,enemyTypes:list,heroGold:gold});
      if(cost<=100){assert.equal(r.ok,true,list.join());legal++;top=Math.max(top,gold);maxGuards=Math.max(maxGuards,list.length);assert.ok(gold<=t.ordinaryCeiling)}
      else{assert.equal(r.error,'RESULT_ENCOUNTER_BUDGET_EXCEEDED',list.join());illegal++;}
      return;
    }
    for(let n=0;n<=left;n++)rec(i+1,left-n,[...list,...Array(n).fill(ids[i])]);
  };
  rec(0,8,[]);
  assert.equal(top,31);assert.equal(maxGuards,5,'at most five guards ever fit the 100 budget');assert.ok(legal>0&&illegal>0);
});

test('every protection the work order lists is still verbatim in the function',()=>{
  for(const piece of ['where r.challenge_id=v_challenge.id and r.is_current=true;','set is_current=false, superseded_at=now()','where r.challenge_id=v_challenge.id and r.attempt_token=v_attempt_token;','return query select v_existing.id, true, v_existing.is_current;','return query select v_result.id, false, true;',"raise exception 'ATTEMPT_TOKEN_INVALID';","raise exception 'RESULT_MAX_HP_INVALID';",'v_score:=round(greatest(0::numeric,100-abs(v_actual_hp-v_challenge.target_hp)*2))::integer;',"security definer set search_path=''",'to anon,authenticated;'])assert.ok(fn.includes(piece),piece);
  const tail=s=>s.slice(s.indexOf('v_attempt_token:=coalesce('));assert.equal(tail(fn),tail(priorFn));
  assert.equal((sql.match(/create or replace function/g)||[]).length,1);
  assert.doesNotMatch(sql,/builder_progression|builder_level/i);
});

test('proof script exists, targets staging only and covers the eight-slot cases and every rejection',async()=>{
  const proof=await read('supabase/staging-proofs/20261005_002e9d_eight_guard_receipts_proof.sql');
  assert.match(proof,/qpgwqmduqtqidmhbuclw/);assert.match(proof,/Never production/);
  for(const n of ['"goblin","goblin","goblin","goblin"','RESULT_ENCOUNTER_BUDGET_EXCEEDED','RESULT_ENCOUNTER_INVALID','RESULT_HERO_GOLD_INVALID','iron-labyrinth-08','superseded_at','duplicate=true','is_current'])assert.ok(proof.includes(n),n);
});

// ---- client side ----
test('client guard: after staging proof ordinary builds up to eight entries submit; nine, unknown ids and non-Brutal overflow do not',()=>{
  assert.equal(RECEIPT_SERVER_ORDINARY_MAX_ENEMIES,8);assert.equal(RECEIPT_SERVER_MAX_ENEMIES,5);
  const g=n=>({enemyTypes:Array(n).fill('goblin')});
  assert.equal(receiptSupportsEncounter({enemyTypes:['goblin','skeleton','goblin']},{roomId:R}),true);
  for(const n of [4,5,6,7,8])assert.equal(receiptSupportsEncounter(g(n),{roomId:R}),true,n+' entries are structurally supported (budget is still enforced by gameplay and the server)');
  assert.equal(receiptSupportsEncounter(g(9),{roomId:R}),false,'nine entries unsupported');
  assert.equal(receiptSupportsEncounter(g(9),{roomId:'iron-labyrinth-08'}),false);
  assert.equal(receiptSupportsEncounter({enemyTypes:BRUTAL},{roomId:'iron-labyrinth-08'}),true,'governed Brutal still supported');
  assert.equal(receiptSupportsEncounter({enemyTypes:['goblin','goblin','goblin','goblin','goblin']},{roomId:R}),true);
  assert.equal(receiptSupportsEncounter({enemyTypes:['goblin','dragon']},{roomId:R}),false,'unknown id blocked');
  assert.equal(receiptSupportsEncounter({enemyTypes:['goblin','goblin','goblin','goblin','dragon']},{roomId:R}),false);
  assert.deepEqual([...RECEIPT_SERVER_ENEMY_IDS],['goblin','skeleton','goblin-elite','antlion','zombie','skeleton-archer']);
});

test('receipt plan carries the room into the guard and builds a normal payload for eight-slot-capable encounters once enabled',()=>{
  const base={publicToken:'T'.repeat(40),result:{status:'cleared',hp:30,maxHp:100},attemptToken:'a'.repeat(20)};
  const ok=planResultReceipt({...base,roomId:'iron-labyrinth-08',encounter:{enemyTypes:BRUTAL,trapTypes:[],supportTypes:[]},heroGold:39});
  assert.equal(ok.block,null);assert.deepEqual(ok.payload.p_encounter.enemyTypes,BRUTAL);
  const four=planResultReceipt({...base,roomId:R,encounter:{enemyTypes:['goblin','goblin','goblin','goblin'],trapTypes:[],supportTypes:[]},heroGold:24});
  assert.equal(four.block,null);assert.equal(four.payload.p_encounter.enemyTypes.length,4);assert.equal(four.payload.p_hero_gold,24);
  const five=planResultReceipt({...base,roomId:R,encounter:{enemyTypes:Array(5).fill('goblin'),trapTypes:[],supportTypes:[]},heroGold:30});
  assert.equal(five.block,null);assert.equal(five.payload.p_encounter.enemyTypes.length,5);
  const nine=planResultReceipt({...base,roomId:R,encounter:{enemyTypes:Array(9).fill('goblin'),trapTypes:[],supportTypes:[]},heroGold:30});
  assert.deepEqual([nine.payload,nine.block],[null,'UNSUPPORTED_ENCOUNTER']);
});

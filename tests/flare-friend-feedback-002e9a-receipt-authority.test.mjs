import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LEVEL2_MONSTER_MODEL,RECEIPT_SERVER_ENEMY_IDS} from '../public/flare-s8a/level2-content.mjs';

// Static contract tests for the 002E9A migration. There is no local Postgres in this environment, so these tests
// (a) prove the new function body is the applied 002B1 body plus EXACTLY four edits — which is what guarantees
// replay supersession, attempt_token, idempotency and the one-current-result behaviour are untouched — and
// (b) evaluate the migration's own governed tables (parsed out of the SQL text) over every legal encounter.
// Live behaviour is proven separately against S8B staging (supabase/staging-proofs/20261003_002e9a_level2_receipts_proof.sql).
const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const NEW='supabase/migrations/20261003_friend_challenge_feedback_002e9a_level2_receipts.sql';
const PRIOR='supabase/migrations/20261001_friend_challenge_feedback_002b1.sql';
const norm=s=>s.replace(/\r\n/g,'\n');
const fnOf=sql=>{const a=sql.indexOf('create or replace function public.submit_builder_challenge_result_v2(');const b=sql.indexOf('grant execute on function public.submit_builder_challenge_result_v2');return sql.slice(a,sql.indexOf('\n',b)+1)};

let sql,prior,fn,priorFn;
test.before(async()=>{sql=norm(await read(NEW));prior=norm(await read(PRIOR));fn=fnOf(sql);priorFn=fnOf(prior)});

// --- parse the governed tables out of the migration itself ---
const parse=()=>{
  const list=/x not in \(([^)]*)\)\) then\s*\n\s*raise exception 'RESULT_ENCOUNTER_INVALID'/.exec(fn)[1].split(',').map(s=>s.trim().replace(/'/g,''));
  const sumBlock=/select coalesce\(sum\(case x([\s\S]*?)into v_budget,v_hero_gold_max/.exec(fn)[1];
  const [costPart,goldPart]=sumBlock.split(/coalesce\(sum\(case x/);
  const pairs=text=>Object.fromEntries([...text.matchAll(/when '([a-z-]+)' then (\d+)/g)].map(m=>[m[1],Number(m[2])]));
  const ceiling=Number(/p_hero_gold>v_hero_gold_max or p_hero_gold>(\d+)/.exec(fn)[1]);
  return{allowed:list.filter(x=>x!=='none'),cost:pairs(costPart),gold:pairs(goldPart),ceiling};
};
// Reference evaluation of the function's validation order for the parts this work order changes.
function receipt({enemyTypes,heroGold}){
  const t=parse(),slots=[0,1,2].map(i=>enemyTypes[i]??'none');
  if(slots.some(x=>x!=='none'&&!t.allowed.includes(x)))return{ok:false,error:'RESULT_ENCOUNTER_INVALID'};
  const budget=slots.reduce((n,x)=>n+(t.cost[x]||0),0),max=slots.reduce((n,x)=>n+(t.gold[x]||0),0);
  if(budget>100)return{ok:false,error:'RESULT_ENCOUNTER_BUDGET_EXCEEDED'};
  if(heroGold>max||heroGold>t.ceiling)return{ok:false,error:'RESULT_HERO_GOLD_INVALID'};
  return{ok:true,budget,max};
}

test('the migration is a new additive file: the applied 002B/002B1/002B2 files are not edited',()=>{
  assert.match(sql,/create or replace function public\.submit_builder_challenge_result_v2\(/);
  assert.doesNotMatch(sql,/drop table|drop column|drop function|create table/i);
  assert.match(prior,/p_hero_gold>v_hero_gold_max or p_hero_gold>30/);
  assert.match(prior,/x not in \('none','goblin','skeleton','goblin-elite','antlion'\)/);
});

test('the new function body is the applied 002B1 body plus EXACTLY the four governed edits (replay, attempt_token, idempotency, is_current, superseded_at, score and Builder Gold derivation untouched)',()=>{
  const reverted=fn
    .replace("'goblin-elite','antlion','zombie','skeleton-archer')","'goblin-elite','antlion')")
    .replace(" when 'zombie' then 35 when 'skeleton-archer' then 35 else 0 end),0),"," else 0 end),0),")
    .replace(" when 'zombie' then 11 when 'skeleton-archer' then 11 else 0 end),0)"," else 0 end),0)")
    .replace('p_hero_gold>31','p_hero_gold>30');
  assert.equal(reverted,priorFn);
  assert.notEqual(fn,priorFn);
});

test('every protection the work order lists is still present verbatim in the function',()=>{
  for(const piece of [
    'where r.challenge_id=v_challenge.id and r.is_current=true;',
    'set is_current=false, superseded_at=now()',
    'where r.challenge_id=v_challenge.id and r.attempt_token=v_attempt_token;',
    'return query select v_existing.id, true, v_existing.is_current;',
    'return query select v_result.id, false, true;',
    "raise exception 'ATTEMPT_TOKEN_INVALID';",
    "raise exception 'RESULT_ENCOUNTER_BUDGET_EXCEEDED'",
    "raise exception 'RESULT_MAX_HP_INVALID';",
    'v_score:=round(greatest(0::numeric,100-abs(v_actual_hp-v_challenge.target_hp)*2))::integer;',
    'when v_score>=75 then 20',"security definer set search_path=''",
    'revoke all on function public.submit_builder_challenge_result_v2(text,text,jsonb,text,text,integer,integer,integer,text) from public;',
    'to anon,authenticated;'
  ])assert.ok(fn.includes(piece),piece);
});

test('accepted enemy set is explicit and governed: exactly the four existing ids plus zombie and skeleton-archer',()=>{
  assert.deepEqual(parse().allowed,['goblin','skeleton','goblin-elite','antlion','zombie','skeleton-archer']);
});

test('the migration cost and Hero Gold maps equal the locked content authority',()=>{
  const t=parse();
  assert.deepEqual(t.cost,{goblin:20,skeleton:30,'goblin-elite':40,antlion:50,zombie:35,'skeleton-archer':35});
  assert.deepEqual(t.gold,{goblin:6,skeleton:9,'goblin-elite':12,antlion:15,zombie:11,'skeleton-archer':11});
  for(const id of ['zombie','skeleton-archer']){assert.equal(t.cost[id],LEVEL2_MONSTER_MODEL[id].cost);assert.equal(t.gold[id],LEVEL2_MONSTER_MODEL[id].gold)}
});

test('Hero Gold ceiling is 31 in both the function and the table CHECK, no wider',()=>{
  assert.equal(parse().ceiling,31);
  assert.match(sql,/check \(hero_gold between 0 and 31\)/);
  assert.doesNotMatch(sql,/hero_gold between 0 and (3[2-9]|[4-9]\d|\d{3})/);
});

test('the table CHECK is found by catalog introspection (002B2 lesson), re-created under an explicit name, and asserted',()=>{
  assert.ok(sql.includes("pg_get_constraintdef(con.oid) ~ '^CHECK \\(+hero_gold'"));
  assert.match(sql,/con\.contype = 'c'/);
  assert.match(sql,/add constraint builder_challenge_result_hero_gold_range/);
  assert.match(sql,/FRIEND_FEEDBACK_002E9A_ASSERTION_FAILED/);
  assert.doesNotMatch(sql,/drop constraint (if exists )?builder_challenge_result_hero_gold_check/,'never a guessed name');
});

test('1-4: existing monsters still receipt',()=>{
  assert.equal(receipt({enemyTypes:['goblin'],heroGold:6}).ok,true);
  assert.equal(receipt({enemyTypes:['skeleton'],heroGold:9}).ok,true);
  assert.equal(receipt({enemyTypes:['goblin-elite'],heroGold:12}).ok,true);
  assert.equal(receipt({enemyTypes:['antlion'],heroGold:15}).ok,true);
  assert.equal(receipt({enemyTypes:['goblin','skeleton','none'],heroGold:15}).ok,true);
});

test('5-7: Zombie, Skeleton Archer and mixed Level 1/Level 2 receipts succeed',()=>{
  assert.deepEqual(receipt({enemyTypes:['zombie'],heroGold:11}),{ok:true,budget:35,max:11});
  assert.deepEqual(receipt({enemyTypes:['skeleton-archer'],heroGold:11}),{ok:true,budget:35,max:11});
  assert.deepEqual(receipt({enemyTypes:['zombie','skeleton-archer','goblin'],heroGold:28}),{ok:true,budget:90,max:28});
  assert.equal(receipt({enemyTypes:['goblin','skeleton','zombie'],heroGold:26}).ok,true);
});

test('8-9: Zombie + Zombie + Skeleton is legal at budget 100 and accepts 31 Hero Gold',()=>{
  assert.deepEqual(receipt({enemyTypes:['zombie','zombie','skeleton'],heroGold:31}),{ok:true,budget:100,max:31});
});

test('10: Hero Gold 32+ is rejected — the ceiling and the per-encounter derived maximum both still bind',()=>{
  assert.equal(receipt({enemyTypes:['zombie','zombie','skeleton'],heroGold:32}).error,'RESULT_HERO_GOLD_INVALID');
  assert.equal(receipt({enemyTypes:['zombie','zombie','skeleton'],heroGold:99}).error,'RESULT_HERO_GOLD_INVALID');
  // the client cannot inflate Gold just because the ceiling moved: it is still bounded by its own encounter
  assert.equal(receipt({enemyTypes:['goblin','none','none'],heroGold:31}).error,'RESULT_HERO_GOLD_INVALID');
  assert.equal(receipt({enemyTypes:['zombie','none','none'],heroGold:12}).error,'RESULT_HERO_GOLD_INVALID');
});

test('11-12: unknown ids and unsupported strings are still rejected (no arbitrary strings)',()=>{
  for(const bad of ['dragon','Zombie','zombie ','skeleton_archer','ZOMBIE','','null','goblin;drop','zombie-archer'])assert.equal(receipt({enemyTypes:[bad],heroGold:0}).error,'RESULT_ENCOUNTER_INVALID',JSON.stringify(bad));
});

test('over-budget Level 2 encounters are still rejected before Gold is considered',()=>{
  assert.equal(receipt({enemyTypes:['zombie','zombie','zombie'],heroGold:33}).error,'RESULT_ENCOUNTER_BUDGET_EXCEEDED');
  assert.equal(receipt({enemyTypes:['antlion','antlion','zombie'],heroGold:0}).error,'RESULT_ENCOUNTER_BUDGET_EXCEEDED');
});

test('exhaustive: over every 3-slot encounter within budget, max derivable Hero Gold is exactly 31 and the ceiling is not wider',()=>{
  const t=parse(),ids=['none',...t.allowed];let top=0;
  for(const a of ids)for(const b of ids)for(const c of ids){
    const cost=[a,b,c].reduce((n,x)=>n+(t.cost[x]||0),0),gold=[a,b,c].reduce((n,x)=>n+(t.gold[x]||0),0);
    if(cost>100)continue;
    assert.equal(receipt({enemyTypes:[a,b,c],heroGold:gold}).ok,true,`${a},${b},${c}`);
    assert.equal(receipt({enemyTypes:[a,b,c],heroGold:gold+1}).ok,false);
    if(gold>top)top=gold;
  }
  assert.equal(top,31);
  assert.equal(top,t.ceiling);
});

test('13-16: replay supersession, attempt_token idempotency, retry and legacy paths are byte-identical to the applied 002B1 logic',()=>{
  const tail=s=>s.slice(s.indexOf('v_attempt_token:=coalesce('));
  assert.equal(tail(fn),tail(priorFn));
  assert.match(fn,/if found then\s*\n\s*return query select v_existing\.id, true, v_existing\.is_current;\s*\n\s*return;/);
  assert.match(fn,/p_attempt_token text default null/);
});

test('legacy v1 wrapper is not redefined and no other function is touched',()=>{
  assert.equal((sql.match(/create or replace function/g)||[]).length,1);
  assert.doesNotMatch(sql,/function public\.submit_builder_challenge_result\(/);
});

test('no new Builder progression tables or durable-level persistence are introduced',()=>{
  assert.doesNotMatch(sql,/builder_progression|builder_level|create table/i);
});

test('client list is widened only AFTER staging proves the server (Stage B); until then the 002E9 guard stands',()=>{
  assert.deepEqual([...RECEIPT_SERVER_ENEMY_IDS].sort(),['antlion','goblin','goblin-elite','skeleton']);
});

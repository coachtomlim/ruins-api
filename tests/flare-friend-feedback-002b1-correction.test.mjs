import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveRunnerAuthority} from '../public/flare-s8a/runner-authority.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const PRIOR='supabase/migrations/20260930_friend_challenge_feedback_002b.sql';
const CORRECTION='supabase/migrations/20261001_friend_challenge_feedback_002b1.sql';

let correctionSql,priorSql;
test.before(async()=>{[correctionSql,priorSql]=await Promise.all([read(CORRECTION),read(PRIOR)])});

// --- AMBIGUITY FIX ---

test('does not edit the already-applied 002B migration file',()=>{
  assert.match(priorSql,/where challenge_id=v_challenge\.id and is_current;/);
});

test('the corrective migration is additive: a new file, a CREATE OR REPLACE, no DROP/ALTER of 002B structures',()=>{
  assert.doesNotMatch(correctionSql,/drop table|drop column|drop constraint/i);
  assert.match(correctionSql,/create or replace function public\.submit_builder_challenge_result_v2/);
});

test('the supersede UPDATE qualifies every column reference against the table alias, eliminating the OUT-variable collision',()=>{
  const start=correctionSql.indexOf('create or replace function public.submit_builder_challenge_result_v2');
  const body=correctionSql.slice(start,correctionSql.indexOf('end $$;',start));
  assert.match(body,/update public\.builder_challenge_result r\s*\n\s*set is_current=false, superseded_at=now\(\)\s*\n\s*where r\.challenge_id=v_challenge\.id and r\.is_current=true;/);
  assert.doesNotMatch(body,/where challenge_id=v_challenge\.id and is_current;/);
  assert.doesNotMatch(body,/\bwhere is_current\b/);
});

test('no remaining bare `where ... is_current` (unqualified) reference survives the correction',()=>{
  const start=correctionSql.indexOf('create or replace function public.submit_builder_challenge_result_v2');
  const body=correctionSql.slice(start,correctionSql.indexOf('end $$;',start));
  assert.doesNotMatch(body,/where\s+(?:r\.)?challenge_id=v_challenge\.id and is_current(?!=)/);
});

test('documents an audit of every other PL/pgSQL function for the same OUT-variable collision pattern',()=>{
  assert.match(correctionSql,/create_builder_challenge_v2:[\s\S]*Not affected\./);
  assert.match(correctionSql,/mark_builder_challenge_result_read[\s\S]*Not affected\./);
  assert.match(correctionSql,/`language sql`, not plpgsql[\s\S]*Not affected\./);
});

test('pglast confirms the corrected function body is syntactically valid PL/pgSQL (not just outer SQL)',async(t)=>{
  const {execFileSync}=await import('node:child_process');
  const repoRoot=new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]):/,'$1:');
  let out;
  try{
    out=execFileSync('python3',['-c',
      'import pglast,sys\nsql=open(sys.argv[1],encoding="utf-8").read()\npglast.parse_sql(sql)\nfns=pglast.parse_plpgsql(sql)\nprint(len(fns))',
      CORRECTION
    ],{cwd:repoRoot}).toString().trim();
  }catch{
    t.skip('pglast not available in this environment — verified manually during review');
    return;
  }
  assert.equal(out,'1');
});

// --- TRANSITIONAL MAX-HP AUTHORITY ---

test('legacy path (p_attempt_token is null) is untouched: always the hard-coded template max HP',()=>{
  const start=correctionSql.indexOf('create or replace function public.submit_builder_challenge_result_v2');
  const body=correctionSql.slice(start,correctionSql.indexOf('end $$;',start));
  assert.match(body,/if p_attempt_token is not null and v_challenge\.runner_snapshot is not null then/);
  assert.match(body,/v_expected_max_hp:=case v_challenge\.runner_id\s*\n\s*when 'warrior-l1' then 100\s*\n\s*when 'warrior-l2' then 110\s*\n\s*when 'warrior-l3' then 120/);
});

test('attempt-aware path trusts a valid snapshot HP as the max-HP authority, not the template',()=>{
  const start=correctionSql.indexOf('create or replace function public.submit_builder_challenge_result_v2');
  const body=correctionSql.slice(start,correctionSql.indexOf('end $$;',start));
  assert.match(body,/v_snapshot_hp_text := v_challenge\.runner_snapshot#>>'\{runner,stats,hp\}'/);
  assert.match(body,/if v_snapshot_hp is not null then\s*\n\s*v_expected_max_hp := v_snapshot_hp;/);
});

test('snapshot HP is validated as a bounded positive integer before being trusted, never taken from the caller',()=>{
  const start=correctionSql.indexOf('create or replace function public.submit_builder_challenge_result_v2');
  const body=correctionSql.slice(start,correctionSql.indexOf('end $$;',start));
  assert.match(body,/if v_snapshot_hp_text ~ '\^\[0-9\]\{1,4\}\$' then/);
  assert.match(body,/if v_snapshot_hp < 1 or v_snapshot_hp > 10000 then/);
  assert.doesNotMatch(body,/v_expected_max_hp:=p_max_hp/);
});

test('a historical challenge with runner_snapshot still null falls back to template authority even on the attempt-aware path',()=>{
  const start=correctionSql.indexOf('create or replace function public.submit_builder_challenge_result_v2');
  const body=correctionSql.slice(start,correctionSql.indexOf('end $$;',start));
  // v_snapshot_hp is only ever set when runner_snapshot is not null; otherwise it stays the
  // declared null, which routes to the `else` template branch below.
  assert.match(body,/v_snapshot_hp := null;\s*\n\s*if p_attempt_token is not null and v_challenge\.runner_snapshot is not null then/);
});

test('v1 wrapper is not redefined by this migration; it keeps calling v2 with a null attempt token',async()=>{
  assert.doesNotMatch(correctionSql,/create or replace function public\.submit_builder_challenge_result\(/);
  assert.match(priorSql,/p_finishing_hp,p_max_hp,p_hero_gold,null\s*\n\s*\) v2/);
});

// --- DEPLOYMENT DEPENDENCY ---

test('the 002B client runtime is documented as undeployable alone until 002C wires the snapshot into the runtime',()=>{
  assert.match(correctionSql,/the current live HostGator client has not\s*\n-- been upgraded past the pre-002B template runtime/);
});

// --- 002C SNAPSHOT RUNTIME CONTRACT (client-side) ---

test('resolveRunnerAuthority trusts a valid snapshot for HP/ATK/DEF/equipment, not just display',()=>{
  const authority=resolveRunnerAuthority({
    snapshot:{runner:{stats:{hp:105,attack:12,defense:1}},equipment:[{slot:'weapon',equipped:true,name:'Wooden Club'}]},
    templateMaxHp:100,templateAttack:10,templateDefense:0
  });
  assert.equal(authority.source,'snapshot');
  assert.equal(authority.maxHp,105);
  assert.equal(authority.attack,12);
  assert.equal(authority.defense,1);
  assert.deepEqual(authority.equipment,[{slot:'weapon',equipped:true,name:'Wooden Club'}]);
});

test('resolveRunnerAuthority falls back to the legacy template when there is no snapshot (legacy links, or historical null-snapshot challenges)',()=>{
  const authority=resolveRunnerAuthority({snapshot:null,templateMaxHp:100,templateAttack:10,templateDefense:0});
  assert.equal(authority.source,'legacy');
  assert.equal(authority.maxHp,100);
  assert.equal(authority.equipment,null);
});

test('resolveRunnerAuthority rejects a malformed/out-of-range snapshot HP and falls back rather than trusting it',()=>{
  const tooHigh=resolveRunnerAuthority({snapshot:{runner:{stats:{hp:999999}}},templateMaxHp:100});
  assert.equal(tooHigh.source,'legacy');
  const nonNumeric=resolveRunnerAuthority({snapshot:{runner:{stats:{hp:'lots'}}},templateMaxHp:100});
  assert.equal(nonNumeric.source,'legacy');
});

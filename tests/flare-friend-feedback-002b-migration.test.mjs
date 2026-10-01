import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const repoRoot=new URL('..',import.meta.url);
const read=p=>readFile(new URL(p,repoRoot),'utf8');
const MIGRATION='supabase/migrations/20260930_friend_challenge_feedback_002b.sql';
const PRIOR_MIGRATION='supabase/migrations/20260928_friend_challenge_feedback_nav.sql';

let sql;
test.before(async()=>{sql=await read(MIGRATION)});

// --- REPLAY ---

test('attempt_token, is_current and superseded_at are additive columns, never a destructive rewrite',()=>{
  assert.match(sql,/alter table public\.builder_challenge_result add column if not exists attempt_token text/);
  assert.match(sql,/alter table public\.builder_challenge_result add column if not exists is_current boolean not null default true/);
  assert.match(sql,/alter table public\.builder_challenge_result add column if not exists superseded_at timestamptz/);
  assert.doesNotMatch(sql,/drop table/i);
  assert.doesNotMatch(sql,/delete from public\.builder_challenge_result/i);
});

test('exactly one current result per challenge is a database invariant, not just application logic',()=>{
  assert.match(sql,/create unique index builder_challenge_result_one_current_uidx\s*\n\s*on public\.builder_challenge_result\(challenge_id\)\s*\n\s*where is_current/);
});

test('the old hash-only uniqueness is replaced by (challenge_id, attempt_token), so a deliberate replay of an identical build is allowed',()=>{
  assert.match(sql,/drop constraint if exists builder_challenge_result_challenge_id_deterministic_input_hash_key/);
  assert.match(sql,/add constraint builder_challenge_result_challenge_id_attempt_token_key\s*\n\s*unique \(challenge_id, attempt_token\)/);
});

test('backfill assigns a deterministic current row per challenge: latest completed_at, then highest id',()=>{
  assert.match(sql,/row_number\(\) over \(partition by challenge_id order by completed_at desc, id desc\)/);
  assert.match(sql,/is_current = \(ranked\.rn = 1\)/);
});

test('submit_builder_challenge_result_v2 locks the challenge row before reading or writing results, serializing concurrent submissions for the same challenge',()=>{
  const start=sql.indexOf('function public.submit_builder_challenge_result_v2');
  const body=sql.slice(start,sql.indexOf('$$;',start));
  assert.match(body,/where c\.public_token=p_public_token\s*\n\s*for update/);
});

test('same attempt_token retried returns the existing row unchanged (network retry stays idempotent)',()=>{
  const start=sql.indexOf('function public.submit_builder_challenge_result_v2');
  const body=sql.slice(start,sql.indexOf('$$;',start));
  assert.match(body,/where r\.challenge_id=v_challenge\.id and r\.attempt_token=v_attempt_token/);
  assert.match(body,/if found then\s*\n\s*return query select v_existing\.id, true, v_existing\.is_current;/);
});

test('a new attempt_token supersedes the prior current row before inserting the new current row, in that order',()=>{
  const start=sql.indexOf('function public.submit_builder_challenge_result_v2');
  const body=sql.slice(start,sql.indexOf('$$;',start));
  const updateIdx=body.indexOf('set is_current=false, superseded_at=now()');
  const insertIdx=body.indexOf('insert into public.builder_challenge_result(');
  assert.ok(updateIdx!==-1&&insertIdx!==-1);
  assert.ok(updateIdx<insertIdx,'must supersede the old current row before inserting the new one');
  assert.match(body,/values\(\s*\n\s*v_challenge\.id,p_room_id,v_normalized_encounter,p_rules_version,p_terminal_status,\s*\n\s*p_finishing_hp,p_max_hp,v_challenge\.target_hp,v_score,p_hero_gold,v_builder_gold,v_input_hash,\s*\n\s*v_attempt_token,true\s*\n\s*\)/);
});

test('v1 submit_builder_challenge_result is a compatibility wrapper that falls back to the deterministic hash as attempt_token, preserving legacy idempotency',()=>{
  const start=sql.indexOf('create or replace function public.submit_builder_challenge_result(');
  const body=sql.slice(start,sql.indexOf('$$;',start));
  assert.match(body,/select v2\.result_id, v2\.duplicate/);
  assert.match(body,/p_finishing_hp,p_max_hp,p_hero_gold,null/);
  assert.match(sql,/v_attempt_token:=coalesce\(nullif\(trim\(p_attempt_token\),''\),v_input_hash\)/);
});

// --- CHALLENGE ACTIVITY ---

test('get_builder_challenge_results_v2 returns only current results by default',()=>{
  const start=sql.indexOf('function public.get_builder_challenge_results_v2');
  const body=sql.slice(start,sql.indexOf('$$;',start));
  assert.match(body,/where c\.owner_player_id=auth\.uid\(\) and r\.is_current/);
});

test('history is a separate, explicitly distinct capability from normal Challenge Activity',()=>{
  assert.match(sql,/function public\.get_builder_challenge_result_history\(p_challenge_id uuid,p_limit integer default 20\)/);
  const start=sql.indexOf('function public.get_builder_challenge_result_history');
  const body=sql.slice(start,sql.indexOf('$$;',start));
  assert.match(body,/r\.is_current,r\.superseded_at/);
});

// --- AUTHORITY / ECONOMY BOUNDARY (unchanged from 001) ---

test('score, Builder Gold, max HP and encounter authority are still fully server-derived in v2',()=>{
  const start=sql.indexOf('function public.submit_builder_challenge_result_v2');
  const body=sql.slice(start,sql.indexOf('$$;',start));
  assert.doesNotMatch(body,/p_score|p_builder_gold|p_deterministic_input_hash/);
  assert.match(body,/v_score:=round\(greatest\(0::numeric,100-abs\(v_actual_hp-v_challenge\.target_hp\)\*2\)\)::integer/);
  assert.match(body,/v_builder_gold:=case/);
  assert.match(body,/v_expected_max_hp:=case v_challenge\.runner_id/);
});

test('002B introduces no wallet, Runner XP, stat or equipment mutation',()=>{
  assert.doesNotMatch(sql,/wallet_ledger/i);
  assert.doesNotMatch(sql,/runner_xp_event/i);
  assert.doesNotMatch(sql,/runner_loadout/i);
  assert.doesNotMatch(sql,/update public\.player_runner/i);
});

// --- RUNNER SNAPSHOT ---

test('runner_snapshot is a validated JSONB column, additive to builder_challenge',()=>{
  assert.match(sql,/alter table public\.builder_challenge add column if not exists runner_snapshot jsonb/);
  assert.match(sql,/check \(runner_snapshot is null or jsonb_typeof\(runner_snapshot\)='object'\)/);
});

test('snapshot capture only fires for a genuinely new challenge and only once, so later account changes cannot alter it',()=>{
  const start=sql.indexOf('create or replace function public.create_builder_challenge_v2');
  const body=sql.slice(start,sql.lastIndexOf('$$ end;')===-1?sql.indexOf('end $$;',start)+7:sql.indexOf('end $$;',start)+7);
  assert.match(body,/if not v_old\.duplicate and v_snapshot is null then/);
});

test('snapshot strips account-private ownership identifiers but keeps the public catalog item identity',()=>{
  const start=sql.indexOf('create or replace function public.create_builder_challenge_v2');
  const body=sql.slice(start,sql.indexOf('end $$;',start));
  assert.match(body,/elem - 'ownership_id'/);
  assert.doesNotMatch(body,/owner_player_id/);
  assert.doesNotMatch(body,/owner_runner_id/);
});

test('snapshot fields match what the Friend inspector needs: display name, tier, effective stats, and all seven equipment slots via the existing gear projection',()=>{
  const start=sql.indexOf('create or replace function public.create_builder_challenge_v2');
  const body=sql.slice(start,sql.indexOf('end $$;',start));
  assert.match(body,/'display_name',v_state->>'runner_name'/);
  assert.match(body,/'tier',v_old\.runner_id/);
  assert.match(body,/'stats',v_state->'effective_stats'/);
  assert.match(body,/'equipment',v_safe_gear/);
});

// --- PUBLIC SNAPSHOT RPC ---

test('get_builder_challenge_public_snapshot is keyed only by public_token and returns only safe fields',()=>{
  const start=sql.indexOf('function public.get_builder_challenge_public_snapshot');
  const body=sql.slice(start,sql.indexOf('$$;',start));
  assert.match(body,/select c\.sender_name,c\.target_hp,c\.runner_snapshot/);
  assert.doesNotMatch(body,/owner_player_id|owner_runner_id|c\.id\b|email/);
  const afterBody=sql.slice(sql.indexOf('$$;',start));
  assert.match(afterBody,/grant execute on function public\.get_builder_challenge_public_snapshot\(text\) to anon,authenticated/);
});

test('an unknown or malformed public_token returns a bounded empty result, not an error',()=>{
  const start=sql.indexOf('function public.get_builder_challenge_public_snapshot');
  const body=sql.slice(start,sql.indexOf('$$;',start));
  assert.match(body,/and p_public_token ~ '\^\[A-Za-z0-9_-\]\{32,128\}\$'/);
  assert.doesNotMatch(body,/raise exception/);
});

// --- SAFETY / GRANTS ---

test('every new SECURITY DEFINER function hardens search_path',()=>{
  const defs=sql.match(/language (?:plpgsql|sql)(?: stable)? security definer set search_path=''/g)||[];
  assert.ok(defs.length>=5);
});

test('direct anon/authenticated access to builder_challenge_result stays revoked; only RPCs touch it',()=>{
  assert.doesNotMatch(sql,/grant (?:select|insert|update|delete) on table public\.builder_challenge_result/);
});

test('does not edit the prior 001 migration file',async()=>{
  const prior=await read(PRIOR_MIGRATION);
  assert.match(prior,/create table if not exists public\.builder_challenge_result/);
  assert.doesNotMatch(prior,/attempt_token|is_current|runner_snapshot/);
});

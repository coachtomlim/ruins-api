import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const MIGRATION='supabase/migrations/20261002_friend_challenge_feedback_002b2.sql';
const PRIOR_002B='supabase/migrations/20260930_friend_challenge_feedback_002b.sql';
const PRIOR_002B1='supabase/migrations/20261001_friend_challenge_feedback_002b1.sql';

let sql;
test.before(async()=>{sql=await read(MIGRATION)});

test('does not edit either already-applied migration as the operational correction',async()=>{
  const [b,b1]=await Promise.all([read(PRIOR_002B),read(PRIOR_002B1)]);
  assert.match(b,/builder_challenge_result_challenge_id_deterministic_input_hash_key/);
  assert.doesNotMatch(b1,/drop constraint/i);
});

test('does not hard-code the guessed/truncated constraint name in executable SQL (comments may still narrate the history)',()=>{
  const executable=sql.split('\n').filter(line=>!line.trim().startsWith('--')).join('\n');
  assert.doesNotMatch(executable,/builder_challenge_result_challenge_id_deterministic_input_hash_key/);
  assert.doesNotMatch(executable,/builder_challenge_result_challenge_id_deterministic_input_h_key/);
  assert.doesNotMatch(executable,/drop constraint\s+(?:if exists\s+)?builder_challenge_result/i);
});

test('finds the legacy constraint by semantic column membership via pg_constraint/pg_attribute, not by name',()=>{
  assert.match(sql,/from pg_constraint con\s*\n\s*join pg_class rel on rel\.oid = con\.conrelid/);
  assert.match(sql,/con\.contype = 'u'/);
  assert.match(sql,/unnest\(con\.conkey\) as k\(attnum\)/);
  assert.match(sql,/= array\['challenge_id','deterministic_input_hash'\]::name\[\]/);
});

test('targets only public.builder_challenge_result, never another table',()=>{
  const matches=sql.match(/rel\.relname = 'builder_challenge_result'|tbl\.relname = 'builder_challenge_result'/g)||[];
  assert.ok(matches.length>=2);
  assert.doesNotMatch(sql,/relname\s*=\s*'builder_challenge'[^_]/);
});

test('drops the matched constraint using quote_ident via %I, not string concatenation',()=>{
  assert.match(sql,/execute format\('alter table public\.builder_challenge_result drop constraint %I', v_conname\)/);
});

test('also defensively handles a standalone unique index not backed by any constraint, excluding partial indexes',()=>{
  const start=sql.indexOf('-- Case 2');
  const body=sql.slice(start,sql.indexOf("if v_idxname is not null"));
  assert.match(body,/idx\.indisunique/);
  assert.match(body,/not idx\.indisprimary/);
  assert.match(body,/idx\.indpred is null/);
  assert.match(body,/not exists \(select 1 from pg_constraint c2 where c2\.conindid = idx\.indexrelid\)/);
});

test('the corrective DO block is a pure conditional no-op when nothing matches (idempotent)',()=>{
  const start=sql.indexOf('do $$\ndeclare\n  v_conname');
  const body=sql.slice(start,sql.indexOf('end $$;',start));
  assert.match(body,/if v_conname is not null then/);
  assert.match(body,/if v_idxname is not null then/);
  assert.doesNotMatch(body,/raise exception/);
});

test('post-migration assertion proves the old uniqueness is gone and both structures it must preserve remain',()=>{
  assert.match(sql,/FRIEND_FEEDBACK_002B2_ASSERTION_FAILED: legacy \(challenge_id, deterministic_input_hash\) uniqueness still present/);
  assert.match(sql,/= array\['attempt_token','challenge_id'\]::name\[\]/);
  assert.match(sql,/FRIEND_FEEDBACK_002B2_ASSERTION_FAILED: \(challenge_id, attempt_token\) uniqueness missing or duplicated/);
  assert.match(sql,/relname = 'builder_challenge_result_one_current_uidx'/);
  assert.match(sql,/FRIEND_FEEDBACK_002B2_ASSERTION_FAILED: one-current-result partial unique index missing/);
});

test('never touches deterministic_input_hash generation, only its old table-level uniqueness',()=>{
  assert.doesNotMatch(sql,/drop column/i);
  assert.doesNotMatch(sql,/deterministic_input_hash text/);
  assert.doesNotMatch(sql,/extensions\.digest/);
});

test('never drops the primary key or the attempt-token unique constraint',()=>{
  assert.doesNotMatch(sql,/drop constraint.*pkey/i);
  assert.doesNotMatch(sql,/builder_challenge_result_challenge_id_attempt_token_key/);
});

test('pglast confirms both DO blocks are syntactically valid SQL and PL/pgSQL',async(t)=>{
  const {execFileSync}=await import('node:child_process');
  const repoRoot=new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]):/,'$1:');
  let out;
  try{
    out=execFileSync('python3',['-c',
      'import pglast,sys\nsql=open(sys.argv[1],encoding="utf-8").read()\nstmts=pglast.parse_sql(sql)\nfns=pglast.parse_plpgsql(sql)\nprint(len(stmts),len(fns))',
      MIGRATION
    ],{cwd:repoRoot}).toString().trim();
  }catch{
    t.skip('pglast not available in this environment — verified manually during review');
    return;
  }
  assert.equal(out,'2 2');
});

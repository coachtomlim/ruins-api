import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const repoRoot=new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]):/,'$1:');
const trackedFiles=()=>execFileSync('git',['-C',repoRoot,'ls-files']).toString().split(/\r?\n/).filter(Boolean);

// Exact test-fixture role setup allowed to mention service_role. Never exempt the entire file:
// a newly added GRANT, DSN, credential, or comment with that token must fail the scanner.
const RUINS_SHIM_REL='tools/ruins-001c-offline-proof/supabase-roles-shim.sql';
const RUINS_SHIM_ALLOWED_REFERENCES=Object.freeze([
  'create role service_role nologin noinherit bypassrls;',
  'grant anon, authenticated, service_role to authenticator;',
  'grant usage on schema public to anon, authenticated, service_role;',
  'grant select on public.wallet_ledger, public.runner_xp_event, public.daily_trial_run, public.builder_challenge to anon, authenticated, service_role;'
]);
const isAllowedRuinsShimLine=line=>{
  const prefix=RUINS_SHIM_REL+':';
  if(!line.startsWith(prefix))return false;
  const tail=line.slice(prefix.length);
  const colon=tail.indexOf(':');
  if(colon<1||!/^\d+$/.test(tail.slice(0,colon)))return false;
  return RUINS_SHIM_ALLOWED_REFERENCES.includes(tail.slice(colon+1));
};


test('no __pycache__, .pyc, .env, or common scratch/proof-artifact filenames are tracked in git',()=>{
  const bad=trackedFiles().filter(f=>/__pycache__|\.pyc$|\.env($|\.)|mock-server\.mjs$|__mock-supabase\.js$|practice-mock\.html$|index-mock\.html$|\.bak$|\.tmp$/i.test(f));
  assert.deepEqual(bad,[]);
});

test('.gitignore excludes __pycache__ and local scratch-extract directories',()=>{
  const gi=readFileSync(`${repoRoot}/.gitignore`,'utf8');
  assert.match(gi,/__pycache__\//);
  assert.match(gi,/\*\.pyc/);
});

test('full-repo scan: every service_role/sb_secret_ occurrence in tracked source is a known guard pattern, doc mention, or test fixture — never real credential material',()=>{
  let hits;
  try{
    hits=execFileSync('git',['-C',repoRoot,'grep','-nE','service_role|sb_secret_','--','*.mjs','*.js','*.ts','*.py','*.sql','*.html']).toString();
  }catch(e){
    hits=e.stdout?.toString()||'';
  }
  const lines=hits.split(/\r?\n/).filter(Boolean);
  const allowed=/vendor\/supabase\.js|account-adapter\.mjs:.*startsWith\('sb_secret_'\)|friend-share\.mjs:.*\/service_role\|sb_secret_|hostgator-flare-p10-rc1\.py:.*for forbidden in|test\.mjs:|scripts\/deploy\/hostgator-flare-s8b-update-006\.py|scripts\/deploy\/hostgator-flare-s8b-update-005\.py|supabase\/drafts\/ruins_001c\/[^:]+\.sql:\d+:(revoke all on [^;]+ from [^;]*service_role[^;]*;|\s*foreach v_role in array array\[[^\]]*'service_role'[^\]]*\] loop)/;
  // RUINS 001C: the migration draft permits only deny-direction patterns; the local test-role
  // shim permits exactly four reviewed setup statements, not arbitrary mentions or credentials.
  const offenders=lines.filter(l=>!allowed.test(l)&&!isAllowedRuinsShimLine(l));
  assert.deepEqual(offenders,[],`unexpected service_role/sb_secret_ reference outside known guard/test patterns:\n${offenders.join('\n')}`);
});

test('RUINS test-shim role whitelist is statement-exact, exhaustive, and fails closed for injected lines',()=>{
  const lines=readFileSync(repoRoot+'/'+RUINS_SHIM_REL,'utf8').split(/\r?\n/);
  const observed=lines.filter(l=>/service_role|sb_secret_/.test(l));
  assert.deepEqual(observed,RUINS_SHIM_ALLOWED_REFERENCES,
    'a new or changed role reference in the local-only shim must be reviewed explicitly');
  for(const statement of RUINS_SHIM_ALLOWED_REFERENCES)
    assert.equal(isAllowedRuinsShimLine(RUINS_SHIM_REL+':24:'+statement),true,statement);
  const unexpected=[
    'grant all on table public.wallet_ledger to service_role;',
    'grant select on public.wallet_ledger to service_role;',
    'create role service_role login bypassrls;',
    'grant anon, authenticated, service_role to authenticator; grant all on schema public to service_role;',
    '-- grant anon, authenticated, service_role to authenticator;',
    'sb_secret_not_a_valid_credential_but_must_fail',
    'password = "sb_secret_injected"',
    'grant select on public.wallet_ledger, public.runner_xp_event, public.daily_trial_run, public.builder_challenge to anon, authenticated, service_role; -- altered'
  ];
  for(const line of unexpected)
    assert.equal(isAllowedRuinsShimLine(RUINS_SHIM_REL+':99:'+line),false,line);
  assert.equal(isAllowedRuinsShimLine('elsewhere.sql:24:'+RUINS_SHIM_ALLOWED_REFERENCES[0]),false);
  assert.equal(isAllowedRuinsShimLine(RUINS_SHIM_REL+':not-a-number:'+RUINS_SHIM_ALLOWED_REFERENCES[0]),false);
});

test('no real-looking token literals (cpanel auth header, x-api-key value, sk-ant- key, filled-in sb_secret_) anywhere in tracked source',()=>{
  let hits;
  try{
    hits=execFileSync('git',['-C',repoRoot,'grep','-nE',
      "cpanel [A-Za-z0-9_.-]+:[A-Za-z0-9]{15,}|x-api-key['\\\"]?\\s*[:=]\\s*['\\\"][A-Za-z0-9]{15,}|sk-ant-[A-Za-z0-9]{20,}|sb_secret_[A-Za-z0-9]{15,}"
    ]).toString();
  }catch(e){
    hits=e.stdout?.toString()||'';
  }
  assert.equal(hits.trim(),'');
});

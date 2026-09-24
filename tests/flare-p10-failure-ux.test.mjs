import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

// account-app.mjs's errorMessage() is not exported (it is wired directly into DOM event handlers), so
// this test extracts just that function's source and evaluates it in isolation to exercise its
// behavior directly, rather than only asserting a source pattern exists.
async function loadErrorMessage(){
  const src=await read('public/flare-s8b/account-app.mjs');
  const start=src.indexOf('function errorMessage(error){');
  const closeMatch=/\r?\n\}\r?\n/.exec(src.slice(start));
  const fnSrc=src.slice(start,start+closeMatch.index+closeMatch[0].length);
  const context={};
  vm.createContext(context);
  return vm.runInContext(`(function(){\n${fnSrc}\nreturn errorMessage;\n})()`,context);
}

test('errorMessage never leaks a raw Postgres/network error to the player (P10 §7 fix)',async()=>{
  const errorMessage=await loadErrorMessage();
  const rawErrors=[
    'relation "public.wallet_ledger" does not exist',
    'column "delta_gol" does not exist',
    'syntax error at or near "SELCT"',
    'duplicate key value violates unique constraint "runner_xp_event_idempotency_key_key"',
    'new row for relation "runner_loadout" violates check constraint',
    'permission denied for table runner_xp_event',
    'fetch failed',
    'NetworkError when attempting to fetch resource',
  ];
  for(const raw of rawErrors){
    const shown=errorMessage({message:raw});
    assert.notEqual(shown,raw,`leaked raw error verbatim: ${raw}`);
    assert.ok(!/relation|column|syntax error|duplicate key|violates|permission denied for|constraint|ECONNREFUSED|fetch failed|NetworkError/i.test(shown),
      `sanitized message still contains raw error vocabulary: ${raw} -> ${shown}`);
  }
});

test('errorMessage still passes through the project\'s own short UPPER_SNAKE_CASE error codes (e.g. from navigator.share failures or RPC exceptions)',async()=>{
  const errorMessage=await loadErrorMessage();
  for(const code of ['AUTH_REQUIRED','OWNERSHIP_NOT_FOUND','SLOT_MISMATCH','NOT_ALLOWED']){
    assert.equal(errorMessage({message:code}),code);
  }
});

test('errorMessage still maps every previously-recognized case to its friendly message (no regression)',async()=>{
  const errorMessage=await loadErrorMessage();
  assert.equal(errorMessage({message:'SUPABASE_URL_REQUIRED'}),'Account service configuration is required.');
  assert.equal(errorMessage({message:'Invalid login credentials'}),'Email or password is incorrect.');
  assert.equal(errorMessage({message:'Email not confirmed'}),'Confirm your email, then sign in.');
  assert.equal(errorMessage({message:'rate limit exceeded'}),'Too many attempts. Please wait and try again.');
  assert.equal(errorMessage({message:'DAILY_LOGIN_ALREADY_CLAIMED'}),'Daily Bonus is unavailable. Please try again later.');
  assert.equal(errorMessage({message:'RUNNER_NOT_OWNED'}),'Runner data is unavailable. Please try again later.');
  assert.equal(errorMessage({message:'AccountAdapterError: custom message'}),'custom message');
});

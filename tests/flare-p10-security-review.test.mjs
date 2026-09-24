import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('P10 §5 finding: ensure_starter_account and save_account_goal are hardened to search_path=\'\' (were search_path=public)',async()=>{
  const original1=await read('supabase/migrations/20260914_s8b_account_foundation_fix2.sql');
  const original2=await read('supabase/migrations/20260914_s8b_account_goal_rpc.sql');
  assert.match(original1,/set search_path = public/,'original migration must be left untouched (never edit an already-applied migration file)');
  assert.match(original2,/set search_path = public/);

  const hardening=await read('supabase/migrations/20260924_p10_security_definer_search_path_hardening.sql');
  assert.match(hardening,/create or replace function public\.ensure_starter_account\(\)/);
  assert.match(hardening,/create or replace function public\.save_account_goal\(/);
  const bodies=hardening.split(/create or replace function/);
  for(const body of bodies.slice(1)){
    assert.match(body,/security definer/);
    assert.match(body,/set search_path = ''/);
  }
});

test('every SECURITY DEFINER function across the full migration set resolves to search_path=\'\' as of the latest redefinition',async()=>{
  const files=(await readdir(new URL('../supabase/migrations',import.meta.url))).filter(f=>f.endsWith('.sql')).sort();
  const latest=new Map(); // function name -> {searchPath, file}
  for(const file of files){
    const sql=await read(`supabase/migrations/${file}`);
    const re=/create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z_."]+)\s*\([^;]*?security definer\s*\n(set search_path = ('')|([^\n]*))?/gis;
    // simpler: scan each "create ... function <name>" block up to the next 1500 chars for security definer + its search_path
    let m;
    const nameRe=/create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z_."()0-9, ]+?)\)/gi;
    while((m=nameRe.exec(sql))){
      const name=m[1].split('(')[0].trim();
      const tail=sql.slice(m.index,m.index+1500);
      if(!/security\s+definer/i.test(tail))continue;
      const spMatch=tail.match(/set\s+search_path\s*=\s*('')|set\s+search_path\s*=\s*([a-zA-Z_,\s]+)/i);
      const sp=spMatch?(spMatch[1]!==undefined?'':spMatch[2]?.trim()):undefined;
      latest.set(name,{searchPath:sp,file});
    }
  }
  const offenders=[...latest.entries()].filter(([,v])=>v.searchPath!=='');
  assert.deepEqual(offenders,[],`SECURITY DEFINER functions without search_path='' as of their latest definition: ${JSON.stringify(offenders)}`);
});

test('email redirect is validated (https-only except localhost, hash/search stripped) before being sent to Supabase signUp',async()=>{
  const adapter=await read('public/flare-s8b/account-adapter.mjs');
  assert.match(adapter,/EMAIL_REDIRECT_URL_INVALID/);
  assert.match(adapter,/EMAIL_REDIRECT_URL_MUST_USE_HTTPS/);
  assert.match(adapter,/parsed\.hash=''/);
  assert.match(adapter,/parsed\.search=''/);
});

test('login failures return Supabase\'s own generic message, never a custom "no such account" / "wrong password" distinction (account-enumeration hardening)',async()=>{
  const app=await read('public/flare-s8b/account-app.mjs');
  assert.match(app,/invalid login credentials/i);
  assert.doesNotMatch(app,/no account (found|exists)|account not found|user does not exist/i);
});

test('the browser Supabase client uses standard session persistence, never a lowered/insecure auth config',async()=>{
  const browser=await read('public/flare-s8b/supabase-browser.mjs');
  assert.match(browser,/persistSession:true,autoRefreshToken:true,detectSessionInUrl:true/);
});

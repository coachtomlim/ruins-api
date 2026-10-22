// RUINS 001C Offline Backend Proof 006 — database-free checks that run in the normal suite.
// Static migration-draft invariants + MOCK-ONLY handler tests. These make NO database-security claim;
// the real-Postgres adversarial proof is tools/ruins-001c-offline-proof (npm test there).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseGateCRoom,canonicalGateCText,DAY1_HASHES} from '../public/ruins-expedition/day1-content.mjs';
import {createRuinsExpeditionHandler,validateEnvelope,ROUTINES,CONTRACT_VERSION,MAX_BODY_BYTES} from '../supabase/functions/ruins-expedition/handler.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8').replace(/\r\n/g,'\n');
const DRAFT='supabase/drafts/ruins_001c/20261022120000_ruins_001c_private_expedition_DRAFT.sql';
const sqlWithComments=read(DRAFT);
const sql=sqlWithComments.replace(/--.*$/gm,''); // scan executable SQL only; comments name the forbidden objects on purpose
const protocol=JSON.parse(read('docs/ruins/RUINS_DAILY_EXPEDITION_001C_STAGING_PROTOCOL_V1.json'));
const entryWithComments=read('supabase/functions/ruins-expedition/index.ts');
const entry=entryWithComments.replace(/^\s*\/\/.*$/gm,'');
const handlerSrc=read('supabase/functions/ruins-expedition/handler.mjs');

test('migration is a draft outside supabase/migrations and nothing RUINS 001C is queued for apply',()=>{
  assert.ok(existsSync(resolve(root,DRAFT)));
  assert.deepEqual(readdirSync(resolve(root,'supabase/migrations')).filter(f=>/ruins|expedition/i.test(f)),[]);
  assert.match(sqlWithComments,/MIGRATION DRAFT \(SOURCE ONLY\)/);assert.match(sqlWithComments,/NOT AUTHORIZED FOR SUPABASE STAGING OR PRODUCTION/);
});
test('draft creates only ruins_private objects; never public, wallet, XP, Daily Trial, Friend or SL-SIM',()=>{
  assert.doesNotMatch(sql,/create\s+(table|function|view|sequence|policy|trigger)[^;]*\bpublic\./i);
  assert.doesNotMatch(sql,/wallet_ledger|runner_xp_event|daily_trial|builder_challenge|class_sessions|role_seats/i);
  for(const t of protocol.db.tables)assert.match(sql,new RegExp(`create table ruins_private\\.${t} \\(`));
  assert.equal((sql.match(/create table /g)||[]).length,protocol.db.tables.length);
  for(const t of protocol.db.tables)assert.match(sql,new RegExp(`alter table ruins_private\\.${t}\\s+enable row level security`));
  assert.doesNotMatch(sql,/create policy/i);
});
test('draft grants nothing to browser roles or PUBLIC, no login secret, and EXECUTE only to ruins_backend on the 3 entry routines',()=>{
  assert.doesNotMatch(sql,/grant[^;]*\bto\s+[^;]*\b(public|anon|authenticated|service_role)\b/i);
  assert.doesNotMatch(sql,/\bpassword\b|\blogin\b(?<!nologin)/i);
  assert.match(sql,/create role ruins_backend nologin/);assert.match(sql,/create role ruins_owner nologin/);
  const grants=[...sql.matchAll(/grant execute on function ruins_private\.(\w+)\([^)]*\) to ruins_backend;/g)].map(m=>m[1]).sort();
  assert.deepEqual(grants,[...protocol.db.internalRoutines].sort());
  for(const r of ['public','anon, authenticated, service_role'])assert.match(sql,new RegExp(`revoke all on schema ruins_private from ${r}`));
  assert.match(sql,/revoke all on all functions in schema ruins_private from public, anon, authenticated, service_role, ruins_backend/);
  assert.match(sql,/alter default privileges for role ruins_owner revoke execute on functions from public/);
  assert.match(sql,/RUINS_001C_VERIFY/,'fail-closed privilege self-check is part of the migration');
});
test('every routine pins search_path; SECURITY DEFINER is exactly the 3 entry routines; no dynamic SQL',()=>{
  const fns=[...sql.matchAll(/create function (ruins_private\.\w+)\(([\s\S]*?)\n\$\$;/g)];
  assert.ok(fns.length>=10);
  for(const [,name,body] of fns){assert.match(body,/set search_path = ''/,name);assert.doesNotMatch(body,/\bexecute\s+(format|')/i,name)}
  const definers=fns.filter(([,,b])=>/\nsecurity definer\n/.test(b)).map(([,n])=>n.replace('ruins_private.','')).sort();
  assert.deepEqual(definers,[...protocol.db.internalRoutines].sort());
});
test('pinned server collision layers and content hashes equal the accepted Gate C authority maps',()=>{
  for(const n of [1,2]){
    const text=read(`public/ruins-expedition/authority/gate_c_room_0${n}.txt`);
    const pinned=sql.match(new RegExp(`'collision${n}', '([01]{64})'`))[1];
    assert.equal(pinned,parseGateCRoom(canonicalGateCText(text)).collision.join(''));
    assert.match(sql,new RegExp(`gate_c_room_0${n}:${DAY1_HASHES[n]}`));
  }
  for(const s of protocol.db.stableRewardSources)assert.ok(sql.includes(`'${s}'`));
  assert.match(sql,/'ruins-expedition-001c\.v1'/);assert.equal(CONTRACT_VERSION,protocol.contractVersion);
});
test('unique keys follow the protocol exactly',()=>{
  const u=k=>protocol.db[k].join(', ');
  assert.ok(sql.includes(`unique (${u('entitlementUnique')})`));assert.ok(sql.includes(`unique (${u('instanceUnique')})`));
  assert.ok(sql.includes(`unique (${u('claimUnique').replace('reward_source_id','reward_source_id')})`));
  assert.ok(sql.includes(`unique (${u('operationUnique')})`));assert.ok(sql.includes(`unique (${u('settlementUnique').replace('day_number','day_number')})`));
});

test('Edge entry verifies with auth.getUser, uses no service-role key and embeds no secret',()=>{
  assert.match(entry,/auth\.getUser\(token\)/);
  assert.doesNotMatch(entry,/SERVICE_ROLE|service_role|sb_secret_[A-Za-z0-9]|eyJ[A-Za-z0-9_-]{10,}|postgres(ql)?:\/\/[^'"`\s]+@/);
  assert.match(entry,/RUINS_BACKEND_DB_URL/);assert.match(entryWithComments,/STATUS: CONDITIONAL/);
  assert.doesNotMatch(handlerSrc,/Deno\.|process\.env|createClient/,'handler stays runtime-neutral and secret-free');
});
test('browser build (public/) contains no backend connection strings, RUINS backend identifiers or secret keys',()=>{
  const hits=[];const walk=d=>{for(const f of readdirSync(d)){const p=join(d,f);if(statSync(p).isDirectory())walk(p);else if(/\.(m?js|html|json|css|txt)$/.test(f)){
    const t=readFileSync(p,'utf8');if(/postgres(ql)?:\/\/|ruins_backend|ruins_private|RUINS_BACKEND_DB_URL|sb_secret_[A-Za-z0-9]{16,}/.test(t))hits.push(relative(root,p))}}};
  walk(resolve(root,'public'));assert.deepEqual(hits,[]);
});

// ------------------------------- MOCK-ONLY handler tests (no DB) --------------------------------
const UUID='11111111-1111-4111-8111-111111111111';
const mk=(overrides={})=>{const calls=[];const h=createRuinsExpeditionHandler({allowedOrigins:['https://ok.test'],
  verifyUser:async t=>t==='good'?{id:UUID}:null,db:{call:async(...a)=>{calls.push(a);return overrides.result??{ok:true}}},...overrides});return {h,calls}};
const req=(method,route,{token='good',body,raw,headers={}}={})=>new Request('https://x.test/functions/v1/ruins-expedition'+route,{method,
  headers:{...(token?{authorization:'Bearer '+token}:{}),...(body!==undefined||raw!==undefined?{'content-type':'application/json'}:{}),...headers},body:raw??(body!==undefined?JSON.stringify(body):undefined)});
const cmd=(type,parameters={})=>({contractVersion:CONTRACT_VERSION,operationId:'22222222-2222-4222-8222-222222222222',expectedRevision:0,type,parameters});
const json=async r=>({status:r.status,body:await r.json()});

test('MOCK-ONLY: principal comes only from verifyUser; routine routing is fixed',async()=>{
  const {h,calls}=mk();
  await h(req('GET','/state'));await h(req('POST','/commands',{body:cmd('BOOTSTRAP')}));await h(req('POST','/commands',{body:cmd('MOVE',{direction:'up'})}));
  assert.deepEqual(calls.map(c=>[c[0],c[1]]),[[ROUTINES.state,UUID],[ROUTINES.bootstrap,UUID],[ROUTINES.command,UUID]]);
  assert.deepEqual(calls[2][2],cmd('MOVE',{direction:'up'}));
});
test('MOCK-ONLY: auth fails closed and never reaches the DB seam',async()=>{
  const {h,calls}=mk({verifyUser:async t=>{if(t==='boom')throw new Error('auth service down');return null}});
  for(const token of [null,'bad','boom']){const r=await json(await h(req('POST','/commands',{token,body:cmd('BOOTSTRAP')})));assert.deepEqual([r.status,r.body.error.code],[401,'AUTH_REQUIRED'])}
  assert.equal(calls.length,0);
});
test('MOCK-ONLY: every protocol-forbidden authority field and every blocked command is refused',async()=>{
  for(const f of protocol.api.forbiddenClientAuthorityFields)assert.throws(()=>validateEnvelope({...cmd('MOVE',{direction:'up'}),[f]:1}),e=>e.code==='BAD_COMMAND'&&e.reason==='UNKNOWN_FIELD',f);
  for(const b of protocol.api.blockedCommands)assert.throws(()=>validateEnvelope(cmd(b)),e=>['NOT_YET_UNLOCKED','BAD_COMMAND'].includes(e.code),b);
  for(const a of protocol.api.allowedCommands)assert.doesNotThrow(()=>validateEnvelope(cmd(a,a==='MOVE'?{direction:'left'}:{})),a);
  assert.deepEqual([...protocol.api.envelopeRequired].sort(),Object.keys(cmd('MOVE')).sort());
});
test('MOCK-ONLY: error codes are exactly the protocol set; DB errors are projected without leaking detail',async()=>{
  const codes=new Set();
  const secret=Object.assign(new Error('relation ruins_private.expedition_claim password=hunter2'),{code:'42P01'});
  let r=await json(await mk({db:{call:async()=>{throw secret}}}).h(req('POST','/commands',{body:cmd('BOOTSTRAP')})));
  assert.deepEqual(r,{status:503,body:{contractVersion:CONTRACT_VERSION,error:{code:'INTERNAL_RETRY_SAFE',reason:'RETRY'}}});codes.add(r.body.error.code);
  r=await json(await mk({db:{call:async()=>{throw Object.assign(new Error('RUINS:MADE_UP:X'),{code:'P0001'})}}}).h(req('POST','/commands',{body:cmd('BOOTSTRAP')})));
  assert.equal(r.body.error.code,'INTERNAL_RETRY_SAFE');
  for(const c of protocol.api.errorCodes){r=await json(await mk({db:{call:async()=>{throw Object.assign(new Error(`RUINS:${c}:X`),{code:'P0001'})}}}).h(req('POST','/commands',{body:cmd('BOOTSTRAP')})));assert.equal(r.body.error.code,c);codes.add(c)}
  assert.deepEqual([...codes].sort(),[...protocol.api.errorCodes].sort());
});
test('MOCK-ONLY: deadlock/serialization retried with the SAME operation, bounded',async()=>{
  let n=0;const seen=[];const flaky={call:async(...a)=>{seen.push(a[2]);if(++n<3)throw Object.assign(new Error('deadlock'),{code:'40P01'});return {ok:1}}};
  let r=await mk({db:flaky}).h(req('POST','/commands',{body:cmd('MOVE',{direction:'up'})}));assert.equal(r.status,200);assert.equal(seen.length,3);assert.ok(seen.every(s=>s.operationId===seen[0].operationId));
  let m=0;r=await mk({db:{call:async()=>{m++;throw Object.assign(new Error('x'),{code:'40001'})}}}).h(req('POST','/commands',{body:cmd('MOVE',{direction:'up'})}));
  assert.equal(r.status,503);assert.equal(m,4);
});
test('MOCK-ONLY: size, content-type, route and origin guards',async()=>{
  const {h,calls}=mk();
  assert.equal((await h(req('POST','/commands',{raw:JSON.stringify({...cmd('BOOTSTRAP'),pad:'x'.repeat(MAX_BODY_BYTES)})}))).status,413);
  assert.equal((await json(await h(req('POST','/commands',{raw:'{}',headers:{'content-type':'text/plain'}})))).body.error.reason,'CONTENT_TYPE');
  assert.equal((await json(await h(req('DELETE','/commands')))).body.error.reason,'ROUTE');
  assert.equal((await json(await h(req('GET','/commands')))).body.error.reason,'ROUTE');
  assert.equal((await json(await h(req('POST','/commands',{body:cmd('BOOTSTRAP'),headers:{origin:'https://evil.test'}})))).body.error.reason,'ORIGIN_NOT_ALLOWED');
  const ok=await h(req('OPTIONS','/commands',{token:null,headers:{origin:'https://ok.test'}}));assert.equal(ok.status,204);assert.equal(ok.headers.get('access-control-allow-origin'),'https://ok.test');
  assert.equal(calls.length,0);
});

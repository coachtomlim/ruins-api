// RUINS_DAILY_EXPEDITION_001C_OFFLINE_BACKEND_PROOF_006 — adversarial proof against REAL local PostgreSQL 17.6.
// Every test here executes against the disposable database (no mocks). Fake accounts only; zero real rewards.
// Set RUINS_PROOF_EVIDENCE_DIR to write machine-readable receipts.
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import pg from 'pg';
import {createProofEnv} from './proof-env.mjs';
import {HERE} from './local-pg.mjs';
import {parseGateCRoom} from '../../public/ruins-expedition/day1-content.mjs';
import {createDay1State,applyDay1Command} from '../../public/ruins-expedition/day1-state.mjs';

const maps={};for(const n of [1,2])maps[n]=parseGateCRoom(readFileSync(path.resolve(HERE,`../../public/ruins-expedition/authority/gate_c_room_0${n}.txt`),'utf8'));
let env;const evidence={startedAt:new Date().toISOString(),tests:{}};const responses=[];
const rec=(name,data)=>{evidence.tests[name]=data};
const call=async(...a)=>{const r=await env.api(...a);responses.push(r.text);return r};
const post=(token,body)=>call('POST','/commands',{token,body});
const state=async token=>(await call('GET','/state',{token})).json;
const countRows=async(table,where='true',params=[])=>Number((await env.superQuery(`select count(*)::int n from ruins_private.${table} where ${where}`,params)).rows[0].n);
const entOf=async id=>(await env.superQuery(`select id from ruins_private.expedition_entitlement where principal_id=$1`,[id])).rows[0]?.id;
const instOf=async id=>(await env.superQuery(`select i.* from ruins_private.expedition_instance i join ruins_private.expedition_entitlement e on e.id=i.entitlement_id where e.principal_id=$1`,[id])).rows[0];

// Drive one account through the accepted Day 1 path using only API intents.
async function play(token,until){
  const steps=[['DISCOVER_ALTAR'],['MOVE','right'],['MOVE','right'],['MOVE','right'],['ENTER_ROOM2'],['MOVE','right'],['MOVE','right'],
    ['ATTACK_ZOMBIE'],['ATTACK_ZOMBIE'],['ATTACK_ZOMBIE'],['MOVE','right'],['CLAIM_ROOM2_CHEST'],['SETTLE_DAY1']];
  let rev=(await state(token)).expedition.revision;const out=[];
  for(const [type,dir] of steps){if(until===type)break;const r=await post(token,env.cmd(type,rev,dir?{direction:dir}:{}));
    assert.equal(r.status,200,`${type}: ${r.text}`);rev=r.json.revision;out.push(r.json);if(until==='ALL'&&false)break}
  return out;
}
async function fresh(){const a=env.addAccount();const r=await post(a.token,env.cmd('BOOTSTRAP',0));assert.equal(r.status,200);return a}

before(async()=>{env=await createProofEnv();evidence.postgres=env.db.version;evidence.migrationSha256=env.migrationSha256;});
after(async()=>{
  evidence.completedAt=new Date().toISOString();
  if(process.env.RUINS_PROOF_EVIDENCE_DIR){mkdirSync(process.env.RUINS_PROOF_EVIDENCE_DIR,{recursive:true});
    writeFileSync(path.join(process.env.RUINS_PROOF_EVIDENCE_DIR,'db-proof-evidence.json'),JSON.stringify(evidence,null,1))}
  await env?.close();
});

test('P01 disposable PG 17.6; draft applied by a NON-superuser migrator; designed role attributes',async()=>{
  assert.equal(env.db.version.sv,'17.6');
  const roles=(await env.superQuery(`select rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls from pg_roles where rolname in ('ruins_owner','ruins_backend','migrator') order by 1`)).rows;
  const by=Object.fromEntries(roles.map(r=>[r.rolname,r]));
  assert.equal(by.migrator.rolsuper,false);
  for(const r of ['ruins_owner','ruins_backend'])for(const k of ['rolsuper','rolcreaterole','rolcreatedb','rolreplication','rolbypassrls'])assert.equal(by[r][k],false,`${r}.${k}`);
  assert.equal(by.ruins_owner.rolcanlogin,false);
  assert.equal(by.ruins_backend.rolcanlogin,true,'LOGIN granted out-of-band by the harness (operator step), not by the migration');
  assert.match(env.migrationSql,/create role ruins_backend nologin/);
  rec('P01',{postgres:env.db.version,migrationSha256:env.migrationSha256,roles});
});

test('P02 catalog: schema/table/routine ownership, RLS on, zero policies, zero sequences, unique keys, pinned search_path',async()=>{
  const q=s=>env.superQuery(s).then(r=>r.rows);
  const schema=(await q(`select nspname, pg_get_userbyid(nspowner) owner, nspacl::text acl from pg_namespace where nspname='ruins_private'`))[0];
  assert.equal(schema.owner,'ruins_owner');
  const tables=await q(`select c.relname, pg_get_userbyid(c.relowner) owner, c.relrowsecurity rls, c.relforcerowsecurity force, coalesce(c.relacl::text,'') acl from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='ruins_private' and c.relkind='r' order by 1`);
  assert.deepEqual(tables.map(t=>t.relname),['expedition_claim','expedition_day_settlement','expedition_entitlement','expedition_instance','expedition_inventory_event','expedition_operation']);
  for(const t of tables){assert.equal(t.owner,'ruins_owner');assert.equal(t.rls,true);assert.doesNotMatch(t.acl,/anon|authenticated|service_role|ruins_backend|(^|[{,])=/)}
  assert.equal((await q(`select count(*)::int n from pg_policy p join pg_class c on c.oid=p.polrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='ruins_private'`))[0].n,0);
  assert.equal((await q(`select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='ruins_private' and c.relkind='S'`))[0].n,0);
  const uniques=await q(`select conrelid::regclass::text tbl, conname, array_agg(a.attname order by k.ord)::text[] cols from pg_constraint c cross join lateral unnest(c.conkey) with ordinality k(attnum,ord) join pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.attnum where c.contype='u' and c.connamespace='ruins_private'::regnamespace group by 1,2 order by 1`);
  const u=Object.fromEntries(uniques.map(x=>[x.tbl.replace('ruins_private.',''),x.cols]));
  assert.deepEqual(u.expedition_entitlement,['principal_kind','principal_id','campaign_reward_scope']);
  assert.deepEqual(u.expedition_instance,['entitlement_id']);
  assert.deepEqual(u.expedition_claim,['entitlement_id','reward_source_id']);
  assert.deepEqual(u.expedition_operation,['entitlement_id','operation_id']);
  assert.deepEqual(u.expedition_day_settlement,['entitlement_id','day_number']);
  assert.deepEqual(u.expedition_inventory_event,['entitlement_id','operation_id','item_key']);
  const routines=await q(`select p.oid::regprocedure::text sig, pg_get_userbyid(p.proowner) owner, p.prosecdef definer, p.proconfig config, coalesce(p.proacl::text,'') acl, p.provolatile vol from pg_proc p where p.pronamespace='ruins_private'::regnamespace order by 1`);
  for(const r of routines){assert.equal(r.owner,'ruins_owner');assert.deepEqual(r.config,['search_path=""']);assert.doesNotMatch(r.acl,/(^|[{,])=X|anon|authenticated|service_role/)}
  assert.deepEqual(routines.filter(r=>r.definer).map(r=>r.sig).sort(),['ruins_private.apply_account_expedition_command(uuid,jsonb)','ruins_private.bootstrap_account_expedition(uuid,jsonb)','ruins_private.get_account_expedition(uuid)']);
  const bodies=await q(`select p.proname, p.prosrc from pg_proc p where p.pronamespace='ruins_private'::regnamespace`);
  for(const b of bodies){assert.doesNotMatch(b.prosrc,/\bexecute\s+(format|'|\$|[a-z_]+\s*(\|\||;))/i,`no dynamic SQL in ${b.proname}`);assert.doesNotMatch(b.prosrc,/\bpublic\./,`no public.* in ${b.proname}`)}
  const defaults=await q(`select pg_get_userbyid(d.defaclrole) role, case when d.defaclnamespace=0 then '(global)' else d.defaclnamespace::regnamespace::text end ns, d.defaclobjtype t, d.defaclacl::text acl from pg_default_acl d order by 1,2,3`);
  assert.ok(defaults.some(d=>d.role==='ruins_owner'&&d.ns==='(global)'&&d.t==='f'&&!/(^|[{,])=X/.test(d.acl)),'global PUBLIC EXECUTE default revoked for ruins_owner');
  // Behavioural default-privilege probe: objects the owner creates later get no PUBLIC/browser rights (rolled back).
  await env.superQuery(`do $$ begin if not exists (select 1 from pg_roles where rolname='public_probe') then create role public_probe nologin; end if; end $$`);
  const c=new pg.Client(env.db.superConfig);await c.connect();let probe;
  try{await c.query('begin');await c.query('set local role ruins_owner');
    await c.query('create table ruins_private.zz_probe(i int)');await c.query('create sequence ruins_private.zz_probe_seq');
    await c.query("create function ruins_private.zz_probe_fn() returns int language sql set search_path='' as 'select 1'");
    probe=(await c.query(`select r, has_table_privilege(r,'ruins_private.zz_probe','SELECT,INSERT,UPDATE,DELETE') t, has_sequence_privilege(r,'ruins_private.zz_probe_seq','USAGE,SELECT,UPDATE') s, has_function_privilege(r,'ruins_private.zz_probe_fn()','EXECUTE') f from unnest(array['public_probe','anon','authenticated','service_role','ruins_backend']) r`)).rows;
  }finally{await c.query('rollback');await c.end()}
  for(const p of probe)assert.deepEqual([p.t,p.s,p.f],[false,false,false],p.r);
  rec('P02',{schema,tables,uniques,routines,defaults,futureObjectProbe:probe});
});

test('P03 has_*_privilege matrix: browser roles and PUBLIC have nothing; backend has USAGE + EXECUTE on exactly 3 entry routines',async()=>{
  await env.superQuery(`do $$ begin if not exists (select 1 from pg_roles where rolname='public_probe') then create role public_probe nologin; end if; end $$`);
  const roles=['public_probe','anon','authenticated','service_role','ruins_backend'];
  const m=(await env.superQuery(`
    select r.rolname role, 'schema' kind, 'ruins_private' obj, has_schema_privilege(r.rolname,'ruins_private','USAGE') usage_or_select, has_schema_privilege(r.rolname,'ruins_private','CREATE') create_or_dml
      from unnest($1::text[]) r(rolname)
    union all
    select r.rolname, 'table', c.relname, has_table_privilege(r.rolname,c.oid,'SELECT'), has_table_privilege(r.rolname,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      from unnest($1::text[]) r(rolname) cross join pg_class c where c.relnamespace='ruins_private'::regnamespace and c.relkind='r'
    union all
    select r.rolname, 'function', p.oid::regprocedure::text, has_function_privilege(r.rolname,p.oid,'EXECUTE'), false
      from unnest($1::text[]) r(rolname) cross join pg_proc p where p.pronamespace='ruins_private'::regnamespace
    order by 1,2,3`,[roles])).rows;
  for(const row of m){
    if(row.role==='ruins_backend'){
      if(row.kind==='schema'){assert.equal(row.usage_or_select,true);assert.equal(row.create_or_dml,false)}
      if(row.kind==='table'){assert.equal(row.usage_or_select,false,row.obj);assert.equal(row.create_or_dml,false,row.obj)}
      if(row.kind==='function')assert.equal(row.usage_or_select,/(bootstrap_account_expedition|get_account_expedition|apply_account_expedition_command)\(/.test(row.obj),row.obj);
    }else{assert.equal(row.usage_or_select,false,`${row.role} ${row.obj}`);assert.equal(row.create_or_dml,false,`${row.role} ${row.obj}`)}
  }
  rec('P03',{roles,rows:m.length,backendExecutable:m.filter(r=>r.role==='ruins_backend'&&r.kind==='function'&&r.usage_or_select).map(r=>r.obj),matrix:m});
});

test('P04 dynamic negatives: PostgREST-style SET ROLE anon/authenticated/service_role cannot read, write or execute anything private',async()=>{
  const attempts=['select * from ruins_private.expedition_entitlement','select * from ruins_private.expedition_claim',
    "insert into ruins_private.expedition_claim (entitlement_id,instance_id,reward_source_id,operation_id,payload,claimed_revision) values (gen_random_uuid(),gen_random_uuid(),'ruins-gate-c-015:room02:chest:01',gen_random_uuid(),'{}',1)",
    'update ruins_private.expedition_instance set revision=99','delete from ruins_private.expedition_operation',
    `select ruins_private.get_account_expedition('${env.accounts.A}')`,
    `select ruins_private.apply_account_expedition_command('${env.accounts.A}','{}'::jsonb)`,
    `select ruins_private.bootstrap_account_expedition('${env.accounts.A}','{}'::jsonb)`,
    'select ruins_private.day1_rules()','select ruins_private.day1_reduce(\'{}\'::jsonb,\'MOVE\',\'{}\'::jsonb)'];
  const out=[];const c=new pg.Client(env.authenticatorConfig);await c.connect();
  try{for(const role of ['anon','authenticated','service_role'])for(const sql of attempts){
    await c.query(`set role ${role}`);let code='OK';try{await c.query(sql)}catch(e){code=e.code}await c.query('reset role');
    out.push({role,sql:sql.slice(0,70),code});assert.equal(code,'42501',`${role}: ${sql}`)}}
  finally{await c.end()}
  rec('P04',{attempts:out.length,allDenied42501:out.every(o=>o.code==='42501'),results:out});
});

test('P05 backend login: no direct table access, no helpers, no DDL, cannot become owner, cannot touch public sentinels',async()=>{
  const attempts={selectTable:'select * from ruins_private.expedition_instance',insertClaim:"insert into ruins_private.expedition_claim (entitlement_id,instance_id,reward_source_id,operation_id,payload,claimed_revision) values (gen_random_uuid(),gen_random_uuid(),'ruins-gate-c-015:room02:chest:01',gen_random_uuid(),'{}',1)",
    updateInstance:'update ruins_private.expedition_instance set revision=0',helperReduce:"select ruins_private.day1_reduce('{}'::jsonb,'MOVE','{}'::jsonb)",helperReject:"select ruins_private.reject('X','Y')",
    createInPrivate:'create table ruins_private.x(i int)',createInPublic:'create table public.ruins_x(i int)',setOwnerRole:'set role ruins_owner',
    alterRoutine:'alter function ruins_private.get_account_expedition(uuid) security invoker',walletRead:'select * from public.wallet_ledger',walletWrite:"insert into public.wallet_ledger(delta,note) values (30,'x')",
    xpWrite:'insert into public.runner_xp_event(xp) values (2)',dailyTrial:'select * from public.daily_trial_run',friend:'select * from public.builder_challenge'};
  const out={};const c=new pg.Client(env.backendConfig);await c.connect();
  try{for(const [k,sql] of Object.entries(attempts)){let code='OK';try{await c.query(sql)}catch(e){code=e.code}out[k]=code}}finally{await c.end()}
  for(const [k,code] of Object.entries(out))assert.equal(code,'42501',`${k}=${code}`);
  rec('P05',out);
});

test('P06 identity isolation: A and B never see or affect each other; guessed operation IDs stay scoped to the caller',async()=>{
  const r0=await post(env.tokens.A,env.cmd('BOOTSTRAP',0));assert.equal(r0.status,200);
  const aSteps=await play(env.tokens.A,'ENTER_ROOM2');const aOp=aSteps.at(-1).operationId;
  const bBefore=await state(env.tokens.B);assert.equal(bBefore.status,'NOT_BOOTSTRAPPED');assert.equal(await entOf(env.accounts.B),undefined,'GET never creates');
  const rB=await post(env.tokens.B,env.cmd('BOOTSTRAP',0));assert.equal(rB.json.publicState.revision,0);assert.deepEqual(rB.json.publicState.heroPublic,{x:2,y:4,hp:100,maxHp:100,xp:0,gold:0});
  // B reuses A's operation ID: treated as B's own brand-new operation, never A's receipt.
  const reuse=await post(env.tokens.B,env.cmd('DISCOVER_ALTAR',0,{},aOp));
  assert.equal(reuse.status,200);assert.equal(reuse.json.duplicate,false);assert.equal(reuse.json.revision,1);
  const aNow=await state(env.tokens.A);assert.equal(aNow.expedition.revision,aSteps.at(-1).revision);
  // Forged principal fields are rejected outright.
  for(const k of ['playerId','principalId'])assert.equal((await post(env.tokens.B,{...env.cmd('MOVE',1,{direction:'up'}),[k]:env.accounts.A})).json.error.reason,'UNKNOWN_FIELD');
  assert.equal(await countRows('expedition_entitlement','principal_id = any($1::uuid[])',[[env.accounts.A,env.accounts.B]]),2);
  rec('P06',{aRevision:aNow.expedition.revision,bRevision:reuse.json.revision,sharedOperationIdIndependent:true,entitlements:2});
});

test('P07 auth fails closed before any DB call: missing/malformed/basic/revoked/expired/throwing verifier',async()=>{
  const before=await countRows('expedition_operation');const body=env.cmd('BOOTSTRAP',0);const out={};
  const cases={missing:{},malformed:{headers:{authorization:'Bearer'}},basic:{headers:{authorization:'Basic YTpi'}},revoked:{token:env.tokens.revoked},expired:{token:env.tokens.expired},injection:{headers:{authorization:"Bearer x' or 1=1--"}}};
  for(const [k,o] of Object.entries(cases)){const r=await call('POST','/commands',{...o,body});out[k]=[r.status,r.json.error.code];assert.equal(r.status,401);assert.equal(r.json.error.code,'AUTH_REQUIRED')}
  const g=await call('GET','/state',{});assert.equal(g.status,401);
  assert.equal(await countRows('expedition_operation'),before);
  rec('P07',out);
});

test('P08 bootstrap concurrency: 25 parallel tabs -> exactly one entitlement and one instance',async()=>{
  const a=env.addAccount();
  const rs=await Promise.all(Array.from({length:25},()=>post(a.token,env.cmd('BOOTSTRAP',0))));
  assert.ok(rs.every(r=>r.status===200),rs.map(r=>r.text).join('\n'));
  const created=rs.filter(r=>r.json.events[0]==='expedition_bootstrapped').length;
  assert.equal(created,1);assert.equal(await countRows('expedition_entitlement','principal_id=$1',[a.id]),1);
  const ent=await entOf(a.id);assert.equal(await countRows('expedition_instance','entitlement_id=$1',[ent]),1);
  assert.equal(await countRows('expedition_operation','entitlement_id=$1',[ent]),25);
  // Same BOOTSTRAP operation ID in 10 parallel tabs -> one receipt, nine duplicates.
  const b=env.addAccount();const same=env.cmd('BOOTSTRAP',0);
  const rs2=await Promise.all(Array.from({length:10},()=>post(b.token,same)));
  assert.ok(rs2.every(r=>r.status===200));assert.equal(rs2.filter(r=>!r.json.duplicate).length,1);
  assert.equal(await countRows('expedition_operation','entitlement_id=$1',[await entOf(b.id)]),1);
  rec('P08',{parallelBootstraps:25,created,entitlements:1,instances:1,sameOpParallel:10,sameOpNonDuplicate:1});
});

test('P09 same operation + same payload: identical receipt, no revision/inventory/XP effect (sequential and 15 parallel)',async()=>{
  const a=await fresh();const c=env.cmd('DISCOVER_ALTAR',0);
  const first=await post(a.token,c),again=await post(a.token,c);
  assert.equal(first.json.duplicate,false);assert.equal(again.json.duplicate,true);
  assert.deepEqual({...again.json,duplicate:false},first.json,'duplicate returns the persisted original receipt');
  assert.equal((await instOf(a.id)).revision,'1');
  const mv=env.cmd('MOVE',1,{direction:'right'});
  const rs=await Promise.all(Array.from({length:15},()=>post(a.token,mv)));
  assert.ok(rs.every(r=>r.status===200));assert.equal(rs.filter(r=>!r.json.duplicate).length,1);assert.ok(rs.every(r=>r.json.revision===2));
  assert.equal((await instOf(a.id)).revision,'2');
  rec('P09',{sequentialDuplicateIdentical:true,parallelSameOp:15,accepted:1,finalRevision:2});
});

test('P10 same operation + changed payload (direction or expectedRevision) -> OPERATION_ID_REUSE_MISMATCH, no mutation',async()=>{
  const a=await fresh();const op=randomUUID();
  assert.equal((await post(a.token,env.cmd('MOVE',0,{direction:'up'},op))).status,200);
  const snap=await instOf(a.id);
  const r1=await post(a.token,env.cmd('MOVE',0,{direction:'down'},op));
  const r2=await post(a.token,env.cmd('MOVE',1,{direction:'up'},op));
  const r3=await post(a.token,env.cmd('DISCOVER_ALTAR',0,{},op));
  for(const r of [r1,r2,r3]){assert.equal(r.status,409);assert.equal(r.json.error.code,'OPERATION_ID_REUSE_MISMATCH')}
  assert.deepEqual(await instOf(a.id),snap);
  rec('P10',{changedDirection:r1.json.error,changedExpectedRevision:r2.json.error,changedType:r3.json.error});
});

test('P11 stale revision rejected; 12 different concurrent operations on one revision -> exactly 1 accepted',async()=>{
  const a=await fresh();
  const stale=await post(a.token,env.cmd('MOVE',5,{direction:'up'}));assert.equal(stale.json.error.code,'REVISION_CONFLICT');
  const dirs=['up','down','left','right'];
  const rs=await Promise.all(Array.from({length:12},(_,i)=>post(a.token,env.cmd('MOVE',0,{direction:dirs[i%4]}))));
  const ok=rs.filter(r=>r.status===200),conflict=rs.filter(r=>r.json?.error?.code==='REVISION_CONFLICT');
  assert.equal(ok.length,1);assert.equal(conflict.length,11);assert.equal((await instOf(a.id)).revision,'1');
  rec('P11',{concurrent:12,accepted:1,revisionConflict:11});
});

test('P12 same stable source, different operations: 16 parallel claims + later re-claim -> exactly one award',async()=>{
  const a=await fresh();await play(a.token,'CLAIM_ROOM2_CHEST');
  const rev=(await state(a.token)).expedition.revision;
  const rs=await Promise.all(Array.from({length:16},()=>post(a.token,env.cmd('CLAIM_ROOM2_CHEST',rev))));
  const ok=rs.filter(r=>r.status===200);assert.equal(ok.length,1);assert.deepEqual(ok[0].json.events,['chest_claimed']);
  const again=await post(a.token,env.cmd('CLAIM_ROOM2_CHEST',rev+1));
  assert.deepEqual(again.json.events,['already_claimed']);assert.equal(again.json.publicState.heroPublic.gold,30);
  const ent=await entOf(a.id);
  assert.equal(await countRows('expedition_claim',"entitlement_id=$1 and reward_source_id='ruins-gate-c-015:room02:chest:01'",[ent]),1);
  const sums=(await env.superQuery(`select item_key, sum(delta)::int s, count(*)::int n from ruins_private.expedition_inventory_event where entitlement_id=$1 group by 1 order by 1`,[ent])).rows;
  assert.deepEqual(sums,[{item_key:'staging_gold',s:30,n:1},{item_key:'staging_xp',s:2,n:1}]);
  // Final safeguard: even a privileged writer cannot insert a second award for the same (entitlement, source).
  let code='OK';try{await env.superQuery(`insert into ruins_private.expedition_claim (entitlement_id,instance_id,reward_source_id,operation_id,payload,claimed_revision) select entitlement_id,instance_id,reward_source_id,gen_random_uuid(),payload,99 from ruins_private.expedition_claim where entitlement_id=$1 and reward_source_id='ruins-gate-c-015:room02:chest:01'`,[ent])}catch(e){code=e.code}
  assert.equal(code,'23505');
  rec('P12',{parallelClaims:16,awarded:1,reclaimEvents:again.json.events,inventory:sums,directDuplicateInsert:code});
});

test('P13 lost response / reopen: resent operation returns the original receipt; GET reconciles; claims never reset',async()=>{
  const a=await fresh();await play(a.token,'CLAIM_ROOM2_CHEST');
  const rev=(await state(a.token)).expedition.revision;const c=env.cmd('CLAIM_ROOM2_CHEST',rev);
  await env.api('POST','/commands',{token:a.token,body:c}); // response "lost" (discarded)
  const resend=await post(a.token,c);assert.equal(resend.json.duplicate,true);assert.deepEqual(resend.json.events,['chest_claimed']);
  const s=await state(a.token);assert.deepEqual(s.expedition,resend.json.publicState);
  const reboot=await post(a.token,env.cmd('BOOTSTRAP',0));assert.deepEqual(reboot.json.events,['already_bootstrapped']);
  assert.equal(reboot.json.publicState.heroPublic.gold,30);assert.equal(reboot.json.publicState.revision,rev+1);
  rec('P13',{resendDuplicate:true,bootstrapAfterProgressDoesNotReset:true});
});

test('P14 atomic rollback: injected inventory/settlement failure leaves no claim, receipt, XP or checkpoint; same op then succeeds',async()=>{
  const fault=table=>env.superQuery(`create or replace function public.ruins_proof_fault() returns trigger language plpgsql as $$ begin raise exception 'proof fault: secret-ish detail relation ${table}'; end $$;
    create trigger ruins_proof_fault before insert on ruins_private.${table} for each row execute function public.ruins_proof_fault()`);
  const clear=table=>env.superQuery(`drop trigger ruins_proof_fault on ruins_private.${table}; drop function public.ruins_proof_fault()`);
  const out={};
  // (a) zombie defeat XP: inventory insert fails -> zombie HP, XP, claim and receipt all roll back.
  const a=await fresh();await play(a.token,'ATTACK_ZOMBIE');
  let rev=(await state(a.token)).expedition.revision;
  for(let i=0;i<2;i++){rev=(await post(a.token,env.cmd('ATTACK_ZOMBIE',rev))).json.revision}
  const pre=await instOf(a.id);const ent=await entOf(a.id);const opsBefore=await countRows('expedition_operation','entitlement_id=$1',[ent]);
  const kill=env.cmd('ATTACK_ZOMBIE',rev);
  await fault('expedition_inventory_event');let r=await post(a.token,kill);await clear('expedition_inventory_event');
  assert.equal(r.status,503);assert.deepEqual(r.json.error,{code:'INTERNAL_RETRY_SAFE',reason:'RETRY'});assert.doesNotMatch(r.text,/fault|relation|secret|ruins_private|expedition_/);
  assert.deepEqual(await instOf(a.id),pre);assert.equal(await countRows('expedition_claim','entitlement_id=$1',[ent]),0);
  assert.equal(await countRows('expedition_operation','entitlement_id=$1',[ent]),opsBefore);
  r=await post(a.token,kill);assert.equal(r.status,200);assert.deepEqual(r.json.events,['zombie_hit','zombie_die']);out.xp={rolledBack:true,retrySameOp:r.json.events};
  // (b) chest claim: inventory failure -> no chest claim, no gold.
  rev=r.json.revision;rev=(await post(a.token,env.cmd('MOVE',rev,{direction:'right'}))).json.revision;
  const pre2=await instOf(a.id);const claim=env.cmd('CLAIM_ROOM2_CHEST',rev);
  await fault('expedition_inventory_event');r=await post(a.token,claim);await clear('expedition_inventory_event');
  assert.equal(r.status,503);assert.deepEqual(await instOf(a.id),pre2);
  assert.equal(await countRows('expedition_claim',"entitlement_id=$1 and reward_source_id like '%chest%'",[ent]),0);
  r=await post(a.token,claim);assert.deepEqual(r.json.events,['chest_claimed']);out.chest={rolledBack:true};
  // (c) settlement failure -> instance stays ACTIVE, no settlement row.
  const pre3=await instOf(a.id);const settle=env.cmd('SETTLE_DAY1',r.json.revision);
  await fault('expedition_day_settlement');r=await post(a.token,settle);await clear('expedition_day_settlement');
  assert.equal(r.status,503);assert.deepEqual(await instOf(a.id),pre3);assert.equal(await countRows('expedition_day_settlement','entitlement_id=$1',[ent]),0);
  r=await post(a.token,settle);assert.equal(r.json.publicState.status,'AWAITING_DAY');out.settlement={rolledBack:true};
  rec('P14',out);
});

test('P15 tamper payloads rejected by the handler AND independently by the private routine',async()=>{
  const a=await fresh();const out={};
  for(const k of ['playerId','principalId','gold','xp','hp','loot','claimSourceId','rewardAmount','roomState','serverTime','policy']){
    const r=await post(a.token,{...env.cmd('MOVE',0,{direction:'up'}),[k]:k==='gold'?9999:'x'});out[k]=r.json.error;assert.equal(r.json.error.code,'BAD_COMMAND')}
  const bad={moveExtraParam:env.cmd('MOVE',0,{direction:'up',gold:5}),moveBadDir:env.cmd('MOVE',0,{direction:'upRight'}),altarParams:env.cmd('DISCOVER_ALTAR',0,{x:3}),
    badUuid:{...env.cmd('MOVE',0,{direction:'up'}),operationId:'not-a-uuid'},negRev:env.cmd('MOVE',-1,{direction:'up'}),floatRev:env.cmd('MOVE',0.5,{direction:'up'}),
    transfer:env.cmd('TRANSFER_REWARD',0),guest:env.cmd('GUEST_ATTACH',0),arrayBody:[1]};
  for(const [k,b] of Object.entries(bad)){const r=await post(a.token,b);out[k]=r.json.error;assert.equal(r.json.error.code,'BAD_COMMAND',k)}
  const ver=await post(a.token,{...env.cmd('MOVE',0,{direction:'up'}),contractVersion:'v0'});assert.equal(ver.json.error.code,'UNSUPPORTED_VERSION');
  const big=await call('POST','/commands',{token:a.token,raw:JSON.stringify({...env.cmd('MOVE',0,{direction:'up'}),pad:'x'.repeat(9000)})});assert.equal(big.status,413);
  const bigDeclared=await call('POST','/commands',{token:a.token,raw:'{}',headers:{'content-length':'99999'}});assert.equal(bigDeclared.json.error.code,'COMMAND_TOO_LARGE');
  const notJson=await call('POST','/commands',{token:a.token,raw:'{oops'});assert.equal(notJson.json.error.reason,'JSON');
  const ctype=await call('POST','/commands',{token:a.token,raw:JSON.stringify(env.cmd('MOVE',0,{direction:'up'})),headers:{'content-type':'text/plain'}});assert.equal(ctype.json.error.reason,'CONTENT_TYPE');
  // Defense in depth: bypass the handler and send a forged envelope straight to the routine as ruins_backend.
  const direct={};
  for(const [k,body] of Object.entries({gold:{...env.cmd('MOVE',0,{direction:'up'}),gold:30},params:env.cmd('DISCOVER_ALTAR',0,{x:1}),version:{...env.cmd('MOVE',0,{direction:'up'}),contractVersion:'v0'},room3:env.cmd('ENTER_ROOM3',0)})){
    try{await env.backendPool.query('select ruins_private.apply_account_expedition_command($1::uuid,$2::jsonb)',[a.id,JSON.stringify(body)]);direct[k]='ACCEPTED'}catch(e){direct[k]=e.message}}
  assert.deepEqual(direct,{gold:'RUINS:BAD_COMMAND:UNKNOWN_FIELD',params:'RUINS:BAD_COMMAND:UNEXPECTED_PARAMETERS',version:'RUINS:UNSUPPORTED_VERSION:CONTRACT_VERSION',room3:'RUINS:NOT_YET_UNLOCKED:ENTER_ROOM3'});
  assert.equal((await instOf(a.id)).revision,'0');
  rec('P15',{handler:out,unsupportedVersion:ver.json.error,oversize:big.json.error,directRoutine:direct});
});

test('P16 ordering gates, denied Day 2 / Room 3, terminal settlement',async()=>{
  const a=await fresh();const out={};
  const tryCmd=async(type,params={})=>{const rev=(await state(a.token)).expedition.revision;const r=await post(a.token,env.cmd(type,rev,params));return r.json.error??r.json.events};
  out.enterBeforeAltar=await tryCmd('ENTER_ROOM2');out.attackRoom1=await tryCmd('ATTACK_ZOMBIE');out.claimRoom1=await tryCmd('CLAIM_ROOM2_CHEST');
  out.nextDay=await tryCmd('BEGIN_NEXT_DAY');out.room3=await tryCmd('ENTER_ROOM3');
  assert.deepEqual(out.enterBeforeAltar,{code:'BAD_COMMAND',reason:'ALTAR_REQUIRED'});assert.deepEqual(out.attackRoom1,{code:'BAD_COMMAND',reason:'WRONG_ROOM'});
  assert.deepEqual(out.nextDay,{code:'NOT_YET_UNLOCKED',reason:'BEGIN_NEXT_DAY'});assert.deepEqual(out.room3,{code:'NOT_YET_UNLOCKED',reason:'ENTER_ROOM3'});
  await play(a.token,'ATTACK_ZOMBIE');out.claimBeforeDefeat=await tryCmd('CLAIM_ROOM2_CHEST');out.settleBeforeDefeat=await tryCmd('SETTLE_DAY1');
  assert.deepEqual(out.claimBeforeDefeat,{code:'BAD_COMMAND',reason:'ZOMBIE_NOT_DEFEATED'});
  for(let i=0;i<3;i++)await tryCmd('ATTACK_ZOMBIE');out.settleBeforeClaim=await tryCmd('SETTLE_DAY1');
  assert.deepEqual(out.settleBeforeClaim,{code:'BAD_COMMAND',reason:'CHEST_NOT_CLAIMED'});
  await tryCmd('MOVE',{direction:'right'});await tryCmd('CLAIM_ROOM2_CHEST');out.settle=await tryCmd('SETTLE_DAY1');
  assert.deepEqual(out.settle,['day1_settled']);
  out.moveAfter=await tryCmd('MOVE',{direction:'left'});out.claimAfter=await tryCmd('CLAIM_ROOM2_CHEST');out.settleAgain=await tryCmd('SETTLE_DAY1');out.nextDayAfter=await tryCmd('BEGIN_NEXT_DAY');
  for(const k of ['moveAfter','claimAfter','settleAgain'])assert.deepEqual(out[k],{code:'DAY_ALREADY_SETTLED',reason:'DAY1_SETTLED'},k);
  assert.equal(out.nextDayAfter.code,'NOT_YET_UNLOCKED');
  const s=(await state(a.token)).expedition;assert.equal(s.status,'AWAITING_DAY');assert.equal(s.day,1);assert.equal(s.nextChapter,'UNAVAILABLE');assert.equal(s.policyStatus,'UNRESOLVED');assert.deepEqual(s.availableActions,[]);
  assert.equal(await countRows('expedition_day_settlement','entitlement_id=$1',[await entOf(a.id)]),1);
  rec('P16',out);
});

test('P17 full Day 1 through the API equals the accepted 001B reference oracle (state + events per step)',async()=>{
  const a=await fresh();const steps=await play(a.token);
  let o=createDay1State();const oracleEvents=[];
  const seq=[['DISCOVER_ALTAR'],['MOVE','right'],['MOVE','right'],['MOVE','right'],['ENTER_ROOM2'],['MOVE','right'],['MOVE','right'],['ATTACK_ZOMBIE'],['ATTACK_ZOMBIE'],['ATTACK_ZOMBIE'],['MOVE','right'],['CLAIM_ROOM2_CHEST'],['SETTLE_DAY1']];
  for(const [type,direction] of seq){const r=applyDay1Command(o,{id:randomUUID(),expectedRevision:o.revision,type,...(direction?{direction}:{})},maps);o=r.state;oracleEvents.push(r.receipt.events)}
  assert.deepEqual(steps.map(s=>s.events),oracleEvents);
  const fin=steps.at(-1).publicState;
  assert.deepEqual({x:fin.heroPublic.x,y:fin.heroPublic.y,hp:fin.heroPublic.hp,xp:fin.heroPublic.xp,gold:fin.heroPublic.gold,rev:fin.revision,status:fin.status,checkpoint:fin.checkpoint},
    {x:o.hero.x,y:o.hero.y,hp:o.hero.hp,xp:o.hero.xp,gold:o.hero.gold,rev:o.revision,status:o.status,checkpoint:o.checkpoint});
  assert.deepEqual(fin.claimedPublic.map(c=>c.source).sort(),Object.keys(o.claimedLoot).sort());
  rec('P17',{steps:steps.length,final:fin,oracle:{hero:o.hero,revision:o.revision,status:o.status}});
});

test('P18 randomized differential fuzz from scripted checkpoints matches the reference oracle at every step, with required coverage',async()=>{
  const types=['MOVE','MOVE','MOVE','DISCOVER_ALTAR','ENTER_ROOM2','ATTACK_ZOMBIE','ATTACK_ZOMBIE','CLAIM_ROOM2_CHEST','CLAIM_ROOM2_CHEST','SETTLE_DAY1'];const dirs=['up','right','down','left'];
  const script=[['DISCOVER_ALTAR'],['MOVE','right'],['MOVE','right'],['MOVE','right'],['ENTER_ROOM2'],['MOVE','right'],['MOVE','right'],['ATTACK_ZOMBIE'],['ATTACK_ZOMBIE'],['ATTACK_ZOMBIE'],['MOVE','right'],['CLAIM_ROOM2_CHEST'],['CLAIM_ROOM2_CHEST']];
  let seed=0x1c006;const rnd=n=>{seed=(Math.imul(seed,1103515245)+12345)>>>0;return (seed>>>16)%n};
  let compared=0,accepted=0,rejected=0;const reasons={},events={};
  const step=async(a,o,type,direction)=>{
    let oErr=null,next=o,oEvents=null;try{const res=applyDay1Command(o,{id:randomUUID(),expectedRevision:o.revision,type,...(direction?{direction}:{})},maps);next=res.state;oEvents=res.receipt.events}catch(e){oErr=e.message}
    const r=await post(a.token,env.cmd(type,o.revision,direction?{direction}:{}));
    if(oErr){rejected++;const want=oErr==='DAY_ALREADY_SETTLED'?'DAY1_SETTLED':oErr;assert.equal(r.json.error?.reason,want,`${type} ${direction??''}: ${r.text}`);reasons[want]=(reasons[want]??0)+1}
    else{accepted++;assert.equal(r.status,200,r.text);assert.deepEqual(r.json.events,oEvents);for(const e of oEvents)events[e]=(events[e]??0)+1;const p=r.json.publicState,z=next.encounter.zombie;
      assert.deepEqual([p.revision,p.room,p.status,p.heroPublic.x,p.heroPublic.y,p.heroPublic.hp,p.heroPublic.xp,p.heroPublic.gold,p.visibleFlags.altarDiscovered,p.visibleFlags.zombieDefeated,p.visibleFlags.chestClaimed,p.room===2?p.enemyPublic.zombie.hp:null],
        [next.revision,next.currentRoom,next.status,next.hero.x,next.hero.y,next.hero.hp,next.hero.xp,next.hero.gold,next.flags.gate_c_discovery,z.defeated,Boolean(next.claimedLoot['ruins-gate-c-015:room02:chest:01']),next.currentRoom===2?z.hp:null])}
    compared++;return next};
  for(const prefix of [0,0,5,5,7,8,10,12,13]){
    const a=await fresh();let o=createDay1State();
    for(const [type,direction] of script.slice(0,prefix))o=await step(a,o,type,direction);
    for(let i=0;i<90;i++){const type=types[rnd(types.length)];o=await step(a,o,type,type==='MOVE'?dirs[rnd(4)]:undefined)}
  }
  for(const e of ['move','altar_discovered','room02_entered','zombie_hit','player_hit','zombie_die','chest_claimed','already_claimed','day1_settled'])assert.ok(events[e]>0,`coverage: ${e}`);
  for(const r of ['BLOCKED_TILE','DAY1_SETTLED','WRONG_ROOM','ENEMY_OUT_OF_RANGE','NOT_AT_CHEST'])assert.ok(reasons[r]>0,`coverage: ${r}`);
  rec('P18',{compared,accepted,rejected,acceptedEvents:events,rejectionReasons:reasons,seed:'0x1c006',checkpointPrefixes:[0,0,5,5,7,8,10,12,13]});
});

test('P19 rules/content pin mismatch never silently reinitialises; command before bootstrap is ENTITLEMENT_CONFLICT',async()=>{
  const a=await fresh();const nb=env.addAccount();
  const pre=await post(nb.token,env.cmd('MOVE',0,{direction:'up'}));assert.deepEqual(pre.json.error,{code:'ENTITLEMENT_CONFLICT',reason:'NOT_BOOTSTRAPPED'});
  await env.superQuery(`update ruins_private.expedition_instance i set rules_version='ruins-001c-day1-server-rules.v0' from ruins_private.expedition_entitlement e where e.id=i.entitlement_id and e.principal_id=$1`,[a.id]);
  const r=await post(a.token,env.cmd('MOVE',0,{direction:'up'}));assert.deepEqual(r.json.error,{code:'ENTITLEMENT_CONFLICT',reason:'RULES_VERSION_MISMATCH'});
  const i=await instOf(a.id);assert.equal(i.revision,'0');assert.equal(i.rules_version,'ruins-001c-day1-server-rules.v0');
  rec('P19',{notBootstrapped:pre.json.error,pinMismatch:r.json.error});
});

test('P20 CORS allowlist, OPTIONS without state, no-store; responses never contain principal/entitlement/instance IDs or SQL detail',async()=>{
  const ok=await call('OPTIONS','/commands',{headers:{origin:env.ORIGIN}});assert.equal(ok.status,204);assert.equal(ok.headers['access-control-allow-origin'],env.ORIGIN);assert.equal(ok.text,'');
  const evil=await call('OPTIONS','/commands',{headers:{origin:'https://evil.example'}});assert.equal(evil.status,400);assert.equal(evil.headers['access-control-allow-origin'],undefined);
  const g=await call('GET','/state',{token:env.tokens.A,headers:{origin:env.ORIGIN}});assert.equal(g.headers['cache-control'],'no-store');assert.equal(g.headers['access-control-allow-origin'],env.ORIGIN);
  const ids=(await env.superQuery(`select principal_id::text v from ruins_private.expedition_entitlement union all select id::text from ruins_private.expedition_entitlement union all select id::text from ruins_private.expedition_instance union all select id::text from ruins_private.expedition_claim union all select request_hash from ruins_private.expedition_operation`)).rows.map(r=>r.v);
  const all=responses.join('\n');const leaks=ids.filter(v=>all.includes(v));
  assert.deepEqual(leaks,[]);
  for(const bad of [/SQLSTATE|syntax error|permission denied|ruins_private|expedition_(entitlement|instance|claim|operation)|ruins_owner|ruins_backend|password|postgres/i])assert.doesNotMatch(all,bad);
  rec('P20',{responsesScanned:responses.length,privateIdsChecked:ids.length,leaks:leaks.length});
});

test('P21 shared public objects untouched; migration created nothing in public',async()=>{
  const now=await env.snapshotPublic();
  const filtered=now.filter(r=>r.relname!=='ruins_proof_fault');assert.deepEqual(filtered,env.publicBefore);
  const sentinels=(await env.superQuery(`select (select count(*) from public.wallet_ledger)::int w,(select count(*) from public.runner_xp_event)::int x,(select count(*) from public.daily_trial_run)::int d,(select count(*) from public.builder_challenge)::int f`)).rows[0];
  assert.deepEqual(sentinels,{w:1,x:1,d:1,f:1});
  rec('P21',{publicRelationsUnchanged:true,sentinels});
});

// RUINS 001C/008 — credential-theft proof against REAL local PostgreSQL 17.6 (no mocks).
// Threat: an attacker holds the ruins_backend database password ALONE (no signing key, no user bearer token)
// and connects directly, bypassing the trusted handler. Every attack below uses a raw pg connection as
// ruins_backend. Fake accounts and random in-memory keys only; keys, MACs and proofs are never recorded.
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {randomUUID,randomBytes} from 'node:crypto';
import path from 'node:path';
import pg from 'pg';
import {createProofEnv} from './proof-env.mjs';

const DENIED='RUINS:AUTH_REQUIRED:PRINCIPAL_PROOF';
let env;const evidence={startedAt:new Date().toISOString(),tests:{}};const seenMessages=[];
const rec=(name,data)=>{evidence.tests[name]=data};
const SQL={state:'select ruins_private.get_account_expedition($1::uuid,$2::jsonb) r',
  bootstrap:'select ruins_private.bootstrap_account_expedition($1::uuid,$2::jsonb,$3::jsonb) r',
  command:'select ruins_private.apply_account_expedition_command($1::uuid,$2::jsonb,$3::jsonb) r'};
// One call over a given client/pool as ruins_backend; returns {ok,result} or {ok:false,code,message}.
async function call(client,routine,principal,command,proof){
  const args=routine==='state'?[principal,j(proof)]:[principal,j(command),j(proof)];
  try{const r=(await client.query(SQL[routine],args)).rows[0].r;return {ok:true,result:r}}
  catch(e){seenMessages.push(e.message);return {ok:false,code:e.code,message:e.message}}
}
const j=v=>v===undefined?null:(typeof v==='string'?v:JSON.stringify(v));
const attacker=async()=>{const c=new pg.Client(env.backendConfig);await c.connect();return c};
const dbNow=async()=>Number((await env.superQuery(`select floor(extract(epoch from clock_timestamp()))::bigint n`)).rows[0].n);
async function footprint(principal){
  return (await env.superQuery(`select
    (select row_to_json(i)::text from ruins_private.expedition_instance i join ruins_private.expedition_entitlement e on e.id=i.entitlement_id where e.principal_id=$1) inst,
    (select count(*)::int from ruins_private.expedition_entitlement where principal_id=$1) ents,
    (select count(*)::int from ruins_private.expedition_operation o join ruins_private.expedition_entitlement e on e.id=o.entitlement_id where e.principal_id=$1) ops,
    (select count(*)::int from ruins_private.expedition_claim c join ruins_private.expedition_entitlement e on e.id=c.entitlement_id where e.principal_id=$1) claims,
    (select count(*)::int from ruins_private.principal_proof_nonce where principal_id=$1) nonces`,[principal])).rows[0];
}
const post=(token,body)=>env.api('POST','/commands',{token,body});
async function victimAt(steps=['DISCOVER_ALTAR',['MOVE','right']]){
  const v=env.addAccount();let r=await post(v.token,env.cmd('BOOTSTRAP',0));assert.equal(r.status,200);let rev=0;
  for(const s of steps){const [type,dir]=Array.isArray(s)?s:[s];r=await post(v.token,env.cmd(type,rev,dir?{direction:dir}:{}));assert.equal(r.status,200,r.text);rev=r.json.revision}
  return {...v,rev};
}
async function toKillReady(){ // victim one strike from defeating the zombie
  const v=await victimAt(['DISCOVER_ALTAR',['MOVE','right'],['MOVE','right'],['MOVE','right'],'ENTER_ROOM2',['MOVE','right'],['MOVE','right'],'ATTACK_ZOMBIE','ATTACK_ZOMBIE']);return v;
}

before(async()=>{env=await createProofEnv();evidence.postgres=env.db.version;evidence.migration=path.basename(env.migrationPath);evidence.migrationSha256WorkingTree=env.migrationSha256});
after(async()=>{
  evidence.completedAt=new Date().toISOString();
  // Never record key material: assert none of it reached any recorded message or the evidence itself.
  const blob=JSON.stringify(evidence)+seenMessages.join('\n');
  for(const k of env.keys.values())for(const enc of [k.toString('hex'),k.toString('base64')])assert.ok(!blob.includes(enc),'key material leaked into evidence');
  if(process.env.RUINS_PROOF_EVIDENCE_DIR){mkdirSync(process.env.RUINS_PROOF_EVIDENCE_DIR,{recursive:true});
    writeFileSync(path.join(process.env.RUINS_PROOF_EVIDENCE_DIR,'credential-theft-evidence.json'),JSON.stringify(evidence,null,1))}
  await env?.close();
});

test('C01 DB credential only: GET, BOOTSTRAP and COMMAND for a victim UUID are denied; zero read, zero write',async()=>{
  const v=await victimAt();const before=await footprint(v.id);const stranger=randomUUID();
  const c=await attacker();const out=[];
  try{
    const forgedKey=randomBytes(32);
    const proofs={nullProof:null,emptyObject:{},stringProof:'"x"',
      forgedRandomKey:p=>env.forge({principalId:v.id,purpose:p.purpose,command:p.command},forgedKey),
      unknownKid:p=>env.forge({principalId:v.id,purpose:p.purpose,command:p.command,kid:'attacker-kid'},forgedKey)};
    const cmdMove=env.cmd('MOVE',v.rev,{direction:'up'}),cmdBoot=env.cmd('BOOTSTRAP',0);
    for(const [name,proof] of Object.entries(proofs)){
      const mk=(purpose,command)=>typeof proof==='function'?proof({purpose,command}):proof;
      out.push({proof:name,routine:'state',...await call(c,'state',v.id,null,mk('STATE',null))});
      out.push({proof:name,routine:'bootstrap',...await call(c,'bootstrap',v.id,cmdBoot,mk('BOOTSTRAP',cmdBoot))});
      out.push({proof:name,routine:'command',...await call(c,'command',v.id,cmdMove,mk('COMMAND',cmdMove))});
      out.push({proof:name,routine:'bootstrap-new-uuid',...await call(c,'bootstrap',stranger,cmdBoot,mk('BOOTSTRAP',cmdBoot))});
    }
  }finally{await c.end()}
  for(const o of out){assert.equal(o.ok,false,`${o.proof}/${o.routine} must be denied`);assert.equal(o.code,'P0001');assert.equal(o.message,DENIED,`${o.proof}/${o.routine}`)}
  assert.deepEqual(await footprint(v.id),before,'victim unchanged: instance, ops, claims and nonces');
  assert.equal((await footprint(stranger)).ents,0,'no entitlement created for an arbitrary UUID');
  rec('C01',{attempts:out.length,allDenied:true,uniformMessage:DENIED,victimFootprintUnchanged:true,results:out.map(o=>({proof:o.proof,routine:o.routine,code:o.code,message:o.message}))});
});

test('C02 the retained 006 design is exploitable by the DB credential alone; r2 blocks the identical attack with the same privilege wall',async()=>{
  const old=await createProofEnv({design:'006'});const result={};
  try{
    const v=old.addAccount();assert.equal((await old.api('POST','/commands',{token:v.token,body:old.cmd('BOOTSTRAP',0)})).status,200);
    assert.equal((await old.api('POST','/commands',{token:v.token,body:old.cmd('DISCOVER_ALTAR',0)})).status,200);
    const c=new pg.Client(old.backendConfig);await c.connect();
    try{
      const read=(await c.query('select ruins_private.get_account_expedition($1::uuid) r',[v.id])).rows[0].r;
      const write=(await c.query('select ruins_private.apply_account_expedition_command($1::uuid,$2::jsonb) r',[v.id,JSON.stringify(old.cmd('MOVE',1,{direction:'up'}))])).rows[0].r;
      result.old={victimStateRead:read.expedition!==null,readRevision:read.expedition.revision,victimCommandAccepted:write.status==='ACCEPTED',writeRevision:write.revision};
    }finally{await c.end()}
    result.oldWall=(await old.superQuery(`select bool_or(has_table_privilege('ruins_backend',c.oid,'SELECT,INSERT,UPDATE,DELETE')) any from pg_class c where c.relnamespace='ruins_private'::regnamespace and c.relkind='r'`)).rows[0].any;
  }finally{await old.close()}
  assert.deepEqual(result.old,{victimStateRead:true,readRevision:1,victimCommandAccepted:true,writeRevision:2},'006 vulnerability reproduced');
  assert.equal(result.oldWall,false,'006 already had zero backend table privileges: the flaw was in routine authority, not grants');
  // Same attack on r2.
  const v=await victimAt();const before=await footprint(v.id);const c=await attacker();
  try{
    const read=await call(c,'state',v.id,null,null);
    const write=await call(c,'command',v.id,env.cmd('MOVE',v.rev,{direction:'up'}),null);
    result.r2={read:read.message,write:write.message};
  }finally{await c.end()}
  assert.deepEqual(result.r2,{read:DENIED,write:DENIED});assert.deepEqual(await footprint(v.id),before);
  result.r2Wall=(await env.superQuery(`select bool_or(has_table_privilege('ruins_backend',c.oid,'SELECT,INSERT,UPDATE,DELETE')) any from pg_class c where c.relnamespace='ruins_private'::regnamespace and c.relkind='r'`)).rows[0].any;
  assert.equal(result.r2Wall,false,'r2 keeps the same zero-table-privilege wall');
  rec('C02',result);
});

test('C03 wrong principal: a valid proof for A cannot act for B, and editing principalId breaks the MAC',async()=>{
  const A=await victimAt(),B=await victimAt();const bBefore=await footprint(B.id),aBefore=await footprint(A.id);const c=await attacker();const out={};
  try{
    const cB=env.cmd('MOVE',B.rev,{direction:'up'});
    out.stateAforB=(await call(c,'state',B.id,null,await env.sign(A.id,'STATE'))).message;
    out.commandAforB=(await call(c,'command',B.id,cB,await env.sign(A.id,'COMMAND',cB))).message;
    const bootB=env.cmd('BOOTSTRAP',0);out.bootstrapAforB=(await call(c,'bootstrap',B.id,bootB,await env.sign(A.id,'BOOTSTRAP',bootB))).message;
    const p=await env.sign(A.id,'STATE');out.principalFieldEdited=(await call(c,'state',B.id,null,{...p,principalId:B.id})).message;
  }finally{await c.end()}
  for(const [k,m] of Object.entries(out))assert.equal(m,DENIED,k);
  assert.deepEqual(await footprint(B.id),bBefore);assert.deepEqual(await footprint(A.id),aBefore);
  rec('C03',out);
});

test('C04 action binding: proofs cannot be moved between routines or onto a different command; untouched control succeeds',async()=>{
  const A=await victimAt();const c=await attacker();const out={};
  try{
    const good=env.cmd('MOVE',A.rev,{direction:'up'});const proof=await env.sign(A.id,'COMMAND',good);
    out.stateProofOnCommand=(await call(c,'command',A.id,good,await env.sign(A.id,'STATE'))).message;
    const boot=env.cmd('BOOTSTRAP',0);out.bootstrapProofOnCommand=(await call(c,'command',A.id,good,await env.sign(A.id,'BOOTSTRAP',boot))).message;
    out.commandProofOnState=(await call(c,'state',A.id,null,proof)).message;
    out.commandProofOnBootstrap=(await call(c,'bootstrap',A.id,{...good,type:'BOOTSTRAP',parameters:{}},proof)).message;
    out.changedDirection=(await call(c,'command',A.id,{...good,parameters:{direction:'down'}},proof)).message;
    out.changedType=(await call(c,'command',A.id,{...good,type:'DISCOVER_ALTAR',parameters:{}},proof)).message;
    out.changedExpectedRevision=(await call(c,'command',A.id,{...good,expectedRevision:A.rev+1},proof)).message;
    out.changedOperationId=(await call(c,'command',A.id,{...good,operationId:randomUUID()},proof)).message;
    const control=await call(c,'command',A.id,good,proof);
    out.control=control.ok?control.result.status:control.message;
  }finally{await c.end()}
  for(const [k,m] of Object.entries(out))if(k!=='control')assert.equal(m,DENIED,k);
  assert.equal(out.control,'ACCEPTED','the same unmodified proof+command is valid (denials were binding failures)');
  rec('C04',out);
});

test('C05 tampered and malformed proofs: every variant gets the same opaque denial; control succeeds',async()=>{
  const A=await victimAt();const base=await env.sign(A.id,'STATE');const flip=h=>(parseInt(h[0],16)^1).toString(16)+h.slice(1);
  const variants={
    macOneBitFlip:{...base,mac:flip(base.mac)},macUppercase:{...base,mac:base.mac.toUpperCase()},macShort:{...base,mac:base.mac.slice(1)},macLong:{...base,mac:base.mac+'0'},
    emptyKid:{...base,kid:''},unknownKid:env.signFields({...env.proofFields({principalId:A.id,purpose:'STATE'}),kid:'no-such-kid'}),
    kidNewlineInjection:env.signFields({...env.proofFields({principalId:A.id,purpose:'STATE'}),kid:'k2026a\nx'},env.keys.get('k2026a'),{raw:true}),
    purposeDelimiterInjection:env.signFields({...env.proofFields({principalId:A.id,purpose:'STATE'}),purpose:'STATE\n-'},env.keys.get('k2026a'),{raw:true}),
    principalUppercase:{...base,principalId:A.id.toUpperCase()},principalNotUuid:{...base,principalId:'not-a-uuid'},
    nonceOverlong:{...base,nonce:base.nonce+'0'.repeat(300)},nonceNotUuid:{...base,nonce:'x'},
    extraField:{...base,admin:'true'},missingNonce:(({nonce,...r})=>r)(base),issuedAtNumber:{...base,issuedAt:Number(base.issuedAt)},
    wrongVersion:{...base,proofVersion:'ruins-principal-proof.v2'},wrongAudience:{...base,aud:'generic-db'},
    arrayProof:[base],nullProof:null,stringProof:JSON.stringify(JSON.stringify(base))
  };
  const c=await attacker();const out={};
  try{for(const [k,p] of Object.entries(variants))out[k]=(await call(c,'state',A.id,null,p)).message;
    const control=await call(c,'state',A.id,null,base);out.control=control.ok?'OK':control.message;}finally{await c.end()}
  for(const [k,m] of Object.entries(out))if(k!=='control')assert.equal(m,DENIED,k);
  assert.equal(out.control,'OK','the untampered proof verifies (each variant failed on its tamper, not on setup)');
  rec('C05',{variants:Object.keys(variants).length,allDenied:true,uniformMessage:DENIED,control:out.control});
});

test('C06 freshness: expired, overlong, future-dated and retired/not-yet-valid keys are denied; in-policy boundaries pass',async()=>{
  const A=await victimAt();const now=await dbNow();const c=await attacker();const out={};
  await env.provisionKey('k-retired');await env.retireKey('k-retired');
  await env.provisionKey('k-future',{notBefore:new Date(Date.now()+3600e3).toISOString()});
  const p=o=>env.forge({principalId:A.id,purpose:'STATE',...o},undefined);
  const cases={expired:p({issuedAt:now-40,ttl:20}),lifetime31s:p({issuedAt:now,ttl:31}),issuedAt10sAhead:p({issuedAt:now+10,ttl:20}),
    expiresBeforeIssued:p({issuedAt:now,ttl:0}),retiredKey:p({kid:'k-retired'}),keyNotYetValid:p({kid:'k-future'})};
  const allowed={lifetime30s:p({issuedAt:now,ttl:30}),issuedAt4sAhead:p({issuedAt:now+4,ttl:20})};
  try{for(const [k,x] of Object.entries(cases))out[k]=(await call(c,'state',A.id,null,x)).message;
    for(const [k,x] of Object.entries(allowed)){const r=await call(c,'state',A.id,null,x);out[k]=r.ok?'OK':r.message}}finally{await c.end()}
  for(const k of Object.keys(cases))assert.equal(out[k],DENIED,k);
  for(const k of Object.keys(allowed))assert.equal(out[k],'OK',k);
  rec('C06',out);
});

test('C07 nonce replay: a proof works once (sequential and 10 concurrent sessions); retries use a fresh proof and get the original receipt',async()=>{
  const A=await victimAt();const out={};const c=await attacker();
  try{
    const sp=await env.sign(A.id,'STATE');out.stateFirst=(await call(c,'state',A.id,null,sp)).ok;out.stateReplay=(await call(c,'state',A.id,null,sp)).message;
    const cmd=env.cmd('MOVE',A.rev,{direction:'up'});const cp=await env.sign(A.id,'COMMAND',cmd);
    const first=await call(c,'command',A.id,cmd,cp);out.commandFirst=first.result.status;out.commandReplaySameProof=(await call(c,'command',A.id,cmd,cp)).message;
    const retry=await call(c,'command',A.id,cmd,await env.sign(A.id,'COMMAND',cmd));
    out.freshProofSameOp={duplicate:retry.result.duplicate,sameReceipt:JSON.stringify({...retry.result,duplicate:false})===JSON.stringify(first.result)};
  }finally{await c.end()}
  assert.equal(out.stateFirst,true);assert.equal(out.stateReplay,DENIED);assert.equal(out.commandFirst,'ACCEPTED');assert.equal(out.commandReplaySameProof,DENIED);
  assert.deepEqual(out.freshProofSameOp,{duplicate:true,sameReceipt:true});
  // Same valid proof raced on 10 independent DB sessions: exactly one wins.
  const fp=await footprint(A.id);const cmd2=env.cmd('MOVE',fp.inst?JSON.parse(fp.inst).revision:0,{direction:'down'});const race=await env.sign(A.id,'COMMAND',cmd2);
  const clients=await Promise.all(Array.from({length:10},attacker));
  let rs;try{rs=await Promise.all(clients.map(cl=>call(cl,'command',A.id,cmd2,race)))}finally{await Promise.all(clients.map(cl=>cl.end()))}
  out.concurrentSameProof={sessions:10,accepted:rs.filter(r=>r.ok).length,denied:rs.filter(r=>r.message===DENIED).length};
  assert.deepEqual(out.concurrentSameProof,{sessions:10,accepted:1,denied:9});
  const sRace=await env.sign(A.id,'STATE');const sClients=await Promise.all(Array.from({length:10},attacker));
  let ss;try{ss=await Promise.all(sClients.map(cl=>call(cl,'state',A.id,null,sRace)))}finally{await Promise.all(sClients.map(cl=>cl.end()))}
  out.concurrentSameStateProof={accepted:ss.filter(r=>r.ok).length};assert.equal(out.concurrentSameStateProof.accepted,1);
  // Through the handler: a lost response is retried with the same op; the handler mints a new proof each time.
  const op=env.cmd('MOVE',(await env.api('GET','/state',{token:A.token})).json.expedition.revision,{direction:'up'});
  const h1=await post(A.token,op),h2=await post(A.token,op);
  out.handlerRetry={first:h1.json.duplicate,second:h2.json.duplicate,sameRevision:h1.json.revision===h2.json.revision};
  assert.deepEqual(out.handlerRetry,{first:false,second:true,sameRevision:true});
  rec('C07',out);
});

test('C08 25-tab bootstrap and 16-way chest race under signed proofs: one entitlement, one award, distinct consumed nonces',async()=>{
  const a=env.addAccount();
  const rs=await Promise.all(Array.from({length:25},()=>post(a.token,env.cmd('BOOTSTRAP',0))));
  assert.ok(rs.every(r=>r.status===200));const f=await footprint(a.id);
  assert.equal(f.ents,1);assert.equal(rs.filter(r=>r.json.events[0]==='expedition_bootstrapped').length,1);
  assert.equal(f.nonces,25,'each tab consumed its own proof nonce');
  const v=await victimAt(['DISCOVER_ALTAR',['MOVE','right'],['MOVE','right'],['MOVE','right'],'ENTER_ROOM2',['MOVE','right'],['MOVE','right'],'ATTACK_ZOMBIE','ATTACK_ZOMBIE','ATTACK_ZOMBIE',['MOVE','right']]);
  const claims=await Promise.all(Array.from({length:16},()=>post(v.token,env.cmd('CLAIM_ROOM2_CHEST',v.rev))));
  assert.equal(claims.filter(r=>r.status===200).length,1);
  const inv=(await env.superQuery(`select item_key, sum(delta)::int s, count(*)::int n from ruins_private.expedition_inventory_event i join ruins_private.expedition_entitlement e on e.id=i.entitlement_id where e.principal_id=$1 group by 1 order by 1`,[v.id])).rows;
  assert.deepEqual(inv,[{item_key:'staging_gold',s:30,n:1},{item_key:'staging_xp',s:2,n:1}]);
  rec('C08',{parallelBootstraps:25,entitlements:f.ents,noncesConsumed:f.nonces,parallelClaims:16,accepted:1,inventory:inv});
});

test('C09 rollback: injected failure after proof+claim work leaves no nonce, claim, inventory or receipt; fresh proof + same op succeeds',async()=>{
  const v=await toKillReady();const before=await footprint(v.id);const c=await attacker();const out={};
  const kill=env.cmd('ATTACK_ZOMBIE',v.rev);const p1=await env.sign(v.id,'COMMAND',kill);
  await env.superQuery(`create function public.ruins_proof_fault() returns trigger language plpgsql as $$ begin raise exception 'fault'; end $$;
    create trigger ruins_proof_fault before insert on ruins_private.expedition_inventory_event for each row execute function public.ruins_proof_fault()`);
  try{const r=await call(c,'command',v.id,kill,p1);out.injected={ok:r.ok,code:r.code}}
  finally{await env.superQuery(`drop trigger ruins_proof_fault on ruins_private.expedition_inventory_event; drop function public.ruins_proof_fault()`)}
  out.nonceOfFailedCall=(await env.superQuery(`select count(*)::int n from ruins_private.principal_proof_nonce where nonce=$1`,[p1.nonce])).rows[0].n;
  assert.equal(out.injected.ok,false);assert.equal(out.nonceOfFailedCall,0,'consumed nonce rolled back with the command');
  assert.deepEqual(await footprint(v.id),before,'no claim, inventory, receipt, state or nonce committed');
  // Fault on the nonce insert itself: nothing at all is committed.
  await env.superQuery(`create function public.ruins_proof_fault() returns trigger language plpgsql as $$ begin raise exception 'fault'; end $$;
    create trigger ruins_proof_fault before insert on ruins_private.principal_proof_nonce for each row execute function public.ruins_proof_fault()`);
  try{out.nonceInsertFault=(await call(c,'command',v.id,kill,await env.sign(v.id,'COMMAND',kill))).ok}
  finally{await env.superQuery(`drop trigger ruins_proof_fault on ruins_private.principal_proof_nonce; drop function public.ruins_proof_fault()`)}
  assert.equal(out.nonceInsertFault,false);assert.deepEqual(await footprint(v.id),before);
  const ok=await call(c,'command',v.id,kill,await env.sign(v.id,'COMMAND',kill));await c.end();
  out.freshProofSameOp=ok.result.events;assert.deepEqual(ok.result.events,['zombie_hit','zombie_die']);
  const after=await footprint(v.id);assert.equal(after.claims,1);
  rec('C09',out);
});

test('C10 role probe: no role can read keys or nonces or call the verifier; backend executes exactly 3 entry routines; no signing oracle',async()=>{
  await env.superQuery(`do $$ begin if not exists (select 1 from pg_roles where rolname='public_probe') then create role public_probe nologin; end if; end $$`);
  const m=(await env.superQuery(`select r, t.relname obj, has_table_privilege(r,t.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') any_priv
     from unnest(array['public_probe','anon','authenticated','service_role','ruins_backend']) r cross join pg_class t
    where t.oid in ('ruins_private.principal_proof_key'::regclass,'ruins_private.principal_proof_nonce'::regclass) order by 1,2`)).rows;
  assert.ok(m.every(x=>x.any_priv===false),JSON.stringify(m.filter(x=>x.any_priv)));
  const execs=(await env.superQuery(`select p.oid::regprocedure::text sig from pg_proc p where p.pronamespace='ruins_private'::regnamespace and has_function_privilege('ruins_backend',p.oid,'EXECUTE') order by 1`)).rows.map(r=>r.sig);
  assert.deepEqual(execs,['ruins_private.apply_account_expedition_command(uuid,jsonb,jsonb)','ruins_private.bootstrap_account_expedition(uuid,jsonb,jsonb)','ruins_private.get_account_expedition(uuid,jsonb)']);
  const helperExec=(await env.superQuery(`select r, has_function_privilege(r,'ruins_private.verify_principal_proof(uuid,text,jsonb,jsonb)','EXECUTE') v, has_function_privilege(r,'ruins_private.purge_expired_principal_proof_nonces()','EXECUTE') p
     from unnest(array['public_probe','anon','authenticated','service_role','ruins_backend']) r`)).rows;
  assert.ok(helperExec.every(x=>!x.v&&!x.p));
  const oracle=(await env.superQuery(`select p.oid::regprocedure::text sig, format_type(p.prorettype,null) ret from pg_proc p where p.pronamespace='ruins_private'::regnamespace and format_type(p.prorettype,null) in ('bytea','text')`)).rows;
  assert.ok(oracle.every(o=>!/hmac|sign|key|mac/i.test(o.sig)),'no key/MAC-returning routine exists');
  const c=await attacker();const probes={};
  try{for(const [k,sql] of Object.entries({readKeys:'select * from ruins_private.principal_proof_key',readNonces:'select * from ruins_private.principal_proof_nonce',
    deleteNonces:'delete from ruins_private.principal_proof_nonce',verifyHelper:"select ruins_private.verify_principal_proof(gen_random_uuid(),'STATE',null,'{}'::jsonb)",
    purge:'select ruins_private.purge_expired_principal_proof_nonces()',setOwner:'set role ruins_owner'})){try{await c.query(sql);probes[k]='OK'}catch(e){probes[k]=e.code}}}finally{await c.end()}
  for(const [k,v] of Object.entries(probes))assert.equal(v,'42501',k);
  rec('C10',{keyNonceMatrix:m,backendExecutable:execs,helperExecutableByAnyRole:false,byteaOrTextReturning:oracle,backendProbes:probes});
});

test('C11 auth seam: browser principal/proof fields and bearer substitutions are never authority; one identity reaches every private call',async()=>{
  const A=env.addAccount(),B=await victimAt();const out={};
  const r0=await post(A.token,env.cmd('BOOTSTRAP',0));assert.equal(r0.status,200);
  for(const k of ['principalId','proof','mac','kid','nonce','purpose'])out['body_'+k]=(await post(A.token,{...env.cmd('MOVE',0,{direction:'up'}),[k]:B.id})).json.error;
  const asHeader=await env.api('GET','/state',{token:A.token,headers:{'x-ruins-principal':B.id,'x-ruins-proof':'x'}});
  out.headerIgnored=asHeader.json.expedition.revision===0&&asHeader.json.expedition.heroPublic.x===2;
  const proofAsBearer=await env.api('GET','/state',{headers:{authorization:'Bearer '+Buffer.from(JSON.stringify(await env.sign(B.id,'STATE'))).toString('base64url')}});
  out.proofAsBearer=proofAsBearer.json.error;
  env.dbCalls.length=0;
  await env.api('GET','/state',{token:A.token});await post(A.token,env.cmd('BOOTSTRAP',0));await post(A.token,env.cmd('MOVE',0,{direction:'up'}));
  const calls=env.dbCalls.map(x=>({routine:x.routine,principalIsA:x.principal===A.id,proofPrincipalIsA:x.proofPrincipal===A.id,purpose:x.purpose}));
  out.calls=calls;out.distinctNonces=new Set(env.dbCalls.map(x=>x.nonce)).size===env.dbCalls.length;
  for(const k of ['principalId','proof','mac','kid','nonce','purpose'])assert.deepEqual(out['body_'+k],{code:'BAD_COMMAND',reason:'UNKNOWN_FIELD'},k);
  assert.equal(out.headerIgnored,true);assert.deepEqual(out.proofAsBearer,{code:'AUTH_REQUIRED',reason:'TOKEN'});
  assert.deepEqual(calls.map(c=>c.purpose),['STATE','BOOTSTRAP','COMMAND']);assert.ok(calls.every(c=>c.principalIsA&&c.proofPrincipalIsA));assert.equal(out.distinctNonces,true);
  rec('C11',out);
});

test('C12 key lifecycle: two active kids overlap, retirement and unknown kids deny, expiry denies old proofs, purge keeps live nonces; no key text anywhere',async()=>{
  const A=await victimAt();const c=await attacker();const out={};
  try{
    await env.provisionKey('k2026b');
    const pa=await env.sign(A.id,'STATE');await env.useKid('k2026b');const pb=await env.sign(A.id,'STATE');
    out.oldKidValid=(await call(c,'state',A.id,null,pa)).ok;out.newKidValid=(await call(c,'state',A.id,null,pb)).ok;
    await env.retireKey('k2026a');
    out.retiredKidFresh=(await call(c,'state',A.id,null,env.forge({principalId:A.id,purpose:'STATE',kid:'k2026a'}))).message;
    out.unknownKid=(await call(c,'state',A.id,null,env.forge({principalId:A.id,purpose:'STATE',kid:'k2099z'}))).message;
    const now=await dbNow();out.expiredOnActiveKid=(await call(c,'state',A.id,null,env.forge({principalId:A.id,purpose:'STATE',issuedAt:now-60,ttl:20}))).message;
    out.afterRotation=(await call(c,'state',A.id,null,await env.sign(A.id,'STATE'))).ok;
    // Retention: plant two long-expired nonces (operator) next to live ones; purge removes only the expired.
    await env.superQuery(`insert into ruins_private.principal_proof_nonce (kid,nonce,principal_id,purpose,message_sha256,issued_at,expires_at)
      values ('k2026a',gen_random_uuid(),$1,'STATE',repeat('0',64),now()-interval '10 minutes',now()-interval '9 minutes'),
             ('k2026a',gen_random_uuid(),$1,'STATE',repeat('0',64),now()-interval '5 minutes',now()-interval '4 minutes')`,[A.id]);
    const liveBefore=Number((await env.superQuery(`select count(*)::int n from ruins_private.principal_proof_nonce where expires_at > now() - interval '60 seconds'`)).rows[0].n);
    const pc=new pg.Client(env.db.superConfig);await pc.connect();let purged; // operator acting as owner
    try{await pc.query('set role ruins_owner');purged=Number((await pc.query('select ruins_private.purge_expired_principal_proof_nonces() n')).rows[0].n)}finally{await pc.end()}
    const liveAfter=Number((await env.superQuery(`select count(*)::int n from ruins_private.principal_proof_nonce where expires_at > now() - interval '60 seconds'`)).rows[0].n);
    out.purge={purged,liveBefore,liveAfter};
    out.replayAfterPurge=(await call(c,'state',A.id,null,pb)).message;
  }finally{await c.end()}
  assert.equal(out.oldKidValid,true);assert.equal(out.newKidValid,true);
  for(const k of ['retiredKidFresh','unknownKid','expiredOnActiveKid','replayAfterPurge'])assert.equal(out[k],DENIED,k);
  assert.equal(out.afterRotation,true);assert.ok(out.purge.purged>=2);assert.equal(out.purge.liveAfter,out.purge.liveBefore,'purge never deletes live nonces');
  // Key text never appears in any database message, migration source, or recorded response.
  const keyRows=(await env.superQuery(`select count(*)::int n from ruins_private.principal_proof_key`)).rows[0].n;
  const corpus=seenMessages.join('\n')+env.migrationSql;
  for(const k of env.keys.values())for(const enc of [k.toString('hex'),k.toString('base64')])assert.ok(!corpus.includes(enc));
  rec('C12',{...out,keysProvisionedThisRun:keyRows,keyTextFoundInMessagesOrMigration:false});
});

test('C13 regression guard: wallet, XP, Daily Trial and Friend sentinels untouched; no public relation or ACL change after all attacks',async()=>{
  const now=await env.snapshotPublic();assert.deepEqual(now.filter(r=>r.relname!=='ruins_proof_fault'),env.publicBefore);
  const s=(await env.superQuery(`select (select count(*) from public.wallet_ledger)::int w,(select count(*) from public.runner_xp_event)::int x,(select count(*) from public.daily_trial_run)::int d,(select count(*) from public.builder_challenge)::int f`)).rows[0];
  assert.deepEqual(s,{w:1,x:1,d:1,f:1});
  rec('C13',{publicUnchanged:true,sentinels:s});
});

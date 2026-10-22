// Builds one disposable proof environment: local PG 17.6 + Supabase role shim + migration draft applied
// by a NON-superuser migrator, then ruins_backend given LOGIN out-of-band (as an operator would).
// 008: an operator also provisions a random HMAC key (in memory for this run only; never written to disk,
// logs or evidence), and the handler signs a fresh principal assertion for every database call.
// createProofEnv({design:'006'}) instead applies the retained 006 draft, for the vulnerable-design demonstration.
import {readFileSync} from 'node:fs';
import {randomBytes,randomUUID,createHash,createHmac} from 'node:crypto';
import path from 'node:path';
import pg from 'pg';
import {startLocalPostgres,query,HERE,MIGRATION,MIGRATION_006} from './local-pg.mjs';
import {createRuinsExpeditionHandler,ROUTINES} from '../../supabase/functions/ruins-expedition/handler.mjs';
import {createPrincipalProofSigner,canonicalProofMessage,proofBinding,PROOF_VERSION,PROOF_AUDIENCE} from '../../supabase/functions/ruins-expedition/principal-proof.mjs';

export async function createProofEnv(options={}){
  const db=await startLocalPostgres();
  try{return await build(db,options)}catch(error){await db.stop();throw error} // never leave a server or data dir behind
}
async function build(db,{design='r2'}={}){
  const migrationPath=design==='006'?MIGRATION_006:MIGRATION;
  const pw=()=>randomBytes(18).toString('hex');
  const creds={migrator:pw(),authenticator:pw(),ruins_backend:pw()};
  await query(db.superConfig,readFileSync(path.join(HERE,'supabase-roles-shim.sql'),'utf8'));
  await query(db.superConfig,`alter role migrator password '${creds.migrator}'; alter role authenticator password '${creds.authenticator}'`);
  const snapshotPublic=async()=>(await query(db.superConfig,`select c.relname, c.relkind, coalesce(c.relacl::text,'') acl from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' order by 1`)).rows;
  const publicBefore=await snapshotPublic();
  const migrationSql=readFileSync(migrationPath,'utf8');
  const migratorConfig={...db.base,user:'migrator',password:creds.migrator};
  await query(migratorConfig,migrationSql);
  // Out-of-band operator step (never in the migration): give the backend role a login + secret.
  await query(db.superConfig,`alter role ruins_backend login password '${creds.ruins_backend}'`);
  const backendConfig={...db.base,user:'ruins_backend',password:creds.ruins_backend};
  const authenticatorConfig={...db.base,user:'authenticator',password:creds.authenticator};
  const backendPool=new pg.Pool({...backendConfig,max:40});
  const superQuery=(sql,params)=>query(db.superConfig,sql,params);

  // 008 out-of-band key provisioning (operator acting as the owner). Keys live only in this process.
  const keys=new Map();
  const provisionKey=async(kid,{status='ACTIVE',notBefore=null}={})=>{const bytes=randomBytes(32);keys.set(kid,bytes);
    await superQuery(`insert into ruins_private.principal_proof_key (kid,key_material,status,retired_at,not_before)
      values ($1,$2,$3,case when $3='RETIRED' then now() end,coalesce($4::timestamptz,now()))`,[kid,bytes,status,notBefore]);
    return kid};
  const retireKey=kid=>superQuery(`update ruins_private.principal_proof_key set status='RETIRED', retired_at=now() where kid=$1`,[kid]);
  let signer=null,activeKid=null;
  const useKid=async kid=>{activeKid=kid;signer=await createPrincipalProofSigner({kid,keyBytes:new Uint8Array(keys.get(kid))})};
  if(design!=='006'){await provisionKey('k2026a');await useKid('k2026a')}

  // Raw signer for adversarial tests: any field values, any key (or a key the database does not hold).
  const macHex=(message,keyBytes)=>createHmac('sha256',keyBytes).update(Buffer.from(message,'utf8')).digest('hex');
  const proofFields=({principalId,purpose,command=null,kid=activeKid,issuedAt=Math.floor(Date.now()/1000),ttl=20,nonce=randomUUID()})=>
    ({proofVersion:PROOF_VERSION,kid,aud:PROOF_AUDIENCE,principalId,purpose,...proofBinding(purpose,command),issuedAt:String(issuedAt),expiresAt:String(issuedAt+ttl),nonce});
  const signFields=(fields,keyBytes=keys.get(fields.kid)??randomBytes(32),{raw=false}={})=>
    ({...fields,mac:macHex(raw?Object.keys(fields).map(k=>fields[k]).join('\n'):canonicalProofMessage(fields),keyBytes)});
  const forge=(args,keyBytes)=>signFields(proofFields(args),keyBytes);

  // Fake Supabase Auth: opaque tokens -> verified account UUIDs. Revoked/expired tokens verify to null.
  const accounts={A:randomUUID(),B:randomUUID()};
  const tokens={A:'tokA.'+pw(),B:'tokB.'+pw(),revoked:'tokR.'+pw(),expired:'tokE.'+pw()};
  const verified=new Map([[tokens.A,accounts.A],[tokens.B,accounts.B]]);
  const verifyCalls=[];
  const addAccount=()=>{const id=randomUUID(),token='tok.'+pw();verified.set(token,id);return {id,token}};
  const verifyUser=async token=>{verifyCalls.push(token);const id=verified.get(token);return id?{id}:null};
  const sqlFor=design==='006'?{[ROUTINES.state]:'select ruins_private.get_account_expedition($1::uuid) as r',
      [ROUTINES.bootstrap]:'select ruins_private.bootstrap_account_expedition($1::uuid,$2::jsonb) as r',
      [ROUTINES.command]:'select ruins_private.apply_account_expedition_command($1::uuid,$2::jsonb) as r'}
    :{[ROUTINES.state]:'select ruins_private.get_account_expedition($1::uuid,$2::jsonb) as r',
      [ROUTINES.bootstrap]:'select ruins_private.bootstrap_account_expedition($1::uuid,$2::jsonb,$3::jsonb) as r',
      [ROUTINES.command]:'select ruins_private.apply_account_expedition_command($1::uuid,$2::jsonb,$3::jsonb) as r'};
  const dbCalls=[];
  const dbSeam={async call(routine,principal,command,proof){const sql=sqlFor[routine];if(!sql)throw new Error('RUINS_UNKNOWN_ROUTINE');
    dbCalls.push({routine,principal,proofPrincipal:proof?.principalId,purpose:proof?.purpose,nonce:proof?.nonce});
    const args=design==='006'?(routine===ROUTINES.state?[principal]:[principal,JSON.stringify(command)])
      :(routine===ROUTINES.state?[principal,JSON.stringify(proof)]:[principal,JSON.stringify(command),JSON.stringify(proof)]);
    return (await backendPool.query(sql,args)).rows[0].r}};
  const ORIGIN='https://staging.example.test';
  const signProof=design==='006'?async()=>null:args=>signer(args);
  const handler=createRuinsExpeditionHandler({verifyUser,signProof,db:dbSeam,allowedOrigins:[ORIGIN]});
  const api=async(method,route,{token,body,raw,headers={}}={})=>{
    const init={method,headers:{...(token?{authorization:'Bearer '+token}:{}),...(body!==undefined||raw!==undefined?{'content-type':'application/json'}:{}),...headers}};
    if(raw!==undefined)init.body=raw;else if(body!==undefined)init.body=JSON.stringify(body);
    const res=await handler(new Request('https://local.invalid/functions/v1/ruins-expedition'+route,init));
    const text=await res.text();return {status:res.status,headers:Object.fromEntries(res.headers),text,json:text?JSON.parse(text):null};
  };
  const cmd=(type,expectedRevision,parameters={},operationId=randomUUID())=>({contractVersion:'ruins-expedition-001c.v1',operationId,expectedRevision,type,parameters});
  // Valid server-side proof for direct routine calls (what the trusted handler would mint).
  const sign=(principalId,purpose,command=null)=>signer({principalId,purpose,command});
  return {design,db,creds,migrationSql,migrationPath,migrationSha256:createHash('sha256').update(readFileSync(migrationPath)).digest('hex'),
    migratorConfig,backendConfig,publicBefore,snapshotPublic,addAccount,authenticatorConfig,backendPool,accounts,tokens,verifyCalls,dbCalls,handler,api,cmd,ORIGIN,
    keys,provisionKey,retireKey,useKid,sign,proofFields,signFields,forge,macHex,get activeKid(){return activeKid},
    superQuery,async close(){await backendPool.end();await db.stop()}};
}

// Builds one disposable proof environment: local PG 17.6 + Supabase role shim + migration draft applied
// by a NON-superuser migrator, then ruins_backend given LOGIN out-of-band (as an operator would).
import {readFileSync} from 'node:fs';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import path from 'node:path';
import pg from 'pg';
import {startLocalPostgres,query,HERE,MIGRATION} from './local-pg.mjs';
import {createRuinsExpeditionHandler,ROUTINES} from '../../supabase/functions/ruins-expedition/handler.mjs';

export async function createProofEnv(){
  const db=await startLocalPostgres();
  try{return await build(db)}catch(error){await db.stop();throw error} // never leave a server or data dir behind
}
async function build(db){
  const pw=()=>randomBytes(18).toString('hex');
  const creds={migrator:pw(),authenticator:pw(),ruins_backend:pw()};
  await query(db.superConfig,readFileSync(path.join(HERE,'supabase-roles-shim.sql'),'utf8'));
  await query(db.superConfig,`alter role migrator password '${creds.migrator}'; alter role authenticator password '${creds.authenticator}'`);
  const snapshotPublic=async()=>(await query(db.superConfig,`select c.relname, c.relkind, coalesce(c.relacl::text,'') acl from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' order by 1`)).rows;
  const publicBefore=await snapshotPublic();
  const migrationSql=readFileSync(MIGRATION,'utf8');
  const migratorConfig={...db.base,user:'migrator',password:creds.migrator};
  await query(migratorConfig,migrationSql);
  // Out-of-band operator step (never in the migration): give the backend role a login + secret.
  await query(db.superConfig,`alter role ruins_backend login password '${creds.ruins_backend}'`);
  const backendConfig={...db.base,user:'ruins_backend',password:creds.ruins_backend};
  const authenticatorConfig={...db.base,user:'authenticator',password:creds.authenticator};
  const backendPool=new pg.Pool({...backendConfig,max:40});

  // Fake Supabase Auth: opaque tokens -> verified account UUIDs. Revoked/expired tokens verify to null.
  const accounts={A:randomUUID(),B:randomUUID()};
  const tokens={A:'tokA.'+pw(),B:'tokB.'+pw(),revoked:'tokR.'+pw(),expired:'tokE.'+pw()};
  const verified=new Map([[tokens.A,accounts.A],[tokens.B,accounts.B]]);
  const verifyCalls=[];
  const addAccount=()=>{const id=randomUUID(),token='tok.'+pw();verified.set(token,id);return {id,token}};
  const verifyUser=async token=>{verifyCalls.push(token);const id=verified.get(token);return id?{id}:null};
  const sqlFor={[ROUTINES.state]:'select ruins_private.get_account_expedition($1::uuid) as r',
    [ROUTINES.bootstrap]:'select ruins_private.bootstrap_account_expedition($1::uuid,$2::jsonb) as r',
    [ROUTINES.command]:'select ruins_private.apply_account_expedition_command($1::uuid,$2::jsonb) as r'};
  const dbSeam={async call(routine,principal,command){const sql=sqlFor[routine];if(!sql)throw new Error('RUINS_UNKNOWN_ROUTINE');
    const args=routine===ROUTINES.state?[principal]:[principal,JSON.stringify(command)];return (await backendPool.query(sql,args)).rows[0].r}};
  const ORIGIN='https://staging.example.test';
  const handler=createRuinsExpeditionHandler({verifyUser,db:dbSeam,allowedOrigins:[ORIGIN]});
  const api=async(method,route,{token,body,raw,headers={}}={})=>{
    const init={method,headers:{...(token?{authorization:'Bearer '+token}:{}),...(body!==undefined||raw!==undefined?{'content-type':'application/json'}:{}),...headers}};
    if(raw!==undefined)init.body=raw;else if(body!==undefined)init.body=JSON.stringify(body);
    const res=await handler(new Request('https://local.invalid/functions/v1/ruins-expedition'+route,init));
    const text=await res.text();return {status:res.status,headers:Object.fromEntries(res.headers),text,json:text?JSON.parse(text):null};
  };
  const cmd=(type,expectedRevision,parameters={},operationId=randomUUID())=>({contractVersion:'ruins-expedition-001c.v1',operationId,expectedRevision,type,parameters});
  return {db,creds,migrationSql,migrationSha256:createHash('sha256').update(readFileSync(MIGRATION)).digest('hex'),
    migratorConfig,backendConfig,publicBefore,snapshotPublic,addAccount,authenticatorConfig,backendPool,accounts,tokens,verifyCalls,handler,api,cmd,ORIGIN,
    superQuery:(sql,params)=>query(db.superConfig,sql,params),
    async close(){await backendPool.end();await db.stop()}};
}

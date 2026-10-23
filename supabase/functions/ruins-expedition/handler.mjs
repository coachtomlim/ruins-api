// RUINS_DAILY_EXPEDITION_001C trusted request handler CANDIDATE (source only; NOT deployed).
// Runtime-neutral (Web Request/Response), so the same code runs under the Supabase Edge (Deno) entry
// in ./index.ts and under the offline Node proof harness. Three injected seams:
//   verifyUser(token) -> {id} | null          : MUST verify the token with Supabase Auth (auth.getUser); never decode-only.
//   signProof({principalId,purpose,command})   : 008 principal assertion (./principal-proof.mjs), server-side only.
//   db.call(routine, principalId, cmd, proof)  : ONE private-routine call in its own transaction as ruins_backend.
// The browser supplies intent only. The principal comes exclusively from verifyUser, and the database accepts it
// only with a valid single-use proof, so the DB credential alone cannot act for an arbitrary user.

export const CONTRACT_VERSION='ruins-expedition-001c.v1';
export const MAX_BODY_BYTES=8192;
const ALLOWED=new Set(['BOOTSTRAP','MOVE','DISCOVER_ALTAR','ENTER_ROOM2','ATTACK_ZOMBIE','CLAIM_ROOM2_CHEST','SETTLE_DAY1']);
const LOCKED=new Set(['BEGIN_NEXT_DAY','ENTER_ROOM3']);
const ENVELOPE=['contractVersion','operationId','expectedRevision','type','parameters'];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const STATUS={AUTH_REQUIRED:401,UNSUPPORTED_VERSION:400,BAD_COMMAND:400,COMMAND_TOO_LARGE:413,ENTITLEMENT_CONFLICT:409,
  REVISION_CONFLICT:409,OPERATION_ID_REUSE_MISMATCH:409,NOT_YET_UNLOCKED:403,DAY_ALREADY_SETTLED:409,OUT_OF_RANGE:422,INTERNAL_RETRY_SAFE:503};
const RETRYABLE=new Set(['40P01','40001']); // deadlock / serialization: retried with the SAME operation ID
export const ROUTINES=Object.freeze({state:'get_account_expedition',bootstrap:'bootstrap_account_expedition',command:'apply_account_expedition_command'});
const PURPOSE=Object.freeze({[ROUTINES.state]:'STATE',[ROUTINES.bootstrap]:'BOOTSTRAP',[ROUTINES.command]:'COMMAND'});

/** @typedef {string|number|boolean|null|JsonValue[]|{[key:string]:JsonValue}} JsonValue */

class Rejection extends Error{constructor(code,reason){super(code);this.code=code;this.reason=reason}}
const reject=(code,reason)=>{throw new Rejection(code,reason)};

export function validateEnvelope(body){
  if(!body||typeof body!=='object'||Array.isArray(body))reject('BAD_COMMAND','ENVELOPE');
  for(const key of Object.keys(body))if(!ENVELOPE.includes(key))reject('BAD_COMMAND','UNKNOWN_FIELD'); // includes playerId, gold, xp, hp, loot...
  if(body.contractVersion!==CONTRACT_VERSION)reject('UNSUPPORTED_VERSION','CONTRACT_VERSION');
  if(typeof body.operationId!=='string'||!UUID.test(body.operationId))reject('BAD_COMMAND','OPERATION_ID');
  if(!Number.isInteger(body.expectedRevision)||body.expectedRevision<0||body.expectedRevision>999999999)reject('BAD_COMMAND','EXPECTED_REVISION');
  const p=body.parameters;
  if(!p||typeof p!=='object'||Array.isArray(p))reject('BAD_COMMAND','PARAMETERS');
  if(LOCKED.has(body.type))reject('NOT_YET_UNLOCKED',body.type);
  if(!ALLOWED.has(body.type))reject('BAD_COMMAND','COMMAND_NOT_ALLOWED');
  const keys=Object.keys(p);
  if(body.type==='MOVE'){if(keys.length!==1||!['up','right','down','left'].includes(p.direction))reject('BAD_COMMAND','MOVE_PARAMETERS')}
  else if(keys.length)reject('BAD_COMMAND','UNEXPECTED_PARAMETERS');
  return {contractVersion:body.contractVersion,operationId:body.operationId,expectedRevision:body.expectedRevision,type:body.type,parameters:body.type==='MOVE'?{direction:p.direction}:{}};
}

async function readBounded(request){
  const declared=Number(request.headers.get('content-length'));
  if(Number.isFinite(declared)&&declared>MAX_BODY_BYTES)reject('COMMAND_TOO_LARGE','BODY');
  if(!request.body)return '';
  const reader=request.body.getReader(),chunks=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
    if(size>MAX_BODY_BYTES){try{await reader.cancel()}catch{};reject('COMMAND_TOO_LARGE','BODY')}chunks.push(value)}
  const all=new Uint8Array(size);let o=0;for(const c of chunks){all.set(c,o);o+=c.byteLength}
  return new TextDecoder('utf-8',{fatal:true}).decode(all);
}

function projectDbError(error){
  const m=/^RUINS:([A-Z_]+):([A-Z0-9_]+)$/.exec(String(error?.message??''));
  if(error?.code==='P0001'&&m&&STATUS[m[1]])return new Rejection(m[1],m[2]);
  return new Rejection('INTERNAL_RETRY_SAFE','RETRY'); // never leak SQL text, object names or IDs
}

/**
 * @param {{
 *   verifyUser:(token:string)=>Promise<{id:string}|null>,
 *   signProof:(args:{principalId:string,purpose:string,command:JsonValue})=>Promise<JsonValue>,
 *   db:{call:(routine:string,principalId:string,command:JsonValue,proof:JsonValue)=>Promise<JsonValue>},
 *   allowedOrigins?:string[],
 *   maxRetries?:number,
 *   log?:(entry:unknown)=>void
 * }} options
 */
export function createRuinsExpeditionHandler({verifyUser,signProof,db,allowedOrigins=[],maxRetries=3,log=()=>{}}){
  if(typeof verifyUser!=='function'||typeof signProof!=='function'||typeof db?.call!=='function')throw new Error('RUINS_HANDLER_SEAMS_REQUIRED');
  const origins=new Set(allowedOrigins);
  async function callDb(routine,principal,command){
    for(let attempt=0;;attempt++){
      // 008: a fresh principal assertion (new nonce) for EVERY database attempt, retries included; a proof is
      // never reused. Retrying the same operation ID still returns the original receipt from the database.
      let proof;try{proof=await signProof({principalId:principal,purpose:PURPOSE[routine],command})}catch{reject('INTERNAL_RETRY_SAFE','RETRY')}
      try{return await db.call(routine,principal,command,proof)}
      catch(error){if(RETRYABLE.has(error?.code)&&attempt<maxRetries)continue;throw projectDbError(error)}
    }
  }
  return async function handle(request){
    const origin=request.headers.get('origin');
    const cors=origin&&origins.has(origin)?{'access-control-allow-origin':origin,vary:'Origin'}:{};
    const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...cors}});
    const fail=e=>{const r=e instanceof Rejection?e:new Rejection('INTERNAL_RETRY_SAFE','RETRY');
      if(!(e instanceof Rejection))log({level:'error',kind:'unexpected'}); // no message: may contain secrets/SQL
      return reply(STATUS[r.code],{contractVersion:CONTRACT_VERSION,error:{code:r.code,reason:r.reason}})};
    try{
      if(origin&&!origins.has(origin))reject('BAD_COMMAND','ORIGIN_NOT_ALLOWED'); // CORS is not authorization; fail closed anyway
      const route=new URL(request.url).pathname.replace(/\/+$/,'');
      if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'access-control-allow-methods':'GET, POST','access-control-allow-headers':'authorization, content-type, apikey, x-client-info','access-control-max-age':'600'}});
      const isState=route.endsWith('/state'),isCommand=route.endsWith('/commands');
      if(!(isState&&request.method==='GET')&&!(isCommand&&request.method==='POST'))reject('BAD_COMMAND','ROUTE');
      const auth=request.headers.get('authorization')??'';
      const token=/^Bearer ([A-Za-z0-9._~+/-]+=*)$/.exec(auth)?.[1];
      if(!token)reject('AUTH_REQUIRED','TOKEN');
      let user=null;try{user=await verifyUser(token)}catch{user=null}
      if(!user||typeof user.id!=='string'||!UUID.test(user.id))reject('AUTH_REQUIRED','TOKEN');
      if(isState)return reply(200,await callDb(ROUTINES.state,user.id,null));
      if(!/^application\/json(;|$)/i.test(request.headers.get('content-type')??''))reject('BAD_COMMAND','CONTENT_TYPE');
      const text=await readBounded(request);
      let body;try{body=JSON.parse(text)}catch{reject('BAD_COMMAND','JSON')}
      const command=validateEnvelope(body);
      const receipt=await callDb(command.type==='BOOTSTRAP'?ROUTINES.bootstrap:ROUTINES.command,user.id,command);
      return reply(200,receipt);
    }catch(error){return fail(error)}
  };
}

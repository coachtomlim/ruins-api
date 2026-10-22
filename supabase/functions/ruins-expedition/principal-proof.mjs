// RUINS 001C/008 principal assertion signer: ruins-principal-proof.v1 (source-only candidate).
// Runtime-neutral (WebCrypto), shared by the Edge entry and the offline proof harness. The database re-derives
// and verifies the exact same bytes in ruins_private.verify_principal_proof (see the r2 migration draft).
//
// A proof is minted only AFTER the handler has verified the user with Supabase Auth, is bound to one purpose,
// one principal and (for writes) one exact command, lives at most 30 s, carries a fresh random nonce, and is
// accepted by the database at most once. It never leaves the server: the browser never sees or sends it.

export const PROOF_VERSION='ruins-principal-proof.v1';
export const PROOF_AUDIENCE='ruins-expedition-001c-private';
export const PROOF_FIELDS=Object.freeze(['proofVersion','kid','aud','principalId','purpose','operationId','expectedRevision',
  'commandType','direction','issuedAt','expiresAt','nonce']);
export const MAX_PROOF_TTL_SECONDS=30;
const KID=/^[a-z0-9][a-z0-9._-]{0,31}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// MAC input: the 12 non-MAC fields joined by a single LF, UTF-8, no trailing newline.
export function canonicalProofMessage(fields){
  for(const name of PROOF_FIELDS){const v=fields[name];if(typeof v!=='string'||!/^[\x21-\x7e]{1,64}$/.test(v))throw new Error('RUINS_PROOF_FIELD');}
  return PROOF_FIELDS.map(name=>fields[name]).join('\n');
}

// Binding fields exactly as the database derives them from its own arguments.
export function proofBinding(purpose,command){
  if(purpose==='STATE')return {operationId:'-',expectedRevision:'-',commandType:'-',direction:'-'};
  if(purpose!=='BOOTSTRAP'&&purpose!=='COMMAND')throw new Error('RUINS_PROOF_PURPOSE');
  return {operationId:command.operationId,expectedRevision:String(command.expectedRevision),commandType:command.type,
    direction:command.type==='MOVE'?command.parameters.direction:'-'};
}

const toHex=buf=>Array.from(new Uint8Array(buf),b=>b.toString(16).padStart(2,'0')).join('');

// keyBytes: Uint8Array (>= 32 bytes) from an operator-provisioned server secret. Never logged or returned.
export async function createPrincipalProofSigner({kid,keyBytes,ttlSeconds=20,now=()=>Date.now(),randomUUID=()=>globalThis.crypto.randomUUID(),subtle=globalThis.crypto.subtle}){
  if(!KID.test(String(kid)))throw new Error('RUINS_PROOF_KID');
  if(!(keyBytes instanceof Uint8Array)||keyBytes.byteLength<32||keyBytes.byteLength>128)throw new Error('RUINS_PROOF_KEY');
  if(!Number.isInteger(ttlSeconds)||ttlSeconds<1||ttlSeconds>MAX_PROOF_TTL_SECONDS)throw new Error('RUINS_PROOF_TTL');
  const key=await subtle.importKey('raw',keyBytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return async function sign({principalId,purpose,command=null}){
    if(!UUID.test(principalId))throw new Error('RUINS_PROOF_PRINCIPAL');
    const issuedAt=Math.floor(now()/1000);
    const fields={proofVersion:PROOF_VERSION,kid,aud:PROOF_AUDIENCE,principalId,purpose,...proofBinding(purpose,command),
      issuedAt:String(issuedAt),expiresAt:String(issuedAt+ttlSeconds),nonce:randomUUID()};
    const mac=toHex(await subtle.sign('HMAC',key,new TextEncoder().encode(canonicalProofMessage(fields))));
    return Object.freeze({...fields,mac});
  };
}

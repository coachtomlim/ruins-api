// RUINS_DAILY_EXPEDITION_001C Supabase Edge Function entry — CANDIDATE, SOURCE ONLY.
// STATUS: CONDITIONAL. Not deployed, not executed under Deno in the offline proof (Deno unavailable on
// the proof machine). handler.mjs, which holds all request logic, IS exercised by the offline harness.
//
// Required environment (configured out-of-band by an authorized operator; never committed or logged):
//   SUPABASE_URL, SUPABASE_ANON_KEY  publishable values, used ONLY to verify user tokens via auth.getUser
//   RUINS_BACKEND_DB_URL              Postgres URL for the dedicated `ruins_backend` login (NOT postgres,
//                                     NOT the Supabase service role). Feasibility of a dedicated login through the
//                                     Supabase pooler is UNVERIFIED (see proof result: role/pooler obstacles).
//   RUINS_ALLOWED_ORIGINS             comma-separated exact staging origins
// No service-role key is read or used.
import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import postgres from 'npm:postgres@3.4.9';
import {createRuinsExpeditionHandler,ROUTINES} from './handler.mjs';
import {createPrincipalProofSigner} from './principal-proof.mjs';

// 008 additions (also CONDITIONAL, operator-provisioned out-of-band, never committed or logged):
//   RUINS_PRINCIPAL_PROOF_KID  key id matching an ACTIVE row in ruins_private.principal_proof_key
//   RUINS_PRINCIPAL_PROOF_KEY  base64 of the same >= 32-byte HMAC key; independent of the DB password
const env=(name: string)=>{const v=Deno.env.get(name);if(!v)throw new Error('RUINS_CONFIG_MISSING');return v};
const auth=createClient(env('SUPABASE_URL'),env('SUPABASE_ANON_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
const sql=postgres(env('RUINS_BACKEND_DB_URL'),{max:3,prepare:false,idle_timeout:20});
const signProof=await createPrincipalProofSigner({
  kid:env('RUINS_PRINCIPAL_PROOF_KID'),
  keyBytes:Uint8Array.from(atob(env('RUINS_PRINCIPAL_PROOF_KEY')),c=>c.charCodeAt(0))
});

const handle=createRuinsExpeditionHandler({
  allowedOrigins:env('RUINS_ALLOWED_ORIGINS').split(',').map(s=>s.trim()).filter(Boolean),
  async verifyUser(token: string){
    const {data,error}=await auth.auth.getUser(token); // server-side verification against Supabase Auth
    return error||!data?.user?null:{id:data.user.id};
  },
  signProof,
  db:{
    // Fixed routine names only; each call is its own implicit transaction (commit before success).
    async call(routine: string,principalId: string,command: unknown,proof: unknown){
      if(routine===ROUTINES.state)return (await sql`select ruins_private.get_account_expedition(${principalId}::uuid, ${sql.json(proof)}::jsonb) as r`)[0].r;
      if(routine===ROUTINES.bootstrap)return (await sql`select ruins_private.bootstrap_account_expedition(${principalId}::uuid, ${sql.json(command)}::jsonb, ${sql.json(proof)}::jsonb) as r`)[0].r;
      if(routine===ROUTINES.command)return (await sql`select ruins_private.apply_account_expedition_command(${principalId}::uuid, ${sql.json(command)}::jsonb, ${sql.json(proof)}::jsonb) as r`)[0].r;
      throw new Error('RUINS_UNKNOWN_ROUTINE');
    }
  },
  log:(entry: unknown)=>console.error(JSON.stringify(entry))
});

Deno.serve(handle);

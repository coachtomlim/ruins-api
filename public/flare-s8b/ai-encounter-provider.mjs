// P9 AI Encounter Assist — browser-side provider boundary. No AI provider key, service-role key, or
// other privileged credential is ever read, stored, or transmitted from this module. The browser only
// ever talks to the project's own `suggest-encounter` Edge Function, which holds the provider secret
// server-side (see supabase/functions/suggest-encounter/index.ts). This module never writes to the
// database and never awards anything.
import {AIProviderError, AI_BRIEF_MAX_LENGTH, sanitizePlayerBrief} from './ai-encounter-assist.mjs';

const DEFAULT_TIMEOUT_MS=12000;

export function suggestEncounterEndpoint(functionsBaseUrl){
  const base=String(functionsBaseUrl||'').replace(/\/+$/,'');
  if(!base)throw new AIProviderError('CONFIG_MISSING','Suggestion service is not configured.');
  return `${base}/functions/v1/suggest-encounter`;
}

/**
 * Calls the project's suggest-encounter Edge Function. Sends only the sanitized brief, optional
 * target HP, and the caller's own access token (so the function can rate-limit per user) — never a
 * provider key, never a service-role key.
 */
export async function requestEncounterSuggestion({
  brief,targetHp,accessToken,functionsBaseUrl,apiKey,
  fetchImpl=globalThis.fetch,timeoutMs=DEFAULT_TIMEOUT_MS
}={}){
  const cleanBrief=sanitizePlayerBrief(brief);
  if(cleanBrief.length>AI_BRIEF_MAX_LENGTH)throw new AIProviderError('BRIEF_TOO_LONG','Description is too long.');
  const endpoint=suggestEncounterEndpoint(functionsBaseUrl);
  const controller=typeof AbortController!=='undefined'?new AbortController():null;
  const timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
  let response;
  try{
    response=await fetchImpl(endpoint,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        ...(apiKey?{apikey:apiKey}:{}),
        ...(accessToken?{Authorization:`Bearer ${accessToken}`}:{})
      },
      body:JSON.stringify({brief:cleanBrief,targetHp:Number.isFinite(Number(targetHp))?Number(targetHp):undefined}),
      signal:controller?controller.signal:undefined
    });
  }catch(error){
    if(error?.name==='AbortError')throw new AIProviderError('TIMEOUT','The suggestion service took too long to respond.');
    throw new AIProviderError('NETWORK_ERROR','The suggestion service could not be reached.');
  }finally{
    if(timer)clearTimeout(timer);
  }
  if(!response.ok)throw new AIProviderError('HTTP_ERROR',`The suggestion service returned an error (${response.status}).`);
  let body;
  try{body=await response.json()}
  catch{throw new AIProviderError('INVALID_JSON','The suggestion service returned an unreadable response.')}
  if(body?.error)throw new AIProviderError(body.code||'PROVIDER_ERROR',String(body.error));
  return body?.plan??body;
}

/**
 * A deterministic, network-free stand-in for `requestEncounterSuggestion`, used by tests and by the
 * local/source-backed browser proof when no provider credential is configured. `scriptedResponses`
 * is an array consumed in order (last entry repeats); each entry is either a plan object, a raw string
 * (for malformed-JSON simulation), or a function returning/throwing either.
 */
export function createMockEncounterProvider(scriptedResponses=[]){
  let index=0;
  return async function mockRequestEncounterSuggestion(){
    const entry=scriptedResponses[Math.min(index,scriptedResponses.length-1)];
    index++;
    if(typeof entry==='function')return entry();
    return entry;
  };
}

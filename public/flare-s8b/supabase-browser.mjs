import {createSupabaseAccountAdapter,validateSupabasePublicConfig} from './account-adapter.mjs';

export function createBrowserAccountAdapter({config=globalThis.__FLARE_S8B_PUBLIC_CONFIG__,sdk=globalThis.supabase}={}){
  const publicConfig=validateSupabasePublicConfig({
    url:config?.url,
    publishableKey:config?.publishableKey
  });
  if(typeof sdk?.createClient!=='function')throw new Error('SUPABASE_BROWSER_SDK_REQUIRED');
  const client=sdk.createClient(publicConfig.url,publicConfig.publishableKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
  });
  return createSupabaseAccountAdapter({client});
}

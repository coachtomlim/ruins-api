export const ACCOUNT_CAPABILITIES=Object.freeze([
  'register','signIn','signOut','getMe','getSession','ensureStarterAccount',
  'loadRunnerState','loadProgressionOffers','loadProgressionPurchases','purchaseProgressionOffer',
  'loadDailyLoginStatus','claimDailyLoginBonus',
  'loadDailyTrialStatus','startDailyTrial','loadDailyTrialRun','settleDailyTrial',
  'loadRunnerProgression','loadRunnerProgressionHistory','loadItemCatalog','loadItemOwnership','equipRunnerItem',
  'loadAccountState','loadSavedGoals','saveGoal','claimGuestRun'
]);

const clean=value=>String(value??'').trim();

function normalizeEmailRedirectTo(value){
  const raw=clean(value);
  if(!raw)return '';
  let parsed;
  try{parsed=new URL(raw)}catch{throw new Error('EMAIL_REDIRECT_URL_INVALID')}
  if(!['https:','http:'].includes(parsed.protocol))throw new Error('EMAIL_REDIRECT_URL_INVALID');
  if(parsed.protocol==='http:'&&!['localhost','127.0.0.1','::1'].includes(parsed.hostname))throw new Error('EMAIL_REDIRECT_URL_MUST_USE_HTTPS');
  parsed.hash='';
  parsed.search='';
  return parsed.href;
}

function operationError(operation,error){
  const message=clean(error?.message||error?.code||error)||`${operation} failed`;
  const wrapped=new Error(message);
  wrapped.name='AccountAdapterError';
  wrapped.operation=operation;
  if(error?.code)wrapped.code=error.code;
  return wrapped;
}

function resultData(operation,result){
  if(result?.error)throw operationError(operation,result.error);
  return result?.data??null;
}

function decodeJwtRole(value){
  const parts=clean(value).split('.');
  if(parts.length!==3)return '';
  try{
    const payload=parts[1].replace(/-/g,'+').replace(/_/g,'/');
    const padded=payload.padEnd(Math.ceil(payload.length/4)*4,'=');
    const json=typeof atob==='function'?atob(padded):Buffer.from(padded,'base64').toString('utf8');
    return clean(JSON.parse(json)?.role).toLowerCase();
  }catch{return ''}
}

export function validateSupabasePublicConfig({url,publishableKey}={}){
  const parsed=(()=>{try{return new URL(clean(url))}catch{return null}})();
  if(!parsed||!['https:','http:'].includes(parsed.protocol))throw new Error('SUPABASE_URL_REQUIRED');
  if(parsed.protocol==='http:'&&!['localhost','127.0.0.1','::1'].includes(parsed.hostname))throw new Error('SUPABASE_URL_MUST_USE_HTTPS');
  const key=clean(publishableKey);
  if(!key)throw new Error('SUPABASE_PUBLISHABLE_KEY_REQUIRED');
  if(key.startsWith('sb_secret_')||decodeJwtRole(key)==='service_role')throw new Error('SUPABASE_ADMIN_SECRET_REJECTED');
  if(!key.startsWith('sb_publishable_')&&decodeJwtRole(key)!=='anon')throw new Error('SUPABASE_PUBLIC_KEY_REQUIRED');
  return Object.freeze({url:parsed.origin,publishableKey:key});
}

export function unavailableAccountAdapter(){
  const unavailable=async()=>{throw new Error('ACCOUNT_SERVICE_NOT_CONFIGURED')};
  return Object.freeze({
    available:false,
    provider:'unconfigured',
    register:unavailable,
    signIn:unavailable,
    signOut:unavailable,
    getMe:unavailable,
    getSession:unavailable,
    ensureStarterAccount:unavailable,
    loadRunnerState:unavailable,
    loadProgressionOffers:unavailable,
    loadProgressionPurchases:unavailable,
    purchaseProgressionOffer:unavailable,
    loadDailyLoginStatus:unavailable,
    claimDailyLoginBonus:unavailable,
    loadDailyTrialStatus:unavailable,
    startDailyTrial:unavailable,
    loadDailyTrialRun:unavailable,
    settleDailyTrial:unavailable,
    loadRunnerProgression:unavailable,
    loadRunnerProgressionHistory:unavailable,
    loadItemCatalog:unavailable,
    loadItemOwnership:unavailable,
    equipRunnerItem:unavailable,
    loadAccountState:unavailable,
    loadSavedGoals:unavailable,
    saveGoal:unavailable,
    claimGuestRun:unavailable
  });
}

export function validateAccountAdapter(adapter){
  if(!adapter||typeof adapter!=='object')throw new Error('Account adapter is required');
  for(const capability of ACCOUNT_CAPABILITIES)if(typeof adapter[capability]!=='function')throw new Error(`Account adapter missing ${capability}`);
  return true;
}

export function createSupabaseAccountAdapter({client}={}){
  if(!client?.auth||typeof client.from!=='function'||typeof client.rpc!=='function')throw new Error('SUPABASE_CLIENT_REQUIRED');

  async function getSession(){
    const data=resultData('getSession',await client.auth.getSession());
    return data?.session??null;
  }

  async function getMe(){
    const session=await getSession();
    if(!session?.user)return null;
    return Object.freeze({id:session.user.id,email:session.user.email||'',session});
  }

  async function ensureStarterAccount(){
    const rows=resultData('ensureStarterAccount',await client.rpc('ensure_starter_account'))||[];
    return rows[0]??null;
  }

  async function loadRunnerState(playerRunnerId=null){
    const id=clean(playerRunnerId);
    const state=resultData('loadRunnerState',await client.rpc('get_account_runner_state',{p_player_runner_id:id||null}));
    if(!state||typeof state!=='object'||Array.isArray(state))throw new Error('AUTHORITATIVE_RUNNER_STATE_REQUIRED');
    return Object.freeze({...state});
  }

  async function loadSavedGoals(){
    return resultData('loadSavedGoals',await client.from('saved_goal').select('*').order('created_at',{ascending:false}))||[];
  }

  async function loadProgressionOffers(){
    const rows=resultData('loadProgressionOffers',await client.from('progression_offer_catalog')
      .select('catalog_version,offer_id,kind,stat_key,stat_amount,gold_cost')
      .eq('active',true)
      .order('gold_cost',{ascending:true}))||[];
    return Object.freeze(rows.map(row=>Object.freeze({...row})));
  }

  async function loadProgressionPurchases(playerRunnerId=null){
    let request=client.from('progression_purchase')
      .select('player_runner_id,catalog_version,offer_id,created_at');
    const runnerId=clean(playerRunnerId);
    if(runnerId)request=request.eq('player_runner_id',runnerId);
    const rows=resultData('loadProgressionPurchases',await request.order('created_at',{ascending:false}))||[];
    return Object.freeze(rows.map(row=>Object.freeze({...row})));
  }

  async function purchaseProgressionOffer({playerRunnerId,offerId,idempotencyKey}={}){
    const runnerId=clean(playerRunnerId),authoritativeOfferId=clean(offerId),key=clean(idempotencyKey);
    if(!runnerId||!authoritativeOfferId||!key)throw new Error('RUNNER_OFFER_IDEMPOTENCY_REQUIRED');
    const rows=resultData('purchaseProgressionOffer',await client.rpc('purchase_progression_offer',{
      p_player_runner_id:runnerId,
      p_offer_id:authoritativeOfferId,
      p_idempotency_key:key
    }))||[];
    const purchase=rows[0]??null;
    if(!purchase)throw new Error('AUTHORITATIVE_PURCHASE_RESULT_REQUIRED');
    return Object.freeze({...purchase});
  }

  async function loadDailyLoginStatus(){
    const rows=resultData('loadDailyLoginStatus',await client.rpc('get_daily_login_status'))||[];
    const status=rows[0]??null;
    if(!status)throw new Error('AUTHORITATIVE_DAILY_LOGIN_STATUS_REQUIRED');
    return Object.freeze({...status});
  }

  async function claimDailyLoginBonus(){
    const rows=resultData('claimDailyLoginBonus',await client.rpc('claim_daily_login_bonus'))||[];
    const claim=rows[0]??null;
    if(!claim)throw new Error('AUTHORITATIVE_DAILY_LOGIN_CLAIM_REQUIRED');
    return Object.freeze({...claim});
  }

  async function loadDailyTrialStatus(){
    const rows=resultData('loadDailyTrialStatus',await client.rpc('get_daily_trial_status'))||[];
    const status=rows[0]??null;
    if(!status)throw new Error('AUTHORITATIVE_DAILY_TRIAL_STATUS_REQUIRED');
    return Object.freeze({...status});
  }

  async function startDailyTrial(){
    const rows=resultData('startDailyTrial',await client.rpc('start_daily_trial'))||[];
    const run=rows[0]??null;
    if(!run)throw new Error('AUTHORITATIVE_DAILY_TRIAL_START_REQUIRED');
    return Object.freeze({...run});
  }

  async function loadDailyTrialRun(runId){
    const id=clean(runId);
    if(!id)throw new Error('DAILY_TRIAL_RUN_ID_REQUIRED');
    const row=resultData('loadDailyTrialRun',await client.from('daily_trial_run').select('*').eq('id',id).single());
    if(!row)throw new Error('AUTHORITATIVE_DAILY_TRIAL_RUN_REQUIRED');
    return Object.freeze({...row});
  }

  async function settleDailyTrial(runId){
    const id=clean(runId);
    if(!id)throw new Error('DAILY_TRIAL_RUN_ID_REQUIRED');
    const rows=resultData('settleDailyTrial',await client.rpc('settle_daily_trial',{p_run_id:id}))||[];
    const settlement=rows[0]??null;
    if(!settlement)throw new Error('AUTHORITATIVE_DAILY_TRIAL_SETTLEMENT_REQUIRED');
    return Object.freeze({...settlement});
  }

  async function loadRunnerProgression(playerRunnerId=null){
    const rows=resultData('loadRunnerProgression',await client.rpc('get_runner_progression',{p_player_runner_id:clean(playerRunnerId)||null}))||[];
    const progression=rows[0]??null;
    if(!progression)throw new Error('AUTHORITATIVE_RUNNER_PROGRESSION_REQUIRED');
    return Object.freeze({...progression});
  }

  async function loadRunnerProgressionHistory(playerRunnerId=null,limit=20){
    const rows=resultData('loadRunnerProgressionHistory',await client.rpc('get_runner_progression_history',{p_player_runner_id:clean(playerRunnerId)||null,p_limit:Number(limit)||20}))||[];
    return Object.freeze(rows.map(row=>Object.freeze({...row})));
  }

  async function loadItemCatalog(){
    const rows=resultData('loadItemCatalog',await client.from('runner_item_catalog')
      .select('item_id,slot,display_name,hp_modifier,attack_modifier,defense_modifier'))||[];
    return Object.freeze(rows.map(row=>Object.freeze({...row})));
  }

  async function loadItemOwnership(){
    const rows=resultData('loadItemOwnership',await client.from('runner_item_ownership')
      .select('id,item_id,slot,acquisition_reason,source_ref,revoked_at')
      .is('revoked_at',null))||[];
    return Object.freeze(rows.map(row=>Object.freeze({...row})));
  }

  async function equipRunnerItem({playerRunnerId,ownershipId,slot}={}){
    const runnerId=clean(playerRunnerId),ownership=clean(ownershipId),targetSlot=clean(slot);
    if(!runnerId||!ownership||!targetSlot)throw new Error('RUNNER_OWNERSHIP_SLOT_REQUIRED');
    const rows=resultData('equipRunnerItem',await client.rpc('equip_runner_item',{
      p_player_runner_id:runnerId,p_ownership_id:ownership,p_slot:targetSlot
    }))||[];
    const equip=rows[0]??null;
    if(!equip)throw new Error('AUTHORITATIVE_EQUIP_RESULT_REQUIRED');
    return Object.freeze({...equip});
  }

  async function loadAccountState({playerRunnerId=null}={}){
    const me=await getMe();
    if(!me)throw new Error('AUTH_REQUIRED');
    const profile=resultData('loadProfile',await client.from('player_profile').select('*').eq('id',me.id).single());
    const runnerState=await loadRunnerState(playerRunnerId);
    const ledger=resultData('loadWalletLedger',await client.from('wallet_ledger').select('delta_gold').eq('player_id',me.id))||[];
    const savedGoals=await loadSavedGoals();
    const progressionOffers=await loadProgressionOffers();
    const progressionPurchases=await loadProgressionPurchases(runnerState.player_runner_id);
    const dailyLogin=await loadDailyLoginStatus();
    const dailyTrial=await loadDailyTrialStatus();
    const progression=await loadRunnerProgression(runnerState.player_runner_id);
    const progressionHistory=await loadRunnerProgressionHistory(runnerState.player_runner_id);
    const itemCatalog=await loadItemCatalog();
    const itemOwnership=await loadItemOwnership();
    const goldBalance=ledger.reduce((sum,row)=>sum+(Number(row?.delta_gold)||0),0);
    return Object.freeze({
      identity:Object.freeze({id:me.id,email:me.email}),
      profile:Object.freeze({...profile}),
      runnerState,
      savedGoals:Object.freeze(savedGoals.map(row=>Object.freeze({...row}))),
      progressionOffers,
      progressionPurchases,
      dailyLogin,
      dailyTrial,
      progression,
      progressionHistory,
      itemCatalog,
      itemOwnership,
      goldBalance
    });
  }

  async function bootstrapAuthenticatedAccount(){
    const starter=await ensureStarterAccount();
    const account=await loadAccountState({playerRunnerId:starter?.player_runner_id||null});
    return Object.freeze({starter,account});
  }

  async function register({displayName,email,password,emailRedirectTo}={}){
    const name=clean(displayName),address=clean(email),secret=String(password??'');
    if(!name||!address||!secret)throw new Error('DISPLAY_NAME_EMAIL_PASSWORD_REQUIRED');
    const redirect=normalizeEmailRedirectTo(emailRedirectTo);
    const options={data:{display_name:name}};
    if(redirect)options.emailRedirectTo=redirect;
    const data=resultData('register',await client.auth.signUp({email:address,password:secret,options}));
    if(!data?.session)return Object.freeze({status:'CHECK_EMAIL',pendingConfirmation:true,userId:data?.user?.id??null,session:null});
    const bootstrapped=await bootstrapAuthenticatedAccount();
    return Object.freeze({status:'AUTHENTICATED',pendingConfirmation:false,userId:data.user?.id??null,session:data.session,...bootstrapped});
  }

  async function signIn({email,password}={}){
    const address=clean(email),secret=String(password??'');
    if(!address||!secret)throw new Error('EMAIL_PASSWORD_REQUIRED');
    const data=resultData('signIn',await client.auth.signInWithPassword({email:address,password:secret}));
    if(!data?.session?.user)throw new Error('AUTH_SESSION_REQUIRED');
    const bootstrapped=await bootstrapAuthenticatedAccount();
    return Object.freeze({status:'AUTHENTICATED',session:data.session,userId:data.user?.id??data.session.user.id,...bootstrapped});
  }

  async function signOut(){
    resultData('signOut',await client.auth.signOut({scope:'local'}));
    return true;
  }

  async function saveGoal({senderName,runnerId,targetHp}={}){
    const rows=resultData('saveGoal',await client.rpc('save_account_goal',{
      p_source_sender_name:clean(senderName),p_runner_id:clean(runnerId),p_target_hp:Number(targetHp)
    }))||[];
    const saved=rows[0]??null;
    const goals=await loadSavedGoals();
    return Object.freeze({saved,goals:Object.freeze(goals.map(row=>Object.freeze({...row})))});
  }

  async function claimGuestRun(){throw new Error('PRODUCT_REWARD_CLAIM_NOT_ENABLED')}

  return Object.freeze({
    available:true,provider:'supabase',register,signIn,signOut,getMe,getSession,
    ensureStarterAccount,loadRunnerState,loadProgressionOffers,loadProgressionPurchases,purchaseProgressionOffer,
    loadDailyLoginStatus,claimDailyLoginBonus,
    loadDailyTrialStatus,startDailyTrial,loadDailyTrialRun,settleDailyTrial,
    loadRunnerProgression,loadRunnerProgressionHistory,loadItemCatalog,loadItemOwnership,equipRunnerItem,
    loadAccountState,loadSavedGoals,saveGoal,claimGuestRun
  });
}

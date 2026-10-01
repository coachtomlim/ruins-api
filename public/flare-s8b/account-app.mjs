import {buildAccountReadyViewFromBackend} from './account-ready-view.mjs';
import {createBrowserAccountAdapter} from './supabase-browser.mjs';
import {createStatPurchaseFlow} from './stat-purchase-flow.mjs';
import {loadS3ActorPack} from '../flare-s8a/actors.mjs';
import {startComposedHeroStance} from '../flare-s71/hero-preview.mjs';
import {createPracticeRunnerSnapshot} from './practice-runner-snapshot.mjs';
import {dailyTrialErrorMessage} from './daily-trial.mjs';
import {buildPersistedFriendShareLink,friendShareUrlIsSafe,shareFriendLink,copyFriendLink,whatsappShareUrl,telegramShareUrl} from './friend-share.mjs';
import {releaseIdentityLabel} from './release-identity.mjs';

const PRACTICE_SNAPSHOT_KEY='s8bPracticeSnapshot';
const FRIEND_GOAL_CLAIM_KEY='s8aFriendGoalClaim';
{const badge=document.getElementById('releaseIdentityBadge');if(badge)badge.textContent=releaseIdentityLabel()}
let s7ModelPromise=null;
const loadS7Model=()=>s7ModelPromise??=fetch(new URL('../flare-s7/data/game.json',import.meta.url),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('S7 game model unavailable');return r.json()});
let friendLink=null;

const byId=id=>document.getElementById(id);
const views=['signedOutView','pendingView','loadingView','readyView'];
const runnerPanels=['stats','equipment'];
const hubDestinations=['home','challenges','stats','equipment'];
let adapter=null;
let authSubscription=null;
let recoveryMode=false;
let activeRunnerId=null;
let readyViewModel=null;
let purchaseFlow=null;
let actorPackPromise=null;
let stopRunnerPreview=()=>{};

function organizeHubDestinations(){
  const nav=byId('homeTab')?.closest('.hub-navigation');if(!nav||byId('hubViewport'))return;
  const viewport=document.createElement('div');viewport.id='hubViewport';viewport.className='hub-viewport';nav.after(viewport);
  for(const name of hubDestinations){const panel=document.createElement('section');panel.id=`${name}Destination`;panel.className='hub-destination';panel.dataset.destination=name;panel.hidden=name!=='home';for(const node of [...document.querySelectorAll(`[data-hub-destination="${name}"]`)])panel.append(node);viewport.append(panel)}
}
organizeHubDestinations();

function showView(id){for(const view of views)byId(view).hidden=view!==id}

function appRedirectUrl(){return new URL('./',location.href).href}

function stopRunnerVisual(){
  stopRunnerPreview();
  stopRunnerPreview=()=>{};
}

function supportsStarterVisual(vm){
  const gear=Array.isArray(vm?.gear)?vm.gear:[];
  const bySlot=Object.fromEntries(gear.map(row=>[row.slot,row]));
  return bySlot.weapon?.equipped===true&&bySlot.weapon?.gfx==='club'&&
    bySlot.shield?.equipped===true&&bySlot.shield?.gfx==='buckler'&&
    ['head','chest','hands','legs','feet'].every(slot=>bySlot[slot]?.equipped===false);
}

async function renderRunnerVisual(vm){
  const canvas=byId('runnerHeroCanvas'),status=byId('runnerHeroStatus');
  if(!canvas)return;
  if(!supportsStarterVisual(vm)){
    stopRunnerVisual();
    status.textContent='Runner visual unavailable for this loadout.';
    return;
  }
  try{
    status.textContent='';
    const actors=await (actorPackPromise??=loadS3ActorPack());
    stopRunnerVisual();
    stopRunnerPreview=startComposedHeroStance(canvas,actors);
  }catch(error){
    console.error(error);
    status.textContent='Runner preview unavailable.';
  }
}

function errorMessage(error){
  const message=String(error?.message||error||'Something went wrong');
  if(/SUPABASE_(?:URL|PUBLISHABLE_KEY)_REQUIRED/.test(message))return 'Account service configuration is required.';
  if(/invalid login credentials/i.test(message))return 'Email or password is incorrect.';
  if(/email not confirmed/i.test(message))return 'Confirm your email, then sign in.';
  if(/rate limit/i.test(message))return 'Too many attempts. Please wait and try again.';
  if(/DAILY_LOGIN/i.test(message))return 'Daily Bonus is unavailable. Please try again later.';
  if(/AUTHORITATIVE_|RUNNER_|LOADOUT_/i.test(message))return 'Runner data is unavailable. Please try again later.';
  const cleaned=message.replace(/^AccountAdapterError:\s*/,'');
  // Safety net: this project's own errors are short fixed UPPER_SNAKE_CASE codes (AUTH_REQUIRED,
  // OWNERSHIP_NOT_FOUND, SLOT_MISMATCH, ...) or the plain sentences above. Anything else — a raw
  // Postgres/network error, a stack trace, an unexpected SQL message — must never reach the player
  // verbatim (no SQL keywords, column/relation names, or connection details).
  if(/^[A-Z][A-Z0-9_]*$/.test(cleaned))return cleaned;
  if(/relation|column|syntax error|duplicate key|violates|permission denied for|constraint|ECONNREFUSED|fetch failed|NetworkError/i.test(cleaned))
    return 'Something went wrong. Please try again.';
  return cleaned;
}

function setBusy(form,busy){
  for(const control of form.elements)control.disabled=busy;
  form.setAttribute('aria-busy',String(busy));
}

function selectAuth(mode){
  const create=mode==='create',signin=mode==='signin',reset=mode==='reset';
  recoveryMode=false;
  byId('createForm').hidden=!create;
  byId('signInForm').hidden=!signin;
  byId('resetRequestForm').hidden=!reset;
  byId('recoveryForm').hidden=true;
  byId('authTabs').hidden=false;
  byId('showCreate').setAttribute('aria-selected',String(create));
  byId('showSignIn').setAttribute('aria-selected',String(!create));
  byId('authStatus').textContent='';
  activeRunnerId=null;
  stopRunnerVisual();
  showView('signedOutView');
}

function showPasswordRecovery(){
  recoveryMode=true;
  byId('createForm').hidden=true;
  byId('signInForm').hidden=true;
  byId('resetRequestForm').hidden=true;
  byId('recoveryForm').hidden=false;
  byId('authTabs').hidden=true;
  byId('authStatus').textContent='Choose a new password for your account.';
  activeRunnerId=null;
  stopRunnerVisual();
  showView('signedOutView');
}

function selectHubDestination(name){
  if(!hubDestinations.includes(name))return;
  for(const panel of document.querySelectorAll('.hub-destination'))panel.hidden=panel.dataset.destination!==name;
  for(const node of document.querySelectorAll('[data-hub-destination]'))node.hidden=node.id==='goalCard'&&readyViewModel?.savedGoalLabel==='No saved goal yet';
  for(const destination of hubDestinations)byId(`${destination}Tab`).setAttribute('aria-selected',String(destination===name));
  byId('readyView').dataset.destination=name;
}
function selectRunnerPanel(name){selectHubDestination(name)}

function renderPending(){showView('pendingView')}

function gearSlotIcon(slot){
  const wrap=document.createElement('span');
  wrap.className='gear-slot-visual';
  wrap.setAttribute('aria-hidden','true');
  const icons={
    weapon:'<svg viewBox="0 0 48 48"><path d="M33 5l10 10-20 20-7 2 2-7L38 10zM14 34l-9 9m4-14l10 10"/></svg>',
    shield:'<svg viewBox="0 0 48 48"><path d="M24 5l15 6v11c0 10-6 17-15 21-9-4-15-11-15-21V11z"/></svg>',
    head:'<svg viewBox="0 0 48 48"><path d="M10 27c0-12 6-20 14-20s14 8 14 20v11H10zM15 28h18M24 7v8"/></svg>',
    chest:'<svg viewBox="0 0 48 48"><path d="M15 8l9 5 9-5 8 9-6 7v17H13V24l-6-7z"/></svg>',
    hands:'<svg viewBox="0 0 48 48"><path d="M12 10v17l5 10h9V22l-3-12h-4v12h-3V10zM29 13v20l4 6h7V19l-3-6z"/></svg>',
    legs:'<svg viewBox="0 0 48 48"><path d="M14 7h20l-2 15-3 20h-8l-1-17-1 17h-8l3-20z"/></svg>',
    feet:'<svg viewBox="0 0 48 48"><path d="M12 10h10v19l-4 9H5v-7l7-5zM27 10h9v16l7 5v7H30l-3-9z"/></svg>'
  };
  wrap.innerHTML=icons[slot]||icons.chest;
  return wrap;
}

function gearCell(slot){
  const cell=document.createElement('div');
  cell.className=`gear-slot${slot.equipped?' equipped':' empty'}`;
  cell.dataset.slot=slot.slot;
  if(slot.gfx)cell.dataset.gfx=slot.gfx;
  const visual=gearSlotIcon(slot.slot);
  const label=document.createElement('span');label.className='gear-slot-label';label.textContent=slot.label;
  const value=document.createElement('strong');value.textContent=slot.equipped?slot.itemName:'EMPTY';
  const modifier=document.createElement('small');modifier.textContent=slot.equipped?slot.modifierLabel:'READY FOR GEAR';
  cell.append(visual,label,value,modifier);
  return cell;
}

function renderProgression(summary){
  byId('progressionLevel').textContent=summary.levelLabel;
  byId('progressionXp').textContent=summary.xpLabel;
  byId('progressionFill').style.width=summary.progressPercent+'%';
}

function unlockRow(unlock){
  const row=document.createElement('article');row.className='unlock-row';
  const copy=document.createElement('div');
  const name=document.createElement('strong');name.textContent=unlock.name;
  const detail=document.createElement('small');detail.textContent=unlock.slot.toUpperCase()+' · '+unlock.effectLabel;
  copy.append(name,detail);
  const button=document.createElement('button');button.type='button';button.className='unlock-action';
  button.textContent=unlock.action.label;button.disabled=unlock.action.disabled;button.dataset.state=unlock.action.state;
  button.addEventListener('click',()=>onUnlockAction(unlock));
  row.append(copy,button);
  return row;
}

async function onUnlockAction(unlock){
  if(unlock.action.state==='owned'){
    byId('purchaseStatus').textContent='Equipping…';
    try{
      await adapter.equipRunnerItem({playerRunnerId:activeRunnerId,ownershipId:unlock.ownershipId,slot:unlock.slot});
      await refreshReady();
      byId('purchaseStatus').textContent=unlock.name+' equipped.';
    }catch(error){
      byId('purchaseStatus').textContent=errorMessage(error);
    }
    return;
  }
  if(unlock.action.state!=='available')return;
  openPurchaseConfirmation(unlock);
}

function historyRow(entry){
  const li=document.createElement('li');
  const badge=document.createElement('b');badge.textContent=entry.badge;
  const label=document.createElement('span');label.textContent=entry.label;
  const when=document.createElement('small');when.textContent=new Date(entry.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric'});
  li.append(badge,label,when);
  return li;
}

function trainingOfferCell(offer){
  const cell=document.createElement('article');cell.className='training-offer';
  const name=document.createElement('strong');name.textContent=offer.name;
  const effect=document.createElement('span');effect.textContent=offer.effectLabel;
  const price=document.createElement('small');price.textContent=offer.priceLabel;
  const button=document.createElement('button');button.type='button';button.className='purchase-action';
  button.textContent=offer.action.label;button.disabled=offer.action.disabled;
  button.dataset.offerId=offer.offerId;button.dataset.state=offer.action.state;
  button.addEventListener('click',()=>openPurchaseConfirmation(offer));
  cell.append(name,effect,price,button);
  return cell;
}

function renderDailyLogin(dailyLogin){
  byId('dailyLoginStreak').textContent=dailyLogin.streakLabel;
  byId('dailyLoginDetail').textContent=dailyLogin.detail;
  byId('dailyLoginReset').textContent=dailyLogin.resetLabel;
  const button=byId('dailyLoginClaim');
  button.textContent=dailyLogin.actionLabel;
  button.disabled=dailyLogin.actionDisabled;
}

function renderDailyTrial(trial){
  const card=byId('dailyTrialCard'),button=byId('dailyTrialAction');
  if(!trial){
    card.dataset.state='unavailable';
    byId('dailyTrialRoom').textContent='—';
    byId('dailyTrialState').textContent='UNAVAILABLE';
    byId('dailyTrialDetail').textContent='Daily Trial status is unavailable. Please try again later.';
    button.textContent='DAILY TRIAL UNAVAILABLE';button.disabled=true;
    return;
  }
  card.dataset.state=trial.state.toLowerCase();
  byId('dailyTrialRoom').textContent=trial.roomName;
  byId('dailyTrialState').textContent=trial.statusLabel;
  byId('dailyTrialDetail').textContent=trial.detail;
  button.textContent=trial.actionLabel;
  button.disabled=trial.actionDisabled;
}

function dailyTrialPage(runId){return `daily-trial.html?run=${encodeURIComponent(runId)}`}

async function runDailyTrialAction(){
  const trial=readyViewModel?.dailyTrial,button=byId('dailyTrialAction'),status=byId('dailyTrialStatus');
  if(!trial||trial.actionDisabled)return;
  button.disabled=true;
  status.textContent='';
  try{
    if(trial.actionKind==='start'){
      button.textContent='STARTING…';
      const run=await adapter.startDailyTrial();
      location.href=dailyTrialPage(run.run_id);
      return;
    }
    if(trial.actionKind==='continue'){
      location.href=dailyTrialPage(trial.runId);
      return;
    }
    if(trial.actionKind==='claim'){
      button.textContent='CLAIMING…';
      const claim=await adapter.settleDailyTrial(trial.runId);
      await refreshReady();
      byId('dailyTrialStatus').textContent=claim.duplicate===true?'ALREADY CLAIMED':`+${Number(claim.reward_gold)||0} GOLD ADDED`;
    }
  }catch(error){
    const feedback=dailyTrialErrorMessage(error);
    if(feedback.kind==='wait'){try{await refreshReady()}catch{}}
    renderDailyTrial(readyViewModel?.dailyTrial);
    byId('dailyTrialStatus').textContent=feedback.message;
  }
}

function resetFriendShare(){
  friendLink=null;
  byId('friendShareCard').dataset.state='idle';
  byId('friendShareResult').hidden=true;
  byId('friendShareUrl').value='';
  byId('friendShareAnchor').href='#';
  byId('friendShareAnchor').textContent='—';
  for(const id of ['friendShareOpen','friendShareCopy','friendShareWhatsapp','friendShareTelegram'])byId(id).hidden=true;
  byId('friendShareGenerate').hidden=false;byId('friendShareGenerate').disabled=false;byId('friendShareGenerate').textContent='PUBLISH FRIEND CHALLENGE';
  byId('friendShareStatus').textContent='';
}

function exposeFriendLink(built,message='Friend link ready.'){
  friendLink=built;
  byId('friendShareCard').dataset.state='ready';
  byId('friendShareResult').hidden=false;
  byId('friendShareUrl').value=built.url;
  byId('friendShareAnchor').href=built.url;
  byId('friendShareAnchor').textContent=built.url;
  for(const id of ['friendShareOpen','friendShareCopy','friendShareWhatsapp','friendShareTelegram'])byId(id).hidden=false;
  byId('friendShareGenerate').hidden=false;
  byId('friendShareGenerate').disabled=false;
  byId('friendShareGenerate').textContent='PUBLISH ANOTHER DESIGN';
  byId('friendShareStatus').textContent=message;
}

function renderBuilderProgression(builder){
  if(!builder){
    byId('builderLevel').textContent='BUILDER PROGRESSION';
    byId('builderXp').textContent='UNAVAILABLE';
    byId('builderPublished').textContent='—';
    byId('builderProgressionFill').style.width='0%';
    return;
  }
  byId('builderLevel').textContent=builder.levelLabel;
  byId('builderXp').textContent=builder.xpLabel;
  byId('builderPublished').textContent=builder.publishedLabel;
  byId('builderProgressionFill').style.width=builder.progressPercent+'%';
}

function challengeJournalRow(challenge){
  const row=document.createElement('article');row.className='challenge-journal-row';
  const copy=document.createElement('div');
  const target=document.createElement('strong');target.textContent=challenge.targetLabel;
  const detail=document.createElement('small');detail.textContent=`${challenge.runnerId} · ${challenge.inviteCode} · ${challenge.dateLabel} · ${challenge.resultCount} RESULT${challenge.resultCount===1?'':'S'}`;
  copy.append(target,detail);
  const button=document.createElement('button');button.type='button';button.textContent='RE-SHARE';
  button.addEventListener('click',()=>loadJournalChallenge(challenge));
  row.append(copy,button);
  return row;
}

function renderChallengeJournal(rows){
  const journal=Array.isArray(rows)?rows:[];
  byId('challengeJournalList').replaceChildren(...journal.map(challengeJournalRow));
  byId('challengeJournalEmpty').hidden=journal.length>0;
}

function challengeActivityRow(result){
  const row=document.createElement('article');row.className=`challenge-activity-row${result.owner_seen_at?'':' unread'}`;
  const copy=document.createElement('div');
  const title=document.createElement('strong');title.textContent=result.terminal_status==='cleared'?'NEW CHALLENGE RESULT':'HERO DID NOT CLEAR';
  const detail=document.createElement('small');detail.textContent=result.terminal_status==='cleared'?`Your Runner finished at ${Math.round(Number(result.finishing_hp_percent))}% HP · Score ${Math.round(Number(result.score))}`:'A friend attempted your challenge, but your Runner did not clear the dungeon.';
  copy.append(title,detail);
  const button=document.createElement('button');button.type='button';button.textContent='VIEW RESULT';button.addEventListener('click',()=>openResultDetail(result));
  row.append(copy,button);return row;
}
function renderChallengeActivity(rows){
  const activity=Array.isArray(rows)?rows:[],unread=activity.filter(row=>!row.owner_seen_at).length;
  byId('challengeActivityList').replaceChildren(...activity.slice(0,5).map(challengeActivityRow));
  byId('challengeActivityEmpty').hidden=activity.length>0;
  byId('challengeActivityCount').textContent=unread?`${unread} NEW RESULT${unread===1?'':'S'}`:'NO NEW RESULTS';
  byId('challengeUnreadBadge').hidden=unread===0;byId('challengeUnreadBadge').textContent=unread?`${unread} NEW RESULT${unread===1?'':'S'}`:'';
}
async function openResultDetail(result){
  const actual=Math.round(Number(result.finishing_hp_percent)),target=Number(result.target_hp),difference=Math.abs(actual-target);
  const fields=[['TARGET',`${target}% HP`],['FINISHED',`${actual}% HP`],['DIFFERENCE',`${difference} points from target`],['SCORE',String(Math.round(Number(result.score)))],['STATUS',result.terminal_status==='cleared'?'CLEARED':'FAILED'],['ROOM',result.room_id],['ENCOUNTER',result.encounter_summary||'Recorded encounter'],['HERO GOLD',`${Number(result.hero_gold)||0} Gold`],['BUILDER GOLD',`${Number(result.builder_gold)||0} Gold`],['COMPLETED',new Date(result.completed_at).toLocaleString()]];
  byId('resultDetailFields').replaceChildren(...fields.map(([label,value])=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;div.append(dt,dd);return div}));
  byId('resultDetailDialog').hidden=false;
  if(!result.owner_seen_at){await adapter.markBuilderChallengeResultRead(result.result_id);await refreshReady();selectHubDestination('challenges')}
}

async function loadJournalChallenge(challenge){
  try{
    const model=await loadS7Model();
    const built=buildPersistedFriendShareLink({baseUrl:new URL('./',location.href).href,challenge,model});
    if(!friendShareUrlIsSafe(built.url))throw new Error('FRIEND_SHARE_URL_UNSAFE');
    byId('friendShareTarget').value=String(challenge.targetHp);
    exposeFriendLink(built,'Challenge loaded from your journal.');
  }catch(error){
    byId('friendShareStatus').textContent=errorMessage(error);
  }
}

async function generateFriendLink(){
  const button=byId('friendShareGenerate');
  button.disabled=true;button.textContent='PUBLISHING…';
  byId('friendShareStatus').textContent='';
  try{
    const targetHp=Number(byId('friendShareTarget').value);
    const challenge=await adapter.createBuilderChallenge(targetHp);
    const model=await loadS7Model();
    const built=buildPersistedFriendShareLink({
      baseUrl:new URL('./',location.href).href,
      challenge,
      model
    });
    if(!friendShareUrlIsSafe(built.url))throw new Error('FRIEND_SHARE_URL_UNSAFE');
    await refreshReady();
    selectHubDestination('challenges');
    const awarded=Number(challenge.builder_xp_awarded)||0;
    exposeFriendLink(built,challenge.duplicate===true?'Challenge already in your journal.':`CHALLENGE PUBLISHED · +${awarded} BUILDER XP`);
  }catch(error){
    byId('friendShareStatus').textContent=errorMessage(error);
    button.disabled=false;button.textContent='PUBLISH FRIEND CHALLENGE';
  }
}

async function openFriendShare(){
  if(!friendLink)return;
  try{
    const result=await shareFriendLink({url:friendLink.url,title:friendLink.share.title,text:friendLink.share.text});
    if(result.method==='native'&&result.shared){
      byId('friendShareStatus').textContent='Shared.';
      return;
    }
    if(result.cancelled){
      byId('friendShareStatus').textContent='Share cancelled. Your friend link is still ready below.';
      return;
    }
    const copied=await copyFriendLink(friendLink.url);
    byId('friendShareStatus').textContent=copied.copied
      ?'FRIEND LINK COPIED · paste it into WhatsApp, email or any message.'
      :'Your friend link is ready below. Copy it and send it in any message.';
    if(!copied.copied){byId('friendShareUrl').focus();byId('friendShareUrl').select()}
  }catch(error){
    byId('friendShareStatus').textContent=errorMessage(error);
  }
}

async function copyFriendShare(){
  if(!friendLink)return;
  try{
    const result=await copyFriendLink(friendLink.url);
    byId('friendShareStatus').textContent=result.copied?'LINK COPIED':'Could not copy automatically — the link is selected below, copy it manually.';
    if(!result.copied){byId('friendShareUrl').focus();byId('friendShareUrl').select()}
  }catch(error){
    byId('friendShareStatus').textContent=errorMessage(error);
  }
}

function openFriendShareWhatsapp(){
  if(!friendLink)return;
  window.open(whatsappShareUrl(friendLink.url,friendLink.share.text),'_blank','noopener');
}

function openFriendShareTelegram(){
  if(!friendLink)return;
  window.open(telegramShareUrl(friendLink.url,friendLink.share.text),'_blank','noopener');
}

function closePurchaseConfirmation(){
  purchaseFlow?.cancel();
  byId('purchaseDialog').hidden=true;
}

function openPurchaseConfirmation(offer){
  if(!purchaseFlow?.begin(offer,activeRunnerId))return;
  byId('confirmOfferName').textContent=offer.name;
  byId('confirmOfferEffect').textContent=offer.effectLabel;
  byId('confirmOfferCost').textContent=offer.priceLabel;
  byId('confirmBalance').textContent=String(readyViewModel.goldBalance);
  byId('confirmRemaining').textContent=`${readyViewModel.goldBalance-offer.goldCost} Gold`;
  byId('confirmPurchase').textContent='CONFIRM PURCHASE';
  byId('confirmPurchase').disabled=false;
  byId('cancelPurchase').disabled=false;
  byId('purchaseDialogStatus').textContent='';
  byId('purchaseStatus').textContent='';
  byId('purchaseDialog').hidden=false;
  byId('confirmPurchase').focus();
}

async function refreshReady(){
  renderReady(await adapter.loadAccountState({playerRunnerId:activeRunnerId}));
}

async function claimDailyLogin(){
  const button=byId('dailyLoginClaim');
  if(readyViewModel?.dailyLogin?.actionDisabled)return;
  button.disabled=true;
  button.textContent='CLAIMING…';
  byId('dailyLoginStatus').textContent='Claiming your server-authoritative Daily Bonus…';
  try{
    const claim=await adapter.claimDailyLoginBonus();
    await refreshReady();
    byId('dailyLoginStatus').textContent=claim.duplicate===true?'ALREADY CLAIMED TODAY':`+${Number(claim.gold_awarded)||0} GOLD ADDED`;
  }catch(error){
    byId('dailyLoginStatus').textContent=errorMessage(error);
    if(!readyViewModel?.dailyLogin?.actionDisabled){
      button.disabled=false;
      button.textContent=readyViewModel.dailyLogin.actionLabel;
    }
  }
}

async function confirmPurchase(){
  const button=byId('confirmPurchase');
  if(purchaseFlow.inFlight)return;
  button.disabled=true;button.textContent='PROCESSING…';
  byId('cancelPurchase').disabled=true;
  byId('purchaseDialogStatus').textContent='Waiting for authoritative account state…';
  const result=await purchaseFlow.confirm();
  if(result.status==='success'){
    byId('purchaseStatus').textContent='RUNNER UPGRADED';
    byId('purchaseDialog').hidden=true;
    return;
  }
  if(result.status==='error'){
    byId('purchaseStatus').textContent=result.feedback.message;
    if(result.feedback.kind==='unknown'){
      button.disabled=false;button.textContent='RETRY PURCHASE';
      byId('cancelPurchase').disabled=false;
      byId('purchaseDialogStatus').textContent=result.feedback.message;
    }else byId('purchaseDialog').hidden=true;
  }
}

async function claimPendingFriendGoal(){
  let raw=null;
  try{raw=sessionStorage.getItem(FRIEND_GOAL_CLAIM_KEY)}catch{return}
  if(!raw)return;
  try{sessionStorage.removeItem(FRIEND_GOAL_CLAIM_KEY)}catch{}
  let goal=null;
  try{goal=JSON.parse(raw)}catch{return}
  const senderName=String(goal?.senderName||''),runnerId=String(goal?.runnerId||''),targetHp=Number(goal?.targetHp);
  if(!senderName||!runnerId||!Number.isFinite(targetHp))return;
  try{
    await adapter.saveGoal({senderName,runnerId,targetHp});
    await refreshReady();
    byId('purchaseStatus').textContent="Your friend's goal has been saved.";
  }catch(error){
    console.error(error);
  }
}

function renderReady(account){
  byId('dailyLoginStatus').textContent='';
  byId('dailyTrialStatus').textContent='';
  const vm=buildAccountReadyViewFromBackend(account);
  readyViewModel=vm;
  activeRunnerId=vm.runner.id;
  byId('displayName').textContent=vm.displayName;
  byId('accountEmail').textContent=vm.email;
  byId('goldBalance').textContent=String(vm.goldBalance);
  renderDailyLogin(vm.dailyLogin);
  renderDailyTrial(vm.dailyTrial);
  resetFriendShare();
  renderBuilderProgression(vm.builderProgression);
  renderChallengeJournal(vm.challengeJournal);
  renderChallengeActivity(vm.challengeActivity);
  byId('runnerName').textContent=vm.runner.name;
  byId('effectiveHp').textContent=String(vm.runner.stats.hp);
  byId('effectiveAttack').textContent=String(vm.runner.stats.attack);
  byId('effectiveDefense').textContent=String(vm.runner.stats.defense);
  const hasGoal=vm.savedGoalLabel!=='No saved goal yet';
  byId('goalCard').hidden=!hasGoal;
  if(hasGoal)byId('savedGoalLabel').textContent=vm.savedGoalLabel;
  byId('flareLoadout').replaceChildren(...vm.gear.map(gearCell));
  byId('trainingOffers').replaceChildren(...vm.progressionOffers.map(trainingOfferCell));
  renderProgression(vm.progressionSummary);
  byId('unlockList').replaceChildren(...vm.equipmentUnlocks.map(unlockRow));
  byId('historyList').replaceChildren(...vm.history.map(historyRow));
  selectHubDestination('home');
  showView('readyView');
  void renderRunnerVisual(vm);
  void claimPendingFriendGoal();
}

async function restoreSession(){
  if(!adapter||recoveryMode)return;
  const session=await adapter.getSession();
  if(!session?.user){selectAuth('create');return}
  showView('loadingView');
  const starter=await adapter.ensureStarterAccount();
  renderReady(await adapter.loadAccountState({playerRunnerId:starter?.player_runner_id||null}));
}

byId('showCreate').addEventListener('click',()=>selectAuth('create'));
byId('showSignIn').addEventListener('click',()=>selectAuth('signin'));
byId('pendingSignIn').addEventListener('click',()=>selectAuth('signin'));
byId('forgotPassword').addEventListener('click',()=>selectAuth('reset'));
byId('resetBackToSignIn').addEventListener('click',()=>selectAuth('signin'));
for(const panel of runnerPanels)byId(`${panel}Tab`).addEventListener('click',()=>selectRunnerPanel(panel));
for(const destination of ['home','challenges'])byId(`${destination}Tab`).addEventListener('click',()=>selectHubDestination(destination));
byId('closeResultDetail').addEventListener('click',()=>{byId('resultDetailDialog').hidden=true});
byId('cancelPurchase').addEventListener('click',closePurchaseConfirmation);
byId('confirmPurchase').addEventListener('click',confirmPurchase);
byId('dailyLoginClaim').addEventListener('click',claimDailyLogin);
byId('dailyTrialAction').addEventListener('click',runDailyTrialAction);
byId('friendShareGenerate').addEventListener('click',generateFriendLink);
byId('friendShareOpen').addEventListener('click',openFriendShare);
byId('friendShareCopy').addEventListener('click',copyFriendShare);
byId('friendShareWhatsapp').addEventListener('click',openFriendShareWhatsapp);
byId('friendShareTelegram').addEventListener('click',openFriendShareTelegram);

byId('createForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget,data=new FormData(form);
  setBusy(form,true);byId('authStatus').textContent='Creating your account…';
  try{
    const result=await adapter.register({displayName:data.get('displayName'),email:data.get('email'),password:data.get('password'),emailRedirectTo:appRedirectUrl()});
    form.reset();
    if(result.pendingConfirmation)renderPending();else renderReady(result.account);
  }catch(error){byId('authStatus').textContent=errorMessage(error)}finally{setBusy(form,false)}
});

byId('signInForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget,data=new FormData(form);
  setBusy(form,true);byId('authStatus').textContent='Loading your account…';
  try{
    const result=await adapter.signIn({email:data.get('email'),password:data.get('password')});
    form.reset();renderReady(result.account);
  }catch(error){byId('authStatus').textContent=errorMessage(error)}finally{setBusy(form,false)}
});

byId('resetRequestForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget,data=new FormData(form);
  setBusy(form,true);byId('authStatus').textContent='Sending reset link…';
  try{
    await adapter.requestPasswordReset({email:data.get('email'),redirectTo:appRedirectUrl()});
    form.reset();
    byId('authStatus').textContent='If that email has an account, a password reset link has been sent.';
  }catch(error){
    const message=errorMessage(error);
    byId('authStatus').textContent=/rate limit/i.test(String(error?.message||''))?'Too many reset attempts. Please wait and try again.':message;
  }finally{setBusy(form,false)}
});

byId('recoveryForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget,data=new FormData(form);
  const password=String(data.get('password')??''),confirmPassword=String(data.get('confirmPassword')??'');
  if(password.length<8){byId('authStatus').textContent='Use at least 8 characters.';return}
  if(password!==confirmPassword){byId('authStatus').textContent='The passwords do not match.';return}
  setBusy(form,true);byId('authStatus').textContent='Updating password…';
  try{
    await adapter.updatePassword({password});
    form.reset();
    recoveryMode=false;
    showView('loadingView');
    const starter=await adapter.ensureStarterAccount();
    renderReady(await adapter.loadAccountState({playerRunnerId:starter?.player_runner_id||null}));
    byId('purchaseStatus').textContent='Password updated successfully.';
  }catch(error){byId('authStatus').textContent=errorMessage(error)}finally{setBusy(form,false)}
});

byId('signOut').addEventListener('click',async()=>{
  byId('signOut').disabled=true;
  try{await adapter.signOut();selectAuth('signin')}catch(error){byId('purchaseStatus').textContent=errorMessage(error)}finally{byId('signOut').disabled=false}
});

byId('testYourRunner').addEventListener('click',async()=>{
  try{
    let accessToken=null;
    try{const session=await adapter?.getSession();accessToken=session?.access_token||null}catch{accessToken=null}
    const snapshot=createPracticeRunnerSnapshot(readyViewModel,{accessToken});
    sessionStorage.setItem(PRACTICE_SNAPSHOT_KEY,JSON.stringify(snapshot));
    location.href='practice.html';
  }catch(error){
    byId('purchaseStatus').textContent=errorMessage(error);
  }
});

try{
  adapter=createBrowserAccountAdapter();
  purchaseFlow=createStatPurchaseFlow({purchase:payload=>adapter.purchaseProgressionOffer(payload),refresh:refreshReady});
  authSubscription=adapter.subscribeAuthStateChange((event)=>{
    if(event==='PASSWORD_RECOVERY')showPasswordRecovery();
  });
  await restoreSession();
}catch(error){
  selectAuth('create');
  byId('authStatus').textContent=errorMessage(error);
}

addEventListener('pagehide',()=>authSubscription?.unsubscribe?.(),{once:true});

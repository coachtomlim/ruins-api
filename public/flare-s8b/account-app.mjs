import {buildAccountReadyViewFromBackend} from './account-ready-view.mjs';
import {createBrowserAccountAdapter} from './supabase-browser.mjs';
import {createStatPurchaseFlow} from './stat-purchase-flow.mjs';
import {loadS3ActorPack} from '../flare-s8a/actors.mjs';
import {startComposedHeroStance} from '../flare-s71/hero-preview.mjs';
import {createPracticeRunnerSnapshot} from './practice-runner-snapshot.mjs';
import {dailyTrialErrorMessage} from './daily-trial.mjs';
import {buildPersistedFriendShareLink,friendShareUrlIsSafe,shareFriendLink,copyFriendLink,whatsappShareUrl,telegramShareUrl} from './friend-share.mjs';

const PRACTICE_SNAPSHOT_KEY='s8bPracticeSnapshot';
let s7ModelPromise=null;
const loadS7Model=()=>s7ModelPromise??=fetch(new URL('../flare-s7/data/game.json',import.meta.url),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('S7 game model unavailable');return r.json()});
let friendLink=null;

const byId=id=>document.getElementById(id);
const views=['signedOutView','pendingView','loadingView','readyView'];
const runnerPanels=['stats','equipment','armor','history'];
let adapter=null;
let activeRunnerId=null;
let readyViewModel=null;
let purchaseFlow=null;
let actorPackPromise=null;
let stopRunnerPreview=()=>{};

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
  return message.replace(/^AccountAdapterError:\s*/,'');
}

function setBusy(form,busy){
  for(const control of form.elements)control.disabled=busy;
  form.setAttribute('aria-busy',String(busy));
}

function selectAuth(mode){
  const create=mode==='create';
  byId('createForm').hidden=!create;
  byId('signInForm').hidden=create;
  byId('showCreate').setAttribute('aria-selected',String(create));
  byId('showSignIn').setAttribute('aria-selected',String(!create));
  byId('authStatus').textContent='';
  activeRunnerId=null;
  stopRunnerVisual();
  showView('signedOutView');
}

function selectRunnerPanel(name){
  if(!runnerPanels.includes(name))return;
  for(const panel of runnerPanels){
    byId(`${panel}Panel`).hidden=panel!==name;
    byId(`${panel}Tab`).setAttribute('aria-selected',String(panel===name));
  }
}

function renderPending(){showView('pendingView')}

function gearCell(slot){
  const cell=document.createElement('div');
  cell.className=`gear-slot${slot.equipped?' equipped':' empty'}`;
  cell.dataset.slot=slot.slot;
  const label=document.createElement('span');label.textContent=slot.label;
  const value=document.createElement('strong');value.textContent=slot.equipped?slot.itemName:'EMPTY';
  const modifier=document.createElement('small');modifier.textContent=slot.equipped?slot.modifierLabel:'READY FOR GEAR';
  cell.append(label,value,modifier);
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
  byId('friendShareUrl').hidden=true;
  byId('friendShareUrl').value='';
  for(const id of ['friendShareOpen','friendShareCopy','friendShareWhatsapp','friendShareTelegram'])byId(id).hidden=true;
  byId('friendShareGenerate').hidden=false;byId('friendShareGenerate').disabled=false;byId('friendShareGenerate').textContent='PUBLISH FRIEND CHALLENGE';
  byId('friendShareStatus').textContent='';
}

function exposeFriendLink(built,message='Friend link ready.'){
  friendLink=built;
  byId('friendShareCard').dataset.state='ready';
  byId('friendShareUrl').hidden=false;
  byId('friendShareUrl').value=built.url;
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
  const detail=document.createElement('small');detail.textContent=`${challenge.runnerId} · ${challenge.dateLabel}`;
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
    if(result.method==='native'&&result.shared)byId('friendShareStatus').textContent='Shared.';
    else if(result.cancelled)byId('friendShareStatus').textContent='Link is ready to copy or share anytime.';
    else byId('friendShareStatus').textContent='Sharing is not available on this device. Use Copy Link instead.';
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
  byId('runnerName').textContent=vm.runner.name;
  byId('runnerHp').textContent=String(vm.runner.stats.hp);
  byId('runnerAttack').textContent=String(vm.runner.stats.attack);
  byId('runnerDefense').textContent=String(vm.runner.stats.defense);
  byId('baseHp').textContent=String(vm.runner.baseStats.hp);
  byId('baseAttack').textContent=String(vm.runner.baseStats.attack);
  byId('baseDefense').textContent=String(vm.runner.baseStats.defense);
  byId('effectiveHp').textContent=String(vm.runner.stats.hp);
  byId('effectiveAttack').textContent=String(vm.runner.stats.attack);
  byId('effectiveDefense').textContent=String(vm.runner.stats.defense);
  const hasGoal=vm.savedGoalLabel!=='No saved goal yet';
  byId('goalCard').hidden=!hasGoal;
  if(hasGoal)byId('savedGoalLabel').textContent=vm.savedGoalLabel;
  byId('flareLoadout').replaceChildren(...vm.gear.map(gearCell));
  byId('armorGrid').replaceChildren(...vm.armor.map(gearCell));
  byId('trainingOffers').replaceChildren(...vm.progressionOffers.map(trainingOfferCell));
  renderProgression(vm.progressionSummary);
  byId('unlockList').replaceChildren(...vm.equipmentUnlocks.map(unlockRow));
  byId('historyList').replaceChildren(...vm.history.map(historyRow));
  selectRunnerPanel('stats');
  showView('readyView');
  void renderRunnerVisual(vm);
}

async function restoreSession(){
  if(!adapter)return;
  const session=await adapter.getSession();
  if(!session?.user){selectAuth('create');return}
  showView('loadingView');
  const starter=await adapter.ensureStarterAccount();
  renderReady(await adapter.loadAccountState({playerRunnerId:starter?.player_runner_id||null}));
}

byId('showCreate').addEventListener('click',()=>selectAuth('create'));
byId('showSignIn').addEventListener('click',()=>selectAuth('signin'));
byId('pendingSignIn').addEventListener('click',()=>selectAuth('signin'));
for(const panel of runnerPanels)byId(`${panel}Tab`).addEventListener('click',()=>selectRunnerPanel(panel));
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
  await restoreSession();
}catch(error){
  selectAuth('create');
  byId('authStatus').textContent=errorMessage(error);
}

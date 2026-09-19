import {buildAccountReadyViewFromBackend} from './account-ready-view.mjs';
import {createBrowserAccountAdapter} from './supabase-browser.mjs';
import {createStatPurchaseFlow} from './stat-purchase-flow.mjs';
import {loadS3ActorPack} from '../flare-s8a/actors.mjs';
import {startComposedHeroStance} from '../flare-s71/hero-preview.mjs';
import {createPracticeRunnerSnapshot} from './practice-runner-snapshot.mjs';

const PRACTICE_SNAPSHOT_KEY='s8bPracticeSnapshot';

const byId=id=>document.getElementById(id);
const views=['signedOutView','pendingView','loadingView','readyView'];
const runnerPanels=['stats','equipment','armor'];
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
    byId('dailyLoginStatus').textContent=`+${Number(claim.gold_awarded)||0} GOLD ADDED`;
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
  const vm=buildAccountReadyViewFromBackend(account);
  readyViewModel=vm;
  activeRunnerId=vm.runner.id;
  byId('displayName').textContent=vm.displayName;
  byId('accountEmail').textContent=vm.email;
  byId('goldBalance').textContent=String(vm.goldBalance);
  renderDailyLogin(vm.dailyLogin);
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

byId('testYourRunner').addEventListener('click',()=>{
  try{
    const snapshot=createPracticeRunnerSnapshot(readyViewModel);
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

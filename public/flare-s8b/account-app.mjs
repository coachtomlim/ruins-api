import {buildAccountReadyViewFromBackend} from './account-ready-view.mjs';
import {createBrowserAccountAdapter} from './supabase-browser.mjs';
import {createStatPurchaseFlow} from './stat-purchase-flow.mjs';

const byId=id=>document.getElementById(id);
const views=['signedOutView','pendingView','loadingView','readyView'];
const runnerPanels=['stats','equipment','armor'];
let adapter=null;
let activeRunnerId=null;
let readyViewModel=null;
let purchaseFlow=null;

function showView(id){for(const view of views)byId(view).hidden=view!==id}

function errorMessage(error){
  const message=String(error?.message||error||'Something went wrong');
  if(/SUPABASE_(?:URL|PUBLISHABLE_KEY)_REQUIRED/.test(message))return 'Account service configuration is required.';
  if(/invalid login credentials/i.test(message))return 'Email or password is incorrect.';
  if(/email not confirmed/i.test(message))return 'Confirm your email, then sign in.';
  if(/rate limit/i.test(message))return 'Too many attempts. Please wait and try again.';
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
  cell.className=`gear-slot${slot.equipped?'':' empty'}`;
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
  const vm=buildAccountReadyViewFromBackend(account);
  readyViewModel=vm;
  activeRunnerId=vm.runner.id;
  byId('displayName').textContent=vm.displayName;
  byId('accountEmail').textContent=vm.email;
  byId('goldBalance').textContent=String(vm.goldBalance);
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
  byId('savedGoalLabel').textContent=vm.savedGoalLabel;
  byId('equipmentGrid').replaceChildren(...vm.equipment.map(gearCell));
  byId('armorGrid').replaceChildren(...vm.armor.map(gearCell));
  byId('trainingOffers').replaceChildren(...vm.progressionOffers.map(trainingOfferCell));
  byId('goalStatus').textContent='';
  selectRunnerPanel('stats');
  showView('readyView');
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

byId('createForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget,data=new FormData(form);
  setBusy(form,true);byId('authStatus').textContent='Creating your account…';
  try{
    const result=await adapter.register({displayName:data.get('displayName'),email:data.get('email'),password:data.get('password')});
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

byId('saveDemoGoal').addEventListener('click',async event=>{
  const button=event.currentTarget;button.disabled=true;byId('goalStatus').textContent='Saving through the governed account RPC…';
  try{
    await adapter.saveGoal({senderName:'Tom',runnerId:'warrior-l3',targetHp:60});
    renderReady(await adapter.loadAccountState({playerRunnerId:activeRunnerId}));
    byId('goalStatus').textContent='Saved from authoritative account state.';
  }catch(error){byId('goalStatus').textContent=errorMessage(error)}finally{button.disabled=false}
});

byId('signOut').addEventListener('click',async()=>{
  byId('signOut').disabled=true;
  try{await adapter.signOut();selectAuth('signin')}catch(error){byId('goalStatus').textContent=errorMessage(error)}finally{byId('signOut').disabled=false}
});

try{
  adapter=createBrowserAccountAdapter();
  purchaseFlow=createStatPurchaseFlow({purchase:payload=>adapter.purchaseProgressionOffer(payload),refresh:refreshReady});
  await restoreSession();
}catch(error){
  selectAuth('create');
  byId('authStatus').textContent=errorMessage(error);
}

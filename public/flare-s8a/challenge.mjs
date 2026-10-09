import {loadS3ActorPack} from './actors.mjs';
import {S7_ROOMS,loadS7StockRoom,drawPreview} from '../flare-s71/rooms.mjs';
import {applyRunnerModel,runnerSummary,TRAP_IDS,SUPPORT_IDS} from '../flare-s71/game.mjs';
import {calibrateEncounter} from '../flare-s71/calibration.mjs';
import {startComposedHeroStance} from '../flare-s71/hero-preview.mjs';
import {decodeInviteCode,inviteCodeFromLocation,inviteSender} from './flow.mjs';
import {createReceiverSession,selectDungeon,setEncounter,advanceReceiver} from './receiver-session.mjs';
import {canTransition} from './journey.mjs';
import {buildReceiverView} from './receiver-view.mjs';
import {buildCustomizationCatalog} from './catalog-view-model.mjs';
import {buildRoomCarousel} from './room-carousel.mjs';
import {roomSwipeDirection} from './swipe.mjs';
import {installRuntime} from './runtime-controller.mjs';
import {submitResultReceipt} from './result-receipt.mjs';
import {publicChallengeTokenFromLocation} from '../flare-s8b/friend-share.mjs';
import {createAttemptToken} from './attempt-token.mjs';
import {fetchPublicChallengeSnapshot} from '../flare-s8b/public-challenge-snapshot.mjs';
import {resolveRunnerAuthority} from './runner-authority.mjs';
import {buildEstimateGaugeViewModel} from './estimate-gauge-view-model.mjs';
import {buildRunnerInspectorViewModel} from './runner-inspector-view-model.mjs';
import {gearSlotIcon} from './gear-slot-icon.mjs';
import {encounterItemBadge,encounterItemEffectLabel,flareArtIcon} from './card-icons.mjs';
import {LEVEL1_PRESETS,MAX_GUARD_SLOTS,buildLevel1Presets,canAddGuard,describeMix,estimateGoverned,governedCost,monsterCount} from './governed-encounter.mjs';
import {LOOT_ASSETS} from './loot-assets.mjs';
import {saveGuestReturn,isGuestReturn,withoutGuestParam} from './guest-return.mjs';
import {targetFitCue,targetBands,bandsCopy} from './target-fit.mjs';
import {createLoadingOverlay} from './loading-view.mjs';
import {extendModelWithLevel2,extendCatalogWithLevel2} from './level2-content.mjs';
import {createRewardJourney} from './reward-journey-view.mjs';
import {buildRewardJourney} from './reward-journey.mjs';
import {planResultReceipt,receiptBlockMessage} from './receipt-plan.mjs';
import {readBuilderLevel,grantFirstRunLevel,clampBuilderLevel,customizationUnlockedAt,contentForLevel,editorContentIds,BROKEN_GALLERY_ID} from './builder-level.mjs';

// 002E9: BUILDER progression (not Runner progression). The first completed run grants Builder Level 2
// for the CURRENT browser session only (see builder-level.mjs): sessionStorage keeps it across a
// reload of this tab, but nothing is written to an account or Supabase, so a fresh tab/device/session
// starts at Level 1 again and no durable Level 2 is ever claimed.
const SESSION_STORE=(()=>{try{return sessionStorage}catch{return null}})();
let builderLevel=readBuilderLevel(SESSION_STORE);
let customizationUnlocked=customizationUnlockedAt(builderLevel);
let justUnlocked=false;
function prefersReducedMotion(){try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch{return false;}}

const $=id=>document.getElementById(id),allSpecs=Object.values(S7_ROOMS),rooms=new Map();
const visibleSpecs=()=>contentForLevel(builderLevel).dungeons.map(id=>S7_ROOMS[id]);
let specs=visibleSpecs();
function requiredElement(id){const el=$(id);if(!el)throw new Error(`S8A_DOM_CONTRACT_MISSING:${id}`);return el;}
const REWARDS_DOM_CONTRACT=['heading-rewards','resultTarget','resultFinished','resultDifference','resultScore','heroRewardLabel','heroRewardGold','builderRewardGold','resultReceiptStatus','retryResultReceipt'];
let model,baseCatalog,catalog,invite,runner,session,calibrated,roomIndex=0,activePanel='monsters',runtimeStart=null,lastReceiptPayload=null,receiptBlock=null,currentAttemptToken=null,runnerAuthority=null,dungeonPresets=null;
const publicToken=publicChallengeTokenFromLocation(location);
const loading=createLoadingOverlay({root:document.getElementById('loadingOverlay'),reducedMotion:()=>prefersReducedMotion()});
let roomsReady=null,roomsLoaded=false;
const FRIEND_GOAL_CLAIM_KEY='s8aFriendGoalClaim';
function accountServiceAvailable(){const config=globalThis.__FLARE_S8B_PUBLIC_CONFIG__,sdk=globalThis.supabase;return Boolean(config?.url&&config?.publishableKey&&typeof sdk?.createClient==='function');}
function publicSnapshotClient(){const config=globalThis.__FLARE_S8B_PUBLIC_CONFIG__,sdk=globalThis.supabase;if(!config?.url||!config?.publishableKey||typeof sdk?.createClient!=='function')return null;return sdk.createClient(config.url,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})}
async function fetchCorrelatedSnapshot(){
  if(!publicToken)return null;
  const client=publicSnapshotClient();
  if(!client)throw new Error('SNAPSHOT_SERVICE_UNAVAILABLE');
  const result=await fetchPublicChallengeSnapshot({client,publicToken});
  return result?.runnerSnapshot||null;
}
const selectedSpec=()=>specs[roomIndex],selectedRoom=()=>rooms.get(selectedSpec().id);
// 002E9D: the Level 2 builder is a QUANTITY-BASED guard mixer (no Guard 1/2/3 slots, no positions). The guard mix
// lives in `guardCounts`; traps/support stay as checkbox toggles. Placement of the guards is system-controlled.
const MIXER_ORDER=Object.freeze(['goblin','skeleton','zombie','skeleton-archer']);
const MIXER_NOTE=Object.freeze({goblin:'Starter monster',skeleton:'Starter monster',zombie:'Level 2 unlock','skeleton-archer':'Level 2 unlock'});
let guardCounts=Object.fromEntries(MIXER_ORDER.map(id=>[id,0]));
const expandGuards=()=>MIXER_ORDER.flatMap(id=>Array(guardCounts[id]).fill(id));
const guardTotal=()=>MIXER_ORDER.reduce((n,id)=>n+guardCounts[id],0);
const domEncounter=()=>({enemyTypes:expandGuards(),trapTypes:TRAP_IDS.filter(id=>document.querySelector(`[data-choice="${id}"]`)?.checked),supportTypes:SUPPORT_IDS.filter(id=>document.querySelector(`[data-choice="${id}"]`)?.checked)});
// The single source of truth for the encounter. While a Level 1 preset is the active selection it is returned
// as authored (route order preserved; the governed five-monster BRUTAL included); any editor change drops it and
// the mixer's own encounter takes over.
let activePreset=null;
const encounter=()=>activePreset?structuredClone(activePreset.encounter):domEncounter();
const usedBudget=e=>governedCost(catalog,e);
const labels=(ids,kind)=>ids.filter(id=>id!=='none').map(id=>kind==='monster'?catalog.enemies[id]?.name:model.items?.[id]?.name||model.items?.[id]?.label||id);
function context(){const e=encounter(),estimate=estimateGoverned({catalog,model,runnerId:invite.runnerId,runner,encounter:e}),used=usedBudget(e),governedOverBudget=Boolean(activePreset)&&used>(model.budget||100);return{runnerName:runner.name,runnerLevel:runner.level,roomName:selectedSpec().name,roomIndex,roomCount:specs.length,estimatedHpPercent:estimate.estimatedHpPercent,usedBudget:used,totalBudget:governedOverBudget?used:(model.budget||100),activePanel,monsters:labels(e.enemyTypes,'monster'),traps:labels(e.trapTypes,'item'),supports:labels(e.supportTypes,'item'),accountServiceAvailable:accountServiceAvailable()};}
function show(){refreshGuardMixer();const view=buildReceiverView({session,context:context()});for(const root of document.querySelectorAll('[data-screen]'))root.hidden=root.dataset.screen!==view.shell.state;requestAnimationFrame(()=>$(view.shell.headingId)?.focus());renderCurrent(view);$('receiverNav').hidden=view.kind==='runtime';$('navBack').hidden=!canTransition(session.journey,'BACK');}
// Part H outcome summary line — formats the SAME targetFitCue zone/delta the gauge already uses,
// just as a one-glance sentence ("12 POINTS TOO HARSH"), not a new calculation.
function outcomeInterpretationLabel(estimatedHpPercent,targetHp){
  if(!Number.isFinite(Number(estimatedHpPercent)))return 'Check your dungeon setup.';
  const fit=targetFitCue(estimatedHpPercent,targetHp),delta=Math.round(Math.abs(Number(estimatedHpPercent)-Number(targetHp)));
  if(fit.id==='close')return delta===0?'ON TARGET':`${delta} POINT${delta===1?'':'S'} FROM TARGET`;
  if(fit.id==='gentle')return `${delta} POINT${delta===1?'':'S'} TOO GENTLE`;
  if(fit.id==='harsh')return `${delta} POINT${delta===1?'':'S'} TOO HARSH`;
  return fit.note;
}
function renderGaugeMarker(id,percent){const el=$(id);if(!el)return;el.style.left=`${Math.max(4,Math.min(96,Number(percent)||0))}%`;}
// 002E9D (V18) invitation: ONE combined headline and ONE explanation paragraph, the real Runner, and a
// display-only target gauge using the shared 35/70-style bands.
function renderInvitation(){
  const name=session.senderName.toUpperCase(),target=Math.round(invite.targetHp),bands=targetBands(invite.targetHp);
  $('heading-invitation').textContent=`${name} HAS CHALLENGED YOU TO BUILD A DUNGEON FOR 'THE RUNNER'`;
  $('inviteExplain').textContent='Your Dungeon will contain monsters who will attack the Runner! But fear not, we have devised some good ones for you already! Just choose one and go!';
  $('inviteRunner').textContent=`Level ${runner.level} ${runner.name}`;
  $('inviteTarget').textContent=`TARGET: ${target}% HP`;
  $('targetMission').textContent=`Get the Runner to the EXIT with as close to ${target}% HP health remaining!`;
  const gauge=$('inviteGauge');gauge.style.setProperty('--harsh',`${bands.harshBelow}%`);gauge.style.setProperty('--gentle',`${bands.gentleAbove}%`);
  $('inviteGaugeTrack').style.setProperty('--harsh',`${bands.harshBelow}%`);$('inviteGaugeTrack').style.setProperty('--gentle',`${bands.gentleAbove}%`);
  $('inviteGaugeTarget').textContent=`TARGET ${target}%`;$('inviteGaugeTarget').style.left=`${bands.target}%`;$('inviteGaugeArrow').style.left=`${bands.target}%`;
  $('targetRules').textContent=bandsCopy(invite.targetHp);
  $('inviteReward').textContent=`The closer your eventual score is to the Target (${target}%), the more rewards you will earn!`;
  gauge.setAttribute('aria-label',`Target ${target}% HP`);
}
function renderCurrent(view){
  const m=view.model;
  if(view.kind==='invitation')renderInvitation();
  else if(view.kind==='mission'){$('missionTarget').textContent=`~${invite.targetHp}% HP`;$('missionRewardCue').textContent='Closer to target earns more Builder Gold.';$('targetFitCue').textContent=`${m.targetFit.label} · ${m.targetFit.note}`;$('missionRunnerContext').textContent=`${session.senderName}'s Runner has ${runner.hp} HP, ${runner.attack} ATK and ${runner.defense} DEF.`;renderDungeonChooserFrame();renderRoom();}
  else if(view.kind==='customize'){
    $('customizeLocked').hidden=customizationUnlocked;$('customizeEditor').hidden=!customizationUnlocked;$('customizeActions').hidden=!customizationUnlocked;
    if(!customizationUnlocked)return;
    $('dungeonBudget').textContent=m.budget.primary;$('dungeonBudget').dataset.legal=String(m.budget.legal);$('finishCustomize').disabled=!m.canFinish;renderTabs();if(activePanel==='dungeons')drawDungeonCards();
    const estimatedHpPercent=estimateGoverned({catalog,model,runnerId:invite.runnerId,runner,encounter:encounter()}).estimatedHpPercent;
    const gauge=buildEstimateGaugeViewModel({targetHp:invite.targetHp,estimatedHpPercent});
    $('customizeGaugeTarget').textContent=`TARGET ${gauge.targetPercent}%`;renderGaugeMarker('customizeGaugeTarget',gauge.targetPercent);$('customizeGaugeEstimate').hidden=!gauge.hasEstimate;if(gauge.hasEstimate)renderGaugeMarker('customizeGaugeEstimate',gauge.estimatePercent);
    $('outcomeTarget').textContent=`${Math.round(invite.targetHp)}%`;
    $('outcomeEstimate').textContent=gauge.hasEstimate?`${Math.round(gauge.estimatePercent)}%`:'—';
    $('outcomeInterpretation').textContent=outcomeInterpretationLabel(gauge.estimatePercent,invite.targetHp);
  }
  else if(view.kind==='ready')renderReady(m);
  else if(view.kind==='runtime'){$('cameraToggle').textContent=m.cameraAction||'OVERVIEW';$('pauseToggle').textContent=m.pauseAction;}
  else if(view.kind==='rewards'){for(const id of REWARDS_DOM_CONTRACT)requiredElement(id);requiredElement('heading-rewards').textContent=m.resultHeading;requiredElement('resultTarget').textContent=`TARGET ${Math.round(m.targetHpPercent)}%`;requiredElement('resultFinished').textContent=`FINISHED ${Math.round(m.actualHpPercent)}%`;requiredElement('resultDifference').textContent=`${m.differenceFromTarget} POINT${m.differenceFromTarget===1?'':'S'} FROM TARGET`;requiredElement('resultScore').textContent=`SCORE ${Math.round(m.score)}`;requiredElement('heroRewardLabel').textContent=m.heroReward.label;requiredElement('heroRewardGold').textContent=m.heroReward.value;requiredElement('builderRewardGold').textContent=m.builderReward.value;renderRewardJourney(m);}
  else if(view.kind==='registration'){$('registrationGoal').textContent=m.carriedGoal;$('registrationRewardPreview').textContent=`This run earned ${m.previewBuilderGold} Builder Gold · ${m.previewHeroGold} Hero Gold (not saved to an account yet).`;$('registrationNotSaved').textContent=m.notSaved;$('createAccount').disabled=!m.accountAction.enabled;$('accountActionStatus').textContent=m.accountAction.enabled?'Continue to create your account or sign in.':m.accountAction.note;}
}
function chooseSessionRoom(){session=selectDungeon(session,selectedSpec().id);session=setEncounter(session,encounter());}
function renderRoom(){const carousel=buildRoomCarousel({rooms:specs,index:roomIndex});$('roomName').textContent=carousel.current.name;$('roomCounter').textContent=carousel.counter;if(selectedRoom())drawPreview($('roomPreview'),selectedRoom().map,selectedRoom().tiles);}
function moveRoom(delta){activePreset=null;roomIndex=(roomIndex+delta+specs.length)%specs.length;calibrated=calibrateEncounter({catalog,model,runnerId:invite.runnerId,runner,targetHp:invite.targetHp});applyEncounter(calibrated.encounter);if(session?.journey==='mission')show();}
function itemCard(item){
  const card=document.createElement('label');card.className='card';
  const input=document.createElement('input');input.type='checkbox';input.dataset.choice=item.id;input.className='visually-hidden';
  const icon=flareArtIcon(item.id)||encounterItemBadge(item.id);
  const body=document.createElement('div');body.className='card-body';
  const strong=document.createElement('strong');strong.textContent=item.label;
  const costLine=document.createElement('small');costLine.className='card-cost';costLine.textContent=`${item.cost} BUDGET`;
  const effectLine=document.createElement('small');effectLine.className='card-effect';effectLine.textContent=encounterItemEffectLabel(item.id)||item.summary||'';
  body.append(strong,effectLine,costLine);
  card.append(input,icon,body);
  return card;
}
function renderControls(){
  const access=editorContentIds(builderLevel,LEVEL1_PRESETS.map(p=>p.encounter));
  const vm=buildCustomizationCatalog({model,catalog,runnerId:invite.runnerId,runner,access}),monsterPanel=document.querySelector('[data-custom-panel="monsters"]');
  monsterPanel.replaceChildren();
  renderGuardMixer(monsterPanel,vm.monsters);
  for(const kind of ['traps','supports']){
    const panel=document.querySelector(`[data-custom-panel="${kind}"]`);panel.replaceChildren();
    const message=document.createElement('p');message.className='editor-message';message.setAttribute('role','status');message.setAttribute('aria-live','polite');
    const list=document.createElement('div');list.className='option-list';
    for(const item of vm[kind])list.append(itemCard(item));
    if(!vm[kind].length){const empty=document.createElement('p');empty.className='option-empty';empty.textContent=kind==='traps'?'No traps unlocked yet.':'No support available yet.';list.append(empty);}
    panel.append(message,list);
  }
  for(const control of document.querySelectorAll('[data-choice]'))control.addEventListener('change',()=>handleItemToggle(control));
  renderDungeonCards();
}
// --- guard mixer -------------------------------------------------------------------------------------------
function setEditorMessage(text,tone='warn'){for(const m of document.querySelectorAll('.editor-message')){m.textContent=text||'';m.dataset.tone=text?tone:'';}}
function commitEditorChange(){activePreset=null;session=setEncounter(session,encounter());show();}
function tryAddGuard(id){
  const verdict=canAddGuard({roomId:selectedSpec().id,catalog,encounter:encounter(),monsterId:id,budget:model.budget||100});
  if(!verdict.ok){setEditorMessage(verdict.message);return false;}
  const keep=encounter();guardCounts=Object.fromEntries(MIXER_ORDER.map(k=>[k,0]));for(const t of keep.enemyTypes)if(t in guardCounts)guardCounts[t]++;
  guardCounts[id]++;setEditorMessage('');commitEditorChange();return true;
}
function tryRemoveGuard(id){
  const keep=encounter();guardCounts=Object.fromEntries(MIXER_ORDER.map(k=>[k,0]));for(const t of keep.enemyTypes)if(t in guardCounts)guardCounts[t]++;
  if(guardCounts[id]<=0)return false;guardCounts[id]--;setEditorMessage('');commitEditorChange();return true;
}
function handleItemToggle(control){
  const id=control.dataset.choice;
  if(control.checked){
    const probe=domEncounter(),spec=model.items?.[id],used=governedCost(catalog,{...probe,trapTypes:probe.trapTypes.filter(t=>t!==id),supportTypes:probe.supportTypes.filter(t=>t!==id)}),left=(model.budget||100)-used;
    if(spec&&spec.cost>left){control.checked=false;setEditorMessage(`Not enough dungeon budget: ${spec.name} costs ${spec.cost} and you have ${Math.max(0,left)} left.`);return;}
  }
  setEditorMessage('');commitEditorChange();
}
let guardPickerOpen=false;
function renderGuardMixer(panel,monsters){
  const total=document.createElement('div');total.className='guard-total';
  const count=document.createElement('strong');count.id='guardTotal';
  const note=document.createElement('small');note.className='cap-note';note.textContent='Use the arrows on each monster to adjust your guard mix.';
  total.append(count,note);
  const message=document.createElement('p');message.className='editor-message';message.setAttribute('role','status');message.setAttribute('aria-live','polite');
  const wrap=document.createElement('div');wrap.className='add-guard-wrap';
  const addBtn=document.createElement('button');addBtn.type='button';addBtn.id='addGuardBtn';addBtn.className='add-guard-btn';addBtn.setAttribute('aria-expanded','false');
  const picker=document.createElement('div');picker.id='addGuardPicker';picker.className='add-picker';picker.hidden=true;
  const syncPicker=()=>{picker.hidden=!guardPickerOpen;addBtn.textContent=guardPickerOpen?'CLOSE GUARD PICKER':'+ ADD A GUARD';addBtn.setAttribute('aria-expanded',String(guardPickerOpen));};
  addBtn.addEventListener('click',()=>{guardPickerOpen=!guardPickerOpen;syncPicker();});
  const mixer=document.createElement('div');mixer.className='mixer';
  for(const m of monsters){
    const art=()=>{const i=document.createElement('img');i.src=LOOT_ASSETS[m.id];i.alt='';i.decoding='async';return i;};
    const choice=document.createElement('button');choice.type='button';choice.className='add-choice';choice.dataset.monster=m.id;
    const label=document.createElement('strong');label.textContent=m.label;choice.append(art(),label);
    choice.addEventListener('click',()=>{if(tryAddGuard(m.id)){guardPickerOpen=false;syncPicker();}});
    picker.append(choice);
    const row=document.createElement('div');row.className='mix-row';row.dataset.monster=m.id;
    const name=document.createElement('div');name.className='mix-name';const strong=document.createElement('strong');strong.textContent=m.label;const small=document.createElement('small');small.textContent=`${MIXER_NOTE[m.id]||'Monster'} · ${m.cost} budget`;name.append(strong,small);
    const minus=document.createElement('button');minus.type='button';minus.className='mini-arrow';minus.textContent='‹';minus.setAttribute('aria-label',`Remove one ${m.label}`);
    const qty=document.createElement('div');qty.className='qty';qty.dataset.qty=m.id;qty.setAttribute('aria-live','polite');
    const plus=document.createElement('button');plus.type='button';plus.className='mini-arrow';plus.textContent='›';plus.setAttribute('aria-label',`Add one ${m.label}`);
    minus.addEventListener('click',()=>tryRemoveGuard(m.id));plus.addEventListener('click',()=>tryAddGuard(m.id));
    row.append(art(),name,minus,qty,plus);mixer.append(row);
  }
  wrap.append(addBtn,picker);syncPicker();
  panel.append(total,message,wrap,mixer);
}
function refreshGuardMixer(){
  const e=encounter(),counts=Object.fromEntries(MIXER_ORDER.map(k=>[k,0]));for(const t of e.enemyTypes)if(t in counts)counts[t]++;
  const total=Object.values(counts).reduce((a,b)=>a+b,0),el=$('guardTotal');if(el)el.textContent=`${total} / ${MAX_GUARD_SLOTS} GUARDS`;
  for(const q of document.querySelectorAll('[data-qty]'))q.textContent=String(counts[q.dataset.qty]||0);
  for(const row of document.querySelectorAll('.mix-row')){const id=row.dataset.monster,buttons=row.querySelectorAll('.mini-arrow');buttons[0].disabled=!(counts[id]>0);}
}
// DUNGEONS tab (002E9): one card per dungeon the current Builder Level can use; selecting a card
// changes the real session room, so Broken Gallery is playable the moment Level 2 is reached.
function renderDungeonCards(){
  const panel=document.querySelector('[data-custom-panel="dungeons"]');panel.replaceChildren();
  const grid=document.createElement('div');grid.className='dungeon-grid';
  for(const spec of specs){
    const card=document.createElement('label');card.className='card dungeon-card';
    const input=document.createElement('input');input.type='radio';input.name='dungeon';input.value=spec.id;input.className='visually-hidden';
    input.checked=spec.id===selectedSpec()?.id;
    const canvas=document.createElement('canvas');canvas.id=`dungeonCard-${spec.id}`;canvas.className='dungeon-card-preview';canvas.setAttribute('aria-label',`${spec.name} dungeon preview`);
    const name=document.createElement('strong');name.textContent=spec.name;
    card.append(input,canvas,name);
    if(spec.id===BROKEN_GALLERY_ID){const tag=document.createElement('small');tag.className='card-effect';tag.textContent='NEW AT LEVEL 2';card.append(tag);}
    input.addEventListener('change',()=>{roomIndex=specs.findIndex(x=>x.id===spec.id);session=selectDungeon(session,spec.id);show();});
    grid.append(card);
  }
  panel.append(grid);
}
function drawDungeonCards(){
  for(const spec of specs){
    const input=document.querySelector(`input[name="dungeon"][value="${spec.id}"]`),room=rooms.get(spec.id),canvas=$(`dungeonCard-${spec.id}`);
    if(input)input.checked=spec.id===selectedSpec()?.id;
    if(room&&canvas)drawPreview(canvas,room.map,room.tiles);
  }
}
// Applies a Builder Level to the live UI: which dungeons are selectable and which controls exist.
// The current encounter is read back first and re-applied after the controls are rebuilt, so
// levelling up never changes the player's selection.
function applyBuilderLevel(level){
  builderLevel=clampBuilderLevel(level);customizationUnlocked=customizationUnlockedAt(builderLevel);
  const keepRoomId=selectedSpec()?.id,keep=encounter();
  specs=visibleSpecs();roomIndex=Math.max(0,specs.findIndex(s=>s.id===keepRoomId));
  renderControls();applyEncounter(keep);session=setEncounter(session,encounter());
}
function applyEncounter(e){
  guardCounts=Object.fromEntries(MIXER_ORDER.map(k=>[k,0]));
  for(const t of (e.enemyTypes||[]))if(t in guardCounts)guardCounts[t]++;
  const selected=[...(e.trapTypes||[]),...(e.supportTypes||[])];
  for(const id of [...TRAP_IDS,...SUPPORT_IDS]){const box=document.querySelector(`[data-choice="${id}"]`);if(box)box.checked=selected.includes(id);}
}
function renderTabs(){for(const tab of document.querySelectorAll('[data-custom-tab]')){const on=tab.dataset.customTab===activePanel;tab.setAttribute('aria-selected',String(on));document.querySelector(`[data-custom-panel="${tab.dataset.customTab}"]`).hidden=!on;}}
let presetIndex=1; // 0=EASY, 1=JUST NICE (default), 2=BRUTAL - Owner-approved Level 1 compositions (governed-encounter.mjs)
const presetList=()=>dungeonPresets;
function applyPreset(preset){
  const index=specs.findIndex(s=>s.id===preset.roomId);
  if(index>=0)roomIndex=index;
  applyEncounter(preset.encounter);
  activePreset=preset;
}
function applyCurrentPreset(){applyPreset(presetList()[presetIndex]);session=setEncounter(session,encounter());}
// Single-dungeon chooser (002E5 Part 1): exactly one real dungeon preview visible at a time, with
// explicit LEFT/RIGHT navigation across the 3 presets — browsing a preset IS selecting it (there is
// no separate commit step, matching the original room carousel's own long-standing behavior), unlike
// the 002E4 paged monster/trap/support editor where paging through OPTIONS must never auto-toggle a
// SELECTION. Those are different interactions and this file keeps them distinct on purpose.
function renderDungeonChooser(){
  const wrap=$('dungeonPresets');wrap.replaceChildren();
  const nav=document.createElement('div');nav.className='chooser-nav';
  const prev=document.createElement('button');prev.type='button';prev.id='presetPrev';prev.textContent='‹';prev.setAttribute('aria-label','Previous dungeon');
  const canvas=document.createElement('canvas');canvas.id='presetPreview';canvas.className='chooser-preview';
  const next=document.createElement('button');next.type='button';next.id='presetNext';next.textContent='›';next.setAttribute('aria-label','Next dungeon');
  nav.append(prev,canvas,next);
  const info=document.createElement('div');info.className='chooser-info';
  const roomName=document.createElement('strong');roomName.id='presetRoomName';roomName.className='chooser-room-name';
  const diffRow=document.createElement('div');diffRow.className='chooser-difficulty';
  const label=document.createElement('span');label.id='presetLabel';label.className='preset-card-label';
  const recBadge=document.createElement('span');recBadge.id='presetRecommended';recBadge.className='recommended-badge';recBadge.textContent='RECOMMENDED';recBadge.hidden=true;
  diffRow.append(label,recBadge);
  const targetLine=document.createElement('div');targetLine.id='presetTarget';targetLine.className='chooser-target';
  const estimate=document.createElement('div');estimate.id='presetEstimate';estimate.className='preset-card-estimate';
  const interpretation=document.createElement('div');interpretation.id='presetInterpretation';interpretation.className='preset-card-interpretation';
  const contents=document.createElement('div');contents.id='presetContents';contents.className='preset-card-contents';
  const position=document.createElement('span');position.id='presetPosition';position.className='chooser-position';position.setAttribute('aria-live','polite');
  info.append(roomName,diffRow,targetLine,estimate,interpretation,contents,position);
  wrap.append(nav,info);
  prev.addEventListener('click',()=>{presetIndex=(presetIndex-1+3)%3;applyCurrentPreset();show();});
  next.addEventListener('click',()=>{presetIndex=(presetIndex+1)%3;applyCurrentPreset();show();});
  applyCurrentPreset();
}
function renderDungeonChooserFrame(){
  const preset=presetList()[presetIndex];
  const roomSpec=specs.find(s=>s.id===preset.roomId),roomData=roomSpec&&rooms.get(roomSpec.id);
  if(roomData)drawPreview($('presetPreview'),roomData.map,roomData.tiles);
  $('presetRoomName').textContent=roomSpec?.name||preset.roomId;
  $('presetLabel').textContent=preset.label;
  $('presetRecommended').hidden=!preset.recommended;
  $('presetTarget').textContent=`TARGET ${Math.round(preset.targetHp)}%`;
  $('presetEstimate').textContent=`ESTIMATED FINISH ~${Math.round(preset.estimatedHpPercent)}% HP`;
  $('presetInterpretation').textContent=preset.interpretation;
  $('presetContents').textContent=describeMix(labels(preset.encounter.enemyTypes,'monster')).join(' · ');
  $('presetPosition').textContent=`${presetIndex+1} / 3`;
}
// 002E9: the post-run reward journey (SUCCESS -> PERFORMANCE -> YOU GAINED -> YOUR FRIEND GAINED ->
// LEVEL 2 -> NEW GIZMOS -> keep progressing) is the ONLY unlock presentation; nothing inline on the
// rewards screen repeats it. It is a full-screen modal above the rewards state: the result, receipt
// and reward DOM beneath it is rendered first and is untouched, so dismissing it never navigates.
let heroActorPack=null,journeyShown=false;
const dungeonName=id=>S7_ROOMS[id]?.name||id;
const journeyNameOf=(id,key)=>key==='dungeons'?dungeonName(id):(model.monsters?.[id]?.name||model.items?.[id]?.name||id);
const journeyView=createRewardJourney({
  root:$('rewardJourney'),
  coinSrc:new URL('./assets/tactics-coins.png',import.meta.url).href,
  startHero:canvas=>startComposedHeroStance(canvas,heroActorPack),
  reducedMotion:prefersReducedMotion,
  // The New Gizmos CTA starts the browse-only LOOT REVIEW inside the journey; it never opens the editor.
  // CUSTOMIZE THIS DUNGEON (final scene) is the explicit, separate handoff into the REAL customization flow.
  onCustomize:()=>{
    // A Guest who returned from the Runner Hub has no result screen behind the journey: walk the normal path
    // (invitation -> mission) before opening the real editor.
    if(session.journey==='invitation'){journeyView.dismiss();transition('ACCEPT');activePanel='monsters';transition('CUSTOMIZE');return;}
    openUnlockedTool('monsters');
  },
  onCreateAccount:()=>{journeyView.dismiss();if(session.journey==='rewards')transition('SAVE_GOAL');else{saveGuestReturn(SESSION_STORE,location);location.href='/quick-dungeon/flare-s8b/';}},
  onGuest:()=>journeyView.dismiss()
});
function openUnlockedTool(panel){activePanel=panel;journeyView.dismiss();transition('EDIT_DUNGEON');}
// A Guest who pressed HOME and then CONTINUE AS GUEST on the Runner Hub lands back here with ?guest=1. If Builder
// Level 2 is active for this session, reopen the New Gizmos overview (session-only; nothing is persisted).
const GUEST_RETURN_RESULT=Object.freeze({cleared:true,targetHpPercent:0,actualHpPercent:0,differenceFromTarget:0,builderReward:Object.freeze({gold:0}),heroReward:Object.freeze({gold:0})});
function resumeGuestSession(){
  try{history.replaceState(null,'',withoutGuestParam(location));}catch{}
  if(builderLevel<2)return;
  try{journeyView.start(buildRewardJourney({result:GUEST_RETURN_RESULT,senderName:session.senderName,level:builderLevel,nameOf:journeyNameOf}),{sceneId:'gizmos'});}
  catch(error){console.error(error);journeyView.dismiss();}
}
function renderRewardJourney(m){
  if(!justUnlocked||journeyShown)return;
  journeyShown=true;
  try{journeyView.start(buildRewardJourney({result:m,senderName:session.senderName,level:builderLevel,nameOf:journeyNameOf}));}
  catch(error){console.error(error);journeyView.dismiss();}
}
// 002E9C (V12): READY is a static DISPLAY - a yellow triangle pointing DOWN at the target, and a green
// circle holding the dynamic estimated-finish numeral with "ESTIMATED FINISH" below it. Nothing on it is
// an input; there is no range/slider semantics and no draggable element. The summary is deliberately
// minimal: dungeon + difficulty, monster count and Builder Level (no guard positions, no build budget).
const gaugeLeft=percent=>`${4+Math.max(0,Math.min(100,Number(percent)||0))*.92}%`;
function renderReady(m){
  const target=Math.round(invite.targetHp),e=encounter();
  const gauge=buildEstimateGaugeViewModel({targetHp:invite.targetHp,estimatedHpPercent:estimateGoverned({catalog,model,runnerId:invite.runnerId,runner,encounter:e}).estimatedHpPercent});
  $('readyTarget').textContent=`Aim for ~${target}% HP at the exit`;
  $('runHero').disabled=!m.canRun;
  const bands=targetBands(invite.targetHp),rg=$('readyGauge');rg.style.setProperty('--harsh',`${bands.harshBelow}%`);rg.style.setProperty('--gentle',`${bands.gentleAbove}%`);
  $('readyBands').textContent=`<${bands.harshBelow}% Too Harsh · ${bands.harshBelow}%-${bands.gentleAbove}% Just Nice · >${bands.gentleAbove}% Too Gentle`;
  $('readyGaugeTargetLabel').textContent=`TARGET ${gauge.targetPercent}%`;
  $('readyGaugeTargetLabel').style.left=gaugeLeft(gauge.targetPercent);$('readyGaugeTarget').style.left=gaugeLeft(gauge.targetPercent);
  const dot=$('readyGaugeEstimate'),copy=$('readyGaugeEstimateCopy');
  dot.hidden=copy.hidden=!gauge.hasEstimate;
  if(gauge.hasEstimate){dot.textContent=`${Math.round(gauge.estimatePercent)}%`;dot.style.left=copy.style.left=gaugeLeft(gauge.estimatePercent);$('readyGaugeEstimateLabel').textContent=gauge.estimateLabel;}
  $('readyGauge').setAttribute('aria-label',gauge.hasEstimate?`Target ${gauge.targetPercent}% HP. Estimated finish ${gauge.estimateLabel}.`:`Target ${gauge.targetPercent}% HP.`);
  const count=monsterCount(e);
  $('readyDungeon').textContent=`${selectedSpec().name} · ${activePreset?activePreset.label:'CUSTOM'}`;
  $('readySummary').textContent=`${count} monster${count===1?'':'s'} · Level ${builderLevel}`;
}
function renderRunnerInspector(){
  const vm=buildRunnerInspectorViewModel({displayName:runner.name,hp:runner.hp,attack:runner.attack,defense:runner.defense,authoritySource:runnerAuthority?.source,snapshotEquipment:runnerAuthority?.equipment});
  $('inspectorHp').textContent=vm.hp;$('inspectorAttack').textContent=vm.attack;$('inspectorDefense').textContent=vm.defense;
  const list=$('inspectorEquipment');list.replaceChildren();
  for(const slot of vm.equipment){
    const row=document.createElement('div');row.className=`gear-row${slot.empty?' empty':''}`;
    const icon=gearSlotIcon(slot.slot);
    const name=document.createElement('strong');name.textContent=slot.itemName;
    const mod=document.createElement('small');mod.textContent=slot.modifierLabel;
    row.append(icon,name,mod);list.append(row);
  }
}
function openRunnerInspector(){renderRunnerInspector();$('runnerInspector').hidden=false;$('closeRunnerInspector').focus();}
function closeRunnerInspector(){$('runnerInspector').hidden=true;$('viewRunner').focus();}
function transition(event){try{if(['USE_DUNGEON','CUSTOMIZE'].includes(event))chooseSessionRoom();if(event==='DONE')session=setEncounter(session,encounter());session=advanceReceiver(session,event);show();}catch(error){$('loadStatus').textContent=error.message;}}
function receiptClient(){const config=globalThis.__FLARE_S8B_PUBLIC_CONFIG__,sdk=globalThis.supabase;if(!publicToken||!config?.url||!config?.publishableKey||typeof sdk?.createClient!=='function')return null;return sdk.createClient(config.url,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})}
async function sendResultReceipt(){const status=requiredElement('resultReceiptStatus'),retry=requiredElement('retryResultReceipt');if(!publicToken){status.textContent='Legacy challenge · result stays on this device.';retry.hidden=true;return}if(receiptBlock||!lastReceiptPayload){status.textContent=receiptBlockMessage(receiptBlock||'PAYLOAD_INVALID',session.senderName);retry.hidden=true;return}status.textContent='Sending result…';retry.hidden=true;try{const client=receiptClient();if(!client)throw new Error('RESULT_SERVICE_UNAVAILABLE');const row=await submitResultReceipt({client,payload:lastReceiptPayload});status.textContent=`RESULT SENT TO ${session.senderName.toUpperCase()}`;status.dataset.resultId=row.result_id;retry.hidden=true}catch(error){console.error(error);status.textContent='Result not sent yet. Your result is safe — retry when connected.';retry.hidden=false}}
$('retryResultReceipt').addEventListener('click',sendResultReceipt);
// 002E9D: the rooms/tiles load in the background after the invitation is usable; if the player is faster than the
// load, a real loading screen covers exactly the remaining wait (nothing is delayed artificially).
$('acceptChallenge').addEventListener('click',async()=>{
  if(!roomsLoaded&&roomsReady){
    try{loading.begin('Loading your dungeon…',{immediate:true});loading.setStep(0);await roomsReady;}
    catch(error){$('loadStatus').textContent='We could not load the dungeon art. Please retry.';return;}
    finally{loading.end();}
  }
  transition('ACCEPT');
});
$('previousRoom').addEventListener('click',()=>moveRoom(-1));$('nextRoom').addEventListener('click',()=>moveRoom(1));
$('useDungeon').addEventListener('click',()=>transition('USE_DUNGEON'));$('openCustomize').addEventListener('click',()=>transition('CUSTOMIZE'));
$('finishCustomize').addEventListener('click',()=>transition('DONE'));$('editDungeon').addEventListener('click',()=>transition('CUSTOMIZE'));
$('editThisDungeon').addEventListener('click',()=>transition('EDIT_DUNGEON'));$('saveGoalBuildOwn').addEventListener('click',()=>transition('SAVE_GOAL'));$('backToRewards').addEventListener('click',()=>transition('BACK_TO_REWARDS'));
$('navBack').addEventListener('click',()=>transition('BACK'));
// HOME leaves for the Runner Hub; remember (session-only) where a Guest should come back to.
$('navHome').addEventListener('click',()=>{saveGuestReturn(SESSION_STORE,location);});
$('viewRunner').addEventListener('click',openRunnerInspector);
$('closeRunnerInspector').addEventListener('click',closeRunnerInspector);
$('runnerInspector').addEventListener('click',e=>{if(e.target===$('runnerInspector'))closeRunnerInspector();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('runnerInspector').hidden)closeRunnerInspector();});
$('createAccount').addEventListener('click',()=>{if($('createAccount').disabled)return;try{sessionStorage.setItem(FRIEND_GOAL_CLAIM_KEY,JSON.stringify({senderName:session.senderName,runnerId:invite.runnerId,targetHp:invite.targetHp}));}catch(error){console.error(error);}saveGuestReturn(SESSION_STORE,location);location.href='/quick-dungeon/flare-s8b/';});
$('resetSuggested').addEventListener('click',()=>{activePreset=null;applyEncounter(calibrated.encounter);session=setEncounter(session,encounter());show();});
for(const tab of document.querySelectorAll('[data-custom-tab]'))tab.addEventListener('click',()=>{activePanel=tab.dataset.customTab;setEditorMessage('');show();});
$('runHero').addEventListener('click',()=>runtimeStart?.());
let pointer=null;$('roomStage').addEventListener('pointerdown',e=>pointer={x:e.clientX,y:e.clientY});$('roomStage').addEventListener('pointerup',e=>{const direction=pointer&&roomSwipeDirection({startX:pointer.x,startY:pointer.y,endX:e.clientX,endY:e.clientY});pointer=null;if(direction)moveRoom(direction);});
window.__s8aReceiver={get session(){return session;},get encounter(){return encounter();},get roomId(){return selectedSpec().id;},get room(){return selectedRoom();},get runnerAuthority(){return runnerAuthority;},get customizationUnlocked(){return customizationUnlocked;},get builderLevel(){return builderLevel;},get justUnlocked(){return justUnlocked;},setRuntimeStart(fn){runtimeStart=fn;},loadingBegin(){loading.begin('Loading your dungeon…',{immediate:true});},loadingStep(i){loading.setStep(i);},loadingEnd(){loading.end();},startRuntime(){chooseSessionRoom();currentAttemptToken=createAttemptToken();session=advanceReceiver(session,'RUN');show();},completeRuntime(result,score){session=advanceReceiver(session,'COMPLETE',{result,score});// Plan the receipt BEFORE any presentation work and never let a payload problem escape (an
      // exception here used to abort completion): see receipt-plan.mjs.
      const plan=planResultReceipt({publicToken,roomId:session.roomId,encounter:session.encounter,rulesVersion:'s8a-1',result,heroGold:session.reward?.heroGold,attemptToken:currentAttemptToken});
      lastReceiptPayload=plan.payload;receiptBlock=plan.block;if(plan.error)console.error(plan.error);
      const grant=grantFirstRunLevel(SESSION_STORE,builderLevel);justUnlocked=grant.leveledUp;if(grant.leveledUp){journeyShown=false;try{applyBuilderLevel(grant.level);}catch(error){console.error(error);}}
      try{show();}catch(error){console.error(error);}finally{void sendResultReceipt();}},replayRuntime(){currentAttemptToken=createAttemptToken();session=advanceReceiver(session,'RUN_AGAIN');show();},runFailed(message){session={...session,journey:'ready'};show();$('readySummary').textContent=`Run could not start: ${message}`;},show};
installRuntime(window.__s8aReceiver);
async function bootReceiver(){loading.begin('Loading your challenge…');try{const [base,game,heroPack,correlatedSnapshot]=await Promise.all([fetch('/quick-dungeon/flare-p0/data/catalog.json').then(r=>r.ok?r.json():Promise.reject(Error('Catalogue unavailable'))),fetch('/quick-dungeon/flare-s7/data/game.json').then(r=>r.ok?r.json():Promise.reject(Error('Game model unavailable'))),loadS3ActorPack(),fetchCorrelatedSnapshot()]);baseCatalog=base;model=extendModelWithLevel2(game);const code=inviteCodeFromLocation(location);invite=code?decodeInviteCode(code,model):new URLSearchParams(location.search).get('demo')==='1'?{runnerId:model.defaultRunner,targetHp:model.defaultTargetHp}:null;if(!invite)throw Error('Challenge invitation is missing or invalid');catalog=extendCatalogWithLevel2(applyRunnerModel(baseCatalog,model,invite.runnerId),model);runnerAuthority=resolveRunnerAuthority({snapshot:correlatedSnapshot,templateMaxHp:catalog.heroes.warrior.maxHp,templateAttack:catalog.heroes.warrior.damage,templateDefense:catalog.heroes.warrior.armor});if(runnerAuthority.source==='snapshot'){catalog.heroes.warrior.maxHp=runnerAuthority.maxHp;catalog.heroes.warrior.damage=runnerAuthority.attack;catalog.heroes.warrior.armor=runnerAuthority.defense;}runner=runnerSummary(model,invite.runnerId,catalog);session=createReceiverSession({invite,senderName:inviteSender(location.search)});renderControls();calibrated=calibrateEncounter({catalog,model,runnerId:invite.runnerId,runner,targetHp:invite.targetHp});applyEncounter(calibrated.encounter);session=setEncounter(session,encounter());dungeonPresets=buildLevel1Presets({catalog,model,runnerId:invite.runnerId,runner,targetHp:invite.targetHp});renderDungeonChooser();heroActorPack=heroPack;startComposedHeroStance($('inviteHeroCanvas'),heroPack);roomsReady=Promise.all(allSpecs.map(async spec=>rooms.set(spec.id,await loadS7StockRoom(spec.id)))).then(()=>{roomsLoaded=true;});roomsReady.catch(error=>console.error(error));$('acceptChallenge').disabled=false;$('loadStatus').textContent='';show();window.__s8aData={model,catalog,invite,runner,rooms,specs:allSpecs,runnerAuthority,dungeonPresets};if(isGuestReturn(location.search))resumeGuestSession();}catch(error){console.error(error);if(error?.message==='SNAPSHOT_SERVICE_UNAVAILABLE'||/snapshot/i.test(String(error?.message))){$('heading-invitation').textContent='COULD NOT LOAD THIS RUNNER';$('loadStatus').innerHTML='';const status=document.createElement('span');status.textContent="We couldn't load your friend's Runner data. ";const retry=document.createElement('button');retry.type='button';retry.className='nav-link';retry.textContent='RETRY';retry.addEventListener('click',()=>location.reload());$('loadStatus').append(status,retry);return}$('heading-invitation').textContent='THIS CHALLENGE CANNOT OPEN';$('loadStatus').textContent=error.message;}}
void bootReceiver().finally(()=>loading.end());

import {loadS3ActorPack} from './actors.mjs';
import {S7_ROOMS,loadS7StockRoom,drawPreview} from '../flare-s71/rooms.mjs';
import {applyRunnerModel,runnerSummary,encounterCost,TRAP_IDS,SUPPORT_IDS} from '../flare-s71/game.mjs';
import {calibrateEncounter,estimateEncounter,presetById} from '../flare-s71/calibration.mjs';
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
import {monsterCardIcon,emptySlotCardIcon,encounterItemBadge,encounterItemEffectLabel,flareArtIcon} from './card-icons.mjs';
import {buildDungeonPresets,GOVERNED_PRESET_IDS} from './dungeon-presets.mjs';
import {installPagedSelector} from './paged-selector.mjs';
import {targetFitCue} from './target-fit.mjs';
import {extendModelWithLevel2,extendCatalogWithLevel2} from './level2-content.mjs';
import {createRewardJourney} from './reward-journey-view.mjs';
import {buildRewardJourney} from './reward-journey.mjs';
import {drawFlareArt,drawRoomPreviewTransparent} from './flare-art.mjs';
import {planResultReceipt,receiptBlockMessage} from './receipt-plan.mjs';
import {readBuilderLevel,grantFirstRunLevel,clampBuilderLevel,customizationUnlockedAt,contentForLevel,editorContentIds,BROKEN_GALLERY_ID} from './builder-level.mjs';
const refreshSelectors=[];

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
const encounter=()=>({enemyTypes:[0,1,2].map(i=>document.querySelector(`input[name="guard-${i}"]:checked`)?.value||'none'),trapTypes:TRAP_IDS.filter(id=>document.querySelector(`[data-choice="${id}"]`)?.checked),supportTypes:SUPPORT_IDS.filter(id=>document.querySelector(`[data-choice="${id}"]`)?.checked)});
const usedBudget=e=>encounterCost(catalog,e);
const labels=(ids,kind)=>ids.filter(id=>id!=='none').map(id=>kind==='monster'?catalog.enemies[id]?.name:model.items?.[id]?.name||model.items?.[id]?.label||id);
function context(){const e=encounter(),estimate=estimateEncounter({catalog,model,runnerId:invite.runnerId,runner,encounter:e});return{runnerName:runner.name,runnerLevel:runner.level,roomName:selectedSpec().name,roomIndex,roomCount:specs.length,estimatedHpPercent:estimate.estimatedHpPercent,usedBudget:usedBudget(e),totalBudget:model.budget||100,activePanel,monsters:labels(e.enemyTypes,'monster'),traps:labels(e.trapTypes,'item'),supports:labels(e.supportTypes,'item'),accountServiceAvailable:accountServiceAvailable()};}
function show(){for(const refresh of refreshSelectors)refresh();const view=buildReceiverView({session,context:context()});for(const root of document.querySelectorAll('[data-screen]'))root.hidden=root.dataset.screen!==view.shell.state;requestAnimationFrame(()=>$(view.shell.headingId)?.focus());renderCurrent(view);$('receiverNav').hidden=view.kind==='runtime';$('navBack').hidden=!canTransition(session.journey,'BACK');}
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
function renderCurrent(view){
  const m=view.model;
  if(view.kind==='invitation'){$('senderName').textContent=session.senderName;$('senderHeading').textContent=session.senderName.toUpperCase();$('inviteRunner').textContent=`Level ${runner.level} ${runner.name}`;$('inviteTarget').textContent=`TARGET: ${invite.targetHp}% HP`;$('targetMission').textContent=`Get the Runner to the EXIT with about ${invite.targetHp}% health remaining.`;const inviteGauge=buildEstimateGaugeViewModel({targetHp:invite.targetHp});$('inviteGaugeTarget').textContent=`TARGET ${inviteGauge.targetPercent}%`;renderGaugeMarker('inviteGaugeTarget',inviteGauge.targetPercent);$('targetRules').textContent=`Above ${invite.targetHp}% = too gentle · Below ${invite.targetHp}% = too harsh`;}
  else if(view.kind==='mission'){$('missionTarget').textContent=`~${invite.targetHp}% HP`;$('missionRewardCue').textContent='Closer to target earns more Builder Gold.';$('targetFitCue').textContent=`${m.targetFit.label} · ${m.targetFit.note}`;$('missionRunnerContext').textContent=`${session.senderName}'s Runner has ${runner.hp} HP, ${runner.attack} ATK and ${runner.defense} DEF.`;renderDungeonChooserFrame();renderRoom();}
  else if(view.kind==='customize'){
    $('customizeLocked').hidden=customizationUnlocked;$('customizeEditor').hidden=!customizationUnlocked;$('customizeActions').hidden=!customizationUnlocked;
    if(!customizationUnlocked)return;
    $('dungeonBudget').textContent=m.budget.primary;$('dungeonBudget').dataset.legal=String(m.budget.legal);$('finishCustomize').disabled=!m.canFinish;renderTabs();if(activePanel==='dungeons')drawDungeonCards();
    const estimatedHpPercent=estimateEncounter({catalog,model,runnerId:invite.runnerId,runner,encounter:encounter()}).estimatedHpPercent;
    const gauge=buildEstimateGaugeViewModel({targetHp:invite.targetHp,estimatedHpPercent});
    $('customizeGaugeTarget').textContent=`TARGET ${gauge.targetPercent}%`;renderGaugeMarker('customizeGaugeTarget',gauge.targetPercent);$('customizeGaugeEstimate').hidden=!gauge.hasEstimate;if(gauge.hasEstimate)renderGaugeMarker('customizeGaugeEstimate',gauge.estimatePercent);
    $('outcomeTarget').textContent=`${Math.round(invite.targetHp)}%`;
    $('outcomeEstimate').textContent=gauge.hasEstimate?`${Math.round(gauge.estimatePercent)}%`:'—';
    $('outcomeInterpretation').textContent=outcomeInterpretationLabel(gauge.estimatePercent,invite.targetHp);
  }
  else if(view.kind==='ready'){$('readyTarget').textContent=m.title;$('readySummary').textContent=`${m.roomName} · ${m.budget.primary} · ${m.targetFit.label}`;$('runHero').disabled=!m.canRun;const readyGauge=buildEstimateGaugeViewModel({targetHp:invite.targetHp,estimatedHpPercent:estimateEncounter({catalog,model,runnerId:invite.runnerId,runner,encounter:encounter()}).estimatedHpPercent});$('readyGaugeTarget').textContent=`TARGET ${readyGauge.targetPercent}%`;renderGaugeMarker('readyGaugeTarget',readyGauge.targetPercent);$('readyGaugeEstimate').hidden=!readyGauge.hasEstimate;if(readyGauge.hasEstimate)renderGaugeMarker('readyGaugeEstimate',readyGauge.estimatePercent);$('readyGaugeEstimateLabel').textContent=readyGauge.hasEstimate?`ESTIMATED FINISH ${readyGauge.estimateLabel}`:'';renderReadySelections();}
  else if(view.kind==='runtime'){$('cameraToggle').textContent=m.cameraAction||'OVERVIEW';$('pauseToggle').textContent=m.pauseAction;}
  else if(view.kind==='rewards'){for(const id of REWARDS_DOM_CONTRACT)requiredElement(id);requiredElement('heading-rewards').textContent=m.resultHeading;requiredElement('resultTarget').textContent=`TARGET ${Math.round(m.targetHpPercent)}%`;requiredElement('resultFinished').textContent=`FINISHED ${Math.round(m.actualHpPercent)}%`;requiredElement('resultDifference').textContent=`${m.differenceFromTarget} POINT${m.differenceFromTarget===1?'':'S'} FROM TARGET`;requiredElement('resultScore').textContent=`SCORE ${Math.round(m.score)}`;requiredElement('heroRewardLabel').textContent=m.heroReward.label;requiredElement('heroRewardGold').textContent=m.heroReward.value;requiredElement('builderRewardGold').textContent=m.builderReward.value;renderRewardJourney(m);}
  else if(view.kind==='registration'){$('registrationGoal').textContent=m.carriedGoal;$('registrationRewardPreview').textContent=`This run earned ${m.previewBuilderGold} Builder Gold · ${m.previewHeroGold} Hero Gold (not saved to an account yet).`;$('registrationNotSaved').textContent=m.notSaved;$('createAccount').disabled=!m.accountAction.enabled;$('accountActionStatus').textContent=m.accountAction.enabled?'Continue to create your account or sign in.':m.accountAction.note;}
}
function chooseSessionRoom(){session=selectDungeon(session,selectedSpec().id);session=setEncounter(session,encounter());}
function renderRoom(){const carousel=buildRoomCarousel({rooms:specs,index:roomIndex});$('roomName').textContent=carousel.current.name;$('roomCounter').textContent=carousel.counter;if(selectedRoom())drawPreview($('roomPreview'),selectedRoom().map,selectedRoom().tiles);}
function moveRoom(delta){roomIndex=(roomIndex+delta+specs.length)%specs.length;calibrated=calibrateEncounter({catalog,model,runnerId:invite.runnerId,runner,targetHp:invite.targetHp});applyEncounter(calibrated.encounter);if(session?.journey==='mission')show();}
function monsterCard({name,value,label,cost,summary,icon}){
  const card=document.createElement('label');card.className='card';
  const input=document.createElement('input');input.type='radio';input.name=name;input.value=value;input.className='visually-hidden';
  const body=document.createElement('div');body.className='card-body';
  const strong=document.createElement('strong');strong.textContent=label;
  const costLine=document.createElement('small');costLine.className='card-cost';costLine.textContent=cost!=null?`${cost} BUDGET`:'';
  const summaryLine=document.createElement('small');summaryLine.className='card-effect';summaryLine.textContent=summary||'';
  body.append(strong,summaryLine,costLine);
  card.append(input,icon,body);
  return card;
}
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
  refreshSelectors.length=0;
  const access=editorContentIds(builderLevel,GOVERNED_PRESET_IDS.map(presetById));
  const vm=buildCustomizationCatalog({model,catalog,runnerId:invite.runnerId,runner,access}),monsterPanel=document.querySelector('[data-custom-panel="monsters"]');
  monsterPanel.replaceChildren();
  for(let i=0;i<3;i++){
    const group=document.createElement('div');group.className='guard-group';
    const title=document.createElement('strong');title.textContent=`GUARD ${i+1}`;group.append(title);
    const row=document.createElement('div');row.className='card-row';
    row.append(monsterCard({name:`guard-${i}`,value:'none',label:'EMPTY',cost:0,summary:'No monster',icon:emptySlotCardIcon()}));
    for(const item of vm.monsters)row.append(monsterCard({name:`guard-${i}`,value:item.id,label:item.label,cost:item.cost,summary:item.summary,icon:flareArtIcon(item.id)||monsterCardIcon()}));
    group.append(row);monsterPanel.append(group);refreshSelectors.push(installPagedSelector(row,`monster for guard ${i+1}`));
  }
  for(const kind of ['traps','supports']){
    const panel=document.querySelector(`[data-custom-panel="${kind}"]`);panel.replaceChildren();
    const row=document.createElement('div');row.className='card-row';
    for(const item of vm[kind])row.append(itemCard(item));
    panel.append(row);refreshSelectors.push(installPagedSelector(row,kind==='traps'?'trap':'support'));
  }
  for(const control of document.querySelectorAll('[name^="guard-"],[data-choice]'))control.addEventListener('change',()=>{session=setEncounter(session,encounter());show();});
  renderDungeonCards();
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
  for(let i=0;i<3;i++){const value=e.enemyTypes[i]||'none';const radio=document.querySelector(`input[name="guard-${i}"][value="${value}"]`)||document.querySelector(`input[name="guard-${i}"][value="none"]`);if(radio)radio.checked=true;}
  const selected=[...(e.trapTypes||[]),...(e.supportTypes||[])];
  for(const id of [...TRAP_IDS,...SUPPORT_IDS]){const box=document.querySelector(`[data-choice="${id}"]`);if(box)box.checked=selected.includes(id);}
  for(const refresh of refreshSelectors)refresh.syncToSelection?.();
}
function renderTabs(){for(const tab of document.querySelectorAll('[data-custom-tab]')){const on=tab.dataset.customTab===activePanel;tab.setAttribute('aria-selected',String(on));document.querySelector(`[data-custom-panel="${tab.dataset.customTab}"]`).hidden=!on;}}
let presetIndex=1; // 0=too easy, 1=just right (default), 2=brutal
const presetList=()=>[dungeonPresets.tooEasy,dungeonPresets.justRight,dungeonPresets.brutal];
function applyPreset(preset){
  const index=specs.findIndex(s=>s.id===preset.roomId);
  if(index>=0)roomIndex=index;
  applyEncounter(preset.encounter);
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
  const names=[...labels(preset.encounter.enemyTypes,'monster'),...labels(preset.encounter.trapTypes,'item'),...labels(preset.encounter.supportTypes,'item')];
  $('presetContents').textContent=names.length?names.join(' · '):'No monsters, traps or support';
  $('presetPosition').textContent=`${presetIndex+1} / 3`;
}
// 002E9: the post-run reward journey (SUCCESS -> PERFORMANCE -> YOU GAINED -> YOUR FRIEND GAINED ->
// LEVEL 2 -> NEW GIZMOS -> keep progressing) is the ONE first-run unlock experience; it supersedes the
// 002E8 lock/unlock ceremony. It is a full-screen modal above the rewards state: the result, receipt
// and reward DOM beneath it is rendered first and is untouched, so dismissing it never navigates.
let heroActorPack=null,journeyShown=false;
const dungeonName=id=>S7_ROOMS[id]?.name||id;
const journeyNameOf=(id,key)=>key==='dungeons'?dungeonName(id):(model.monsters?.[id]?.name||model.items?.[id]?.name||id);
const journeyView=createRewardJourney({
  root:$('rewardJourney'),
  coinSrc:new URL('./assets/tactics-coins.png',import.meta.url).href,
  drawArt:(canvas,key,options)=>drawFlareArt(canvas,key,options),
  drawDungeon:(canvas,roomId)=>{const room=rooms.get(roomId||BROKEN_GALLERY_ID);if(room)drawRoomPreviewTransparent(canvas,room.map,room.tiles);},
  startHero:canvas=>startComposedHeroStance(canvas,heroActorPack),
  reducedMotion:prefersReducedMotion,
  // Direct handoff into the REAL customization flow (the existing rewards -> customize transition and
  // the shared `activePanel`), never a parallel sandbox.
  onTry:panel=>openUnlockedTool(panel),
  onCustomize:()=>openUnlockedTool('monsters'),
  onCreateAccount:()=>{journeyView.dismiss();transition('SAVE_GOAL');},
  onGuest:()=>journeyView.dismiss()
});
function openUnlockedTool(panel){activePanel=panel;journeyView.dismiss();transition('EDIT_DUNGEON');}
function renderRewardJourney(m){
  $('unlockedStatus').hidden=builderLevel<2;$('unlockedStatus').textContent=`BUILDER LEVEL ${builderLevel} · THIS SESSION`;
  if(!justUnlocked||journeyShown)return;
  journeyShown=true;
  try{journeyView.start(buildRewardJourney({result:m,senderName:session.senderName,level:builderLevel,nameOf:journeyNameOf}));}
  catch(error){console.error(error);journeyView.dismiss();}
}
function renderReadySelections(){
  const e=encounter(),wrap=$('readySelections');wrap.replaceChildren();
  const names=[...labels(e.enemyTypes,'monster'),...labels(e.trapTypes,'item'),...labels(e.supportTypes,'item')];
  if(!names.length){const chip=document.createElement('span');chip.className='chip';chip.textContent='No monsters, traps or support selected';wrap.append(chip);return}
  for(const name of names){const chip=document.createElement('span');chip.className='chip';chip.textContent=name;wrap.append(chip);}
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
$('acceptChallenge').addEventListener('click',()=>transition('ACCEPT'));
$('previousRoom').addEventListener('click',()=>moveRoom(-1));$('nextRoom').addEventListener('click',()=>moveRoom(1));
$('useDungeon').addEventListener('click',()=>transition('USE_DUNGEON'));$('openCustomize').addEventListener('click',()=>transition('CUSTOMIZE'));
$('finishCustomize').addEventListener('click',()=>transition('DONE'));$('editDungeon').addEventListener('click',()=>transition('CUSTOMIZE'));
$('editThisDungeon').addEventListener('click',()=>transition('EDIT_DUNGEON'));$('saveGoalBuildOwn').addEventListener('click',()=>transition('SAVE_GOAL'));$('backToRewards').addEventListener('click',()=>transition('BACK_TO_REWARDS'));
$('navBack').addEventListener('click',()=>transition('BACK'));
$('viewRunner').addEventListener('click',openRunnerInspector);
$('closeRunnerInspector').addEventListener('click',closeRunnerInspector);
$('runnerInspector').addEventListener('click',e=>{if(e.target===$('runnerInspector'))closeRunnerInspector();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('runnerInspector').hidden)closeRunnerInspector();});
$('createAccount').addEventListener('click',()=>{if($('createAccount').disabled)return;try{sessionStorage.setItem(FRIEND_GOAL_CLAIM_KEY,JSON.stringify({senderName:session.senderName,runnerId:invite.runnerId,targetHp:invite.targetHp}));}catch(error){console.error(error);}location.href='/quick-dungeon/flare-s8b/';});
$('resetSuggested').addEventListener('click',()=>{applyEncounter(calibrated.encounter);session=setEncounter(session,encounter());show();});
for(const tab of document.querySelectorAll('[data-custom-tab]'))tab.addEventListener('click',()=>{activePanel=tab.dataset.customTab;show();});
$('runHero').addEventListener('click',()=>runtimeStart?.());
let pointer=null;$('roomStage').addEventListener('pointerdown',e=>pointer={x:e.clientX,y:e.clientY});$('roomStage').addEventListener('pointerup',e=>{const direction=pointer&&roomSwipeDirection({startX:pointer.x,startY:pointer.y,endX:e.clientX,endY:e.clientY});pointer=null;if(direction)moveRoom(direction);});
window.__s8aReceiver={get session(){return session;},get encounter(){return encounter();},get roomId(){return selectedSpec().id;},get room(){return selectedRoom();},get runnerAuthority(){return runnerAuthority;},get customizationUnlocked(){return customizationUnlocked;},get builderLevel(){return builderLevel;},get justUnlocked(){return justUnlocked;},setRuntimeStart(fn){runtimeStart=fn;},startRuntime(){chooseSessionRoom();currentAttemptToken=createAttemptToken();session=advanceReceiver(session,'RUN');show();},completeRuntime(result,score){session=advanceReceiver(session,'COMPLETE',{result,score});// Plan the receipt BEFORE any presentation work and never let a payload problem escape (an
      // exception here used to abort completion): see receipt-plan.mjs.
      const plan=planResultReceipt({publicToken,roomId:session.roomId,encounter:session.encounter,rulesVersion:'s8a-1',result,heroGold:session.reward?.heroGold,attemptToken:currentAttemptToken});
      lastReceiptPayload=plan.payload;receiptBlock=plan.block;if(plan.error)console.error(plan.error);
      const grant=grantFirstRunLevel(SESSION_STORE,builderLevel);justUnlocked=grant.leveledUp;if(grant.leveledUp){journeyShown=false;try{applyBuilderLevel(grant.level);}catch(error){console.error(error);}}
      try{show();}catch(error){console.error(error);}finally{void sendResultReceipt();}},replayRuntime(){currentAttemptToken=createAttemptToken();session=advanceReceiver(session,'RUN_AGAIN');show();},runFailed(message){session={...session,journey:'ready'};show();$('readySummary').textContent=`Run could not start: ${message}`;},show};
installRuntime(window.__s8aReceiver);
async function bootReceiver(){try{const [base,game,heroPack,correlatedSnapshot]=await Promise.all([fetch('/quick-dungeon/flare-p0/data/catalog.json').then(r=>r.ok?r.json():Promise.reject(Error('Catalogue unavailable'))),fetch('/quick-dungeon/flare-s7/data/game.json').then(r=>r.ok?r.json():Promise.reject(Error('Game model unavailable'))),loadS3ActorPack(),fetchCorrelatedSnapshot()]);baseCatalog=base;model=extendModelWithLevel2(game);const code=inviteCodeFromLocation(location);invite=code?decodeInviteCode(code,model):new URLSearchParams(location.search).get('demo')==='1'?{runnerId:model.defaultRunner,targetHp:model.defaultTargetHp}:null;if(!invite)throw Error('Challenge invitation is missing or invalid');catalog=extendCatalogWithLevel2(applyRunnerModel(baseCatalog,model,invite.runnerId),model);runnerAuthority=resolveRunnerAuthority({snapshot:correlatedSnapshot,templateMaxHp:catalog.heroes.warrior.maxHp,templateAttack:catalog.heroes.warrior.damage,templateDefense:catalog.heroes.warrior.armor});if(runnerAuthority.source==='snapshot'){catalog.heroes.warrior.maxHp=runnerAuthority.maxHp;catalog.heroes.warrior.damage=runnerAuthority.attack;catalog.heroes.warrior.armor=runnerAuthority.defense;}runner=runnerSummary(model,invite.runnerId,catalog);session=createReceiverSession({invite,senderName:inviteSender(location.search)});renderControls();calibrated=calibrateEncounter({catalog,model,runnerId:invite.runnerId,runner,targetHp:invite.targetHp});applyEncounter(calibrated.encounter);session=setEncounter(session,encounter());dungeonPresets=buildDungeonPresets({catalog,model,runnerId:invite.runnerId,runner,targetHp:invite.targetHp,budget:model.budget,roomIds:specs.map(s=>s.id)});renderDungeonChooser();heroActorPack=heroPack;startComposedHeroStance($('inviteHeroCanvas'),heroPack);await Promise.all(allSpecs.map(async spec=>rooms.set(spec.id,await loadS7StockRoom(spec.id))));$('acceptChallenge').disabled=false;$('loadStatus').textContent='Your Hero-Runner is ready.';show();window.__s8aData={model,catalog,invite,runner,rooms,specs:allSpecs,runnerAuthority,dungeonPresets};}catch(error){console.error(error);if(error?.message==='SNAPSHOT_SERVICE_UNAVAILABLE'||/snapshot/i.test(String(error?.message))){$('heading-invitation').textContent='COULD NOT LOAD THIS RUNNER';$('loadStatus').innerHTML='';const status=document.createElement('span');status.textContent="We couldn't load your friend's Runner data. ";const retry=document.createElement('button');retry.type='button';retry.className='nav-link';retry.textContent='RETRY';retry.addEventListener('click',()=>location.reload());$('loadStatus').append(status,retry);return}$('heading-invitation').textContent='THIS CHALLENGE CANNOT OPEN';$('loadStatus').textContent=error.message;}}
void bootReceiver();

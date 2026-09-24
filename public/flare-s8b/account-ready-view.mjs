import {dailyLoginView} from './daily-login.mjs';
import {dailyTrialView} from './daily-trial.mjs';
import {progressionSummaryView,equipmentUnlockViews,historyViewRows} from './runner-progression-view.mjs';

const SLOT_KEYS=Object.freeze(['weapon','shield','head','chest','hands','legs','feet']);
const SLOT_LABELS=Object.freeze({weapon:'MAIN HAND',shield:'OFF HAND',head:'HEAD',chest:'CHEST',hands:'HANDS',legs:'LEGS',feet:'FEET'});
const EQUIPMENT_SLOTS=Object.freeze(['weapon','shield']);
const ARMOR_SLOTS=Object.freeze(['head','chest','hands','legs','feet']);
const STAT_LABELS=Object.freeze({hp:'HP',attack:'ATK',defense:'DEF'});

const clean=value=>String(value??'').trim();

function governedStat(value,label){
  const number=Number(value);
  if(!Number.isFinite(number)||number<0)throw new Error(`INVALID_AUTHORITATIVE_STAT:${label}`);
  return number;
}

function governedModifier(value,label){
  const number=Number(value);
  if(!Number.isFinite(number))throw new Error(`INVALID_AUTHORITATIVE_MODIFIER:${label}`);
  return number;
}

function modifierLabel(modifiers){
  const parts=[];
  for(const [key,label] of [['hp','HP'],['attack','ATK'],['defense','DEF']]){
    const value=modifiers[key];
    if(value!==0)parts.push(`${value>0?'+':''}${value} ${label}`);
  }
  return parts.join(' · ')||'NO STAT BONUS';
}

function offerName(offerId){
  return offerId.split('-').filter(Boolean).map(part=>part.length===1?part.toUpperCase():`${part[0].toUpperCase()}${part.slice(1)}`).join(' ');
}

export function normalizeProgressionOffers(rows){
  if(!Array.isArray(rows))throw new Error('AUTHORITATIVE_PROGRESSION_OFFERS_REQUIRED');
  const seen=new Set();
  return Object.freeze(rows.map(raw=>{
    const catalogVersion=clean(raw?.catalog_version),offerId=clean(raw?.offer_id);
    const kind=clean(raw?.kind).toUpperCase(),statKey=clean(raw?.stat_key).toLowerCase();
    const statAmount=Number(raw?.stat_amount),goldCost=Number(raw?.gold_cost);
    if(!catalogVersion||!offerId||seen.has(`${catalogVersion}:${offerId}`))throw new Error('AUTHORITATIVE_PROGRESSION_OFFER_ID_INVALID');
    if(kind!=='STAT'||!STAT_LABELS[statKey]||!Number.isInteger(statAmount)||statAmount<=0)throw new Error(`AUTHORITATIVE_PROGRESSION_OFFER_INVALID:${offerId}`);
    if(!Number.isInteger(goldCost)||goldCost<=0)throw new Error(`AUTHORITATIVE_PROGRESSION_PRICE_INVALID:${offerId}`);
    seen.add(`${catalogVersion}:${offerId}`);
    return Object.freeze({
      catalogVersion,offerId,name:offerName(offerId),kind,statKey,statAmount,goldCost,
      effectLabel:`+${statAmount} ${STAT_LABELS[statKey]}`,
      priceLabel:`${goldCost} Gold`
    });
  }));
}

export function progressionOfferState(offer,goldBalance){
  if(offer?.purchased)return Object.freeze({state:'purchased',label:'PURCHASED',disabled:true});
  if(Number(goldBalance)<Number(offer?.goldCost))return Object.freeze({state:'insufficient',label:'NOT ENOUGH GOLD',disabled:true});
  return Object.freeze({state:'available',label:'BUY UPGRADE',disabled:false});
}

export function progressionPurchaseMessage(error){
  const message=clean(error?.message||error).toUpperCase();
  if(message.includes('OFFER_ALREADY_PURCHASED'))return Object.freeze({kind:'known',message:'You already own this upgrade.'});
  if(message.includes('PROJECTED_RUNNER_OUTSIDE_PREFERRED_ENVELOPE'))return Object.freeze({kind:'known',message:'This upgrade is not available for your current Runner build.'});
  if(message.includes('INSUFFICIENT_GOLD'))return Object.freeze({kind:'known',message:'Not enough Gold for this upgrade.'});
  if(message.includes('IDEMPOTENCY_CONFLICT'))return Object.freeze({kind:'known',message:'This purchase request no longer matches the selected upgrade. Close and try again.'});
  return Object.freeze({kind:'unknown',message:'Purchase status is uncertain. Retry this purchase or reload your Runner.'});
}

export function normalizeAuthoritativeRunnerState(state){
  if(!state||typeof state!=='object'||Array.isArray(state))throw new Error('AUTHORITATIVE_RUNNER_STATE_REQUIRED');
  const playerRunnerId=clean(state.player_runner_id);
  const runnerTemplateId=clean(state.runner_template_id);
  const runnerName=clean(state.runner_name);
  if(!playerRunnerId||!runnerTemplateId||!runnerName)throw new Error('AUTHORITATIVE_RUNNER_IDENTITY_REQUIRED');
  if(!state.base_stats||!state.effective_stats)throw new Error('AUTHORITATIVE_RUNNER_STATS_REQUIRED');
  const baseStats=Object.freeze({
    hp:governedStat(state.base_stats.hp,'base_hp'),
    attack:governedStat(state.base_stats.attack,'base_attack'),
    defense:governedStat(state.base_stats.defense,'base_defense')
  });
  const effectiveStats=Object.freeze({
    hp:governedStat(state.effective_stats.hp,'effective_hp'),
    attack:governedStat(state.effective_stats.attack,'effective_attack'),
    defense:governedStat(state.effective_stats.defense,'effective_defense')
  });
  if(!Array.isArray(state.gear)||state.gear.length!==SLOT_KEYS.length)throw new Error('AUTHORITATIVE_GEAR_SEVEN_SLOTS_REQUIRED');
  const bySlot=new Map();
  for(const raw of state.gear){
    const slot=clean(raw?.slot).toLowerCase();
    if(!SLOT_KEYS.includes(slot)||bySlot.has(slot))throw new Error(`AUTHORITATIVE_GEAR_SLOT_INVALID:${slot||'missing'}`);
    const equipped=raw?.equipped===true;
    const modifiers=Object.freeze({
      hp:governedModifier(raw?.modifiers?.hp,'hp'),
      attack:governedModifier(raw?.modifiers?.attack,'attack'),
      defense:governedModifier(raw?.modifiers?.defense,'defense')
    });
    if(equipped){
      const ownershipId=clean(raw?.ownership_id),itemId=clean(raw?.item_id),name=clean(raw?.name);
      if(!ownershipId||!itemId||!name)throw new Error(`AUTHORITATIVE_EQUIPPED_ITEM_REQUIRED:${slot}`);
      bySlot.set(slot,Object.freeze({
        slot,label:SLOT_LABELS[slot],equipped:true,ownershipId,itemId,itemName:name,modifiers,
        modifierLabel:modifierLabel(modifiers),catalogVersion:clean(raw?.catalog_version),
        flareSource:clean(raw?.flare_source),gfx:clean(raw?.gfx)
      }));
    }else{
      if(raw?.ownership_id!=null||raw?.item_id!=null||raw?.name!=null)throw new Error(`AUTHORITATIVE_EMPTY_SLOT_INVALID:${slot}`);
      bySlot.set(slot,Object.freeze({
        slot,label:SLOT_LABELS[slot],equipped:false,ownershipId:null,itemId:null,itemName:null,
        modifiers,modifierLabel:'EMPTY',catalogVersion:'',flareSource:'',gfx:''
      }));
    }
  }
  const gear=Object.freeze(SLOT_KEYS.map(slot=>{
    const row=bySlot.get(slot);
    if(!row)throw new Error(`AUTHORITATIVE_GEAR_SLOT_MISSING:${slot}`);
    return row;
  }));
  return Object.freeze({
    playerRunnerId,runnerTemplateId,runnerName,
    progressionVersion:clean(state.progression_version),catalogVersion:clean(state.catalog_version),
    baseStats,effectiveStats,gear
  });
}

export function buildAccountReadyViewFromBackend(account){
  if(!account?.profile||!account?.runnerState)throw new Error('AUTHORITATIVE_ACCOUNT_STATE_REQUIRED');
  const runnerState=normalizeAuthoritativeRunnerState(account.runnerState);
  const latestGoal=account.savedGoals?.[0]||null;
  const savedGoalLabel=latestGoal
    ?`${latestGoal.source_sender_name||'Friend'} · ${latestGoal.source_runner_name||latestGoal.source_runner_id} · ${latestGoal.target_hp}% HP`
    :'No saved goal yet';
  const gearBySlot=Object.fromEntries(runnerState.gear.map(row=>[row.slot,row]));
  const purchases=Array.isArray(account.progressionPurchases)?account.progressionPurchases:[];
  const purchasedKeys=new Set(purchases
    .filter(row=>clean(row?.player_runner_id)===runnerState.playerRunnerId)
    .map(row=>`${clean(row?.catalog_version)}:${clean(row?.offer_id)}`));
  const progressionOffers=Object.freeze(normalizeProgressionOffers(account.progressionOffers??[]).map(offer=>{
    const purchased=purchasedKeys.has(`${offer.catalogVersion}:${offer.offerId}`);
    return Object.freeze({...offer,purchased,action:progressionOfferState({...offer,purchased},account.goldBalance)});
  }));
  const dailyLogin=dailyLoginView(account.dailyLogin);
  const dailyTrial=account.dailyTrial?dailyTrialView(account.dailyTrial):null;
  const progressionSummary=account.progression?progressionSummaryView(account.progression):null;
  const equipmentUnlocks=account.progression?equipmentUnlockViews({
    progression:account.progression,itemCatalog:account.itemCatalog??[],itemOwnership:account.itemOwnership??[],gear:runnerState.gear
  }):Object.freeze([]);
  const history=historyViewRows(account.progressionHistory??[]);
  return Object.freeze({
    title:'ACCOUNT READY',
    displayName:String(account.profile.display_name||account.identity?.email||'Player'),
    email:String(account.identity?.email||''),
    savedGoalLabel,
    goldBalance:Math.max(0,Number(account.goldBalance)||0),
    dailyLogin,
    dailyTrial,
    progressionSummary,
    equipmentUnlocks,
    history,
    runner:Object.freeze({
      id:runnerState.playerRunnerId,
      templateId:runnerState.runnerTemplateId,
      name:runnerState.runnerName,
      baseStats:runnerState.baseStats,
      stats:runnerState.effectiveStats,
      progressionVersion:runnerState.progressionVersion,
      catalogVersion:runnerState.catalogVersion
    }),
    gear:runnerState.gear,
    equipment:Object.freeze(EQUIPMENT_SLOTS.map(slot=>gearBySlot[slot])),
    armor:Object.freeze(ARMOR_SLOTS.map(slot=>gearBySlot[slot])),
    progressionOffers,
    panels:Object.freeze(['stats','equipment','armor']),
    actions:Object.freeze(['BUILD YOUR CHALLENGE','UPGRADE YOUR RUNNER'])
  });
}

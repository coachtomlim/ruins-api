// P9 AI Encounter Assist — deterministic contract, validator, repair and fallback.
// The AI is advisory only. Every proposed plan is checked and, if necessary, repaired or replaced
// by the existing deterministic Practice game logic (buildS7Challenge/encounterCost/calibrateEncounter/
// estimateEncounter, all frozen S7 authority). This module never grants Gold, XP, items, or stats,
// and never persists the player's brief.
import {ROOM_IDS,MONSTER_IDS,TRAP_IDS,SUPPORT_IDS,normalizeEncounter,encounterCost} from '../flare-s7/game.mjs';
import {calibrateEncounter,estimateEncounter,difficultyCue} from '../flare-s7/calibration.mjs';

export const AI_ENCOUNTER_PLAN_VERSION='s9-ai-encounter-plan-001';
export const AI_BRIEF_MAX_LENGTH=280;
export const AI_DEFAULT_TARGET_HP=60; // the existing Practice product default (PRACTICE_TARGET_HP)
const ENEMY_SLOTS=3;

// Fields the contract may ever contain. Anything else is dropped by validatePlanShape, never trusted.
const ALLOWED_FIELDS=Object.freeze(['roomId','targetHp','enemyTypes','trapTypes','supportTypes','summary']);
// Substrings that must never appear as a *key* anywhere in a provider response, even nested —
// catches prompt-injection attempts to smuggle economy/authority fields regardless of casing/nesting.
const FORBIDDEN_KEY_PATTERN=/gold|xp|reward|stat|level|runner|item|equip|url|html|script|token|secret|key|credential|admin|code/i;

const clean=value=>String(value??'').trim();

export function sanitizePlayerBrief(raw){
  const text=String(raw??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
  return text.slice(0,AI_BRIEF_MAX_LENGTH);
}

export class AIProviderError extends Error{
  constructor(code,message){super(message||code);this.name='AIProviderError';this.code=code}
}

export function parseProviderResponse(raw){
  if(raw==null||raw==='')throw new AIProviderError('EMPTY_RESPONSE','The suggestion service returned nothing.');
  let parsed;
  try{parsed=typeof raw==='string'?JSON.parse(raw):raw}
  catch{throw new AIProviderError('INVALID_JSON','The suggestion service returned an unreadable response.')}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))
    throw new AIProviderError('INVALID_SHAPE','The suggestion service returned an unexpected shape.');
  return parsed;
}

function scanForbiddenKeys(value,path=''){
  if(!value||typeof value!=='object')return [];
  const hits=[];
  for(const key of Object.keys(value)){
    if(FORBIDDEN_KEY_PATTERN.test(key)&&!ALLOWED_FIELDS.includes(key))hits.push(path+key);
    if(value[key]&&typeof value[key]==='object')hits.push(...scanForbiddenKeys(value[key],path+key+'.'));
  }
  return hits;
}

/**
 * Strictly validates the raw candidate against the allow-listed contract fields. Unknown fields are
 * dropped (never trusted, never surfaced). Any candidate carrying an economy/authority-shaped field
 * (gold, xp, reward, stat, level, item grant, url, html, script, credential, ...) is rejected outright
 * — a prompt-injection attempt must never reach the repair step disguised as a legitimate field.
 */
export function validatePlanShape(candidate){
  if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))
    throw new AIProviderError('INVALID_SHAPE','The suggestion was not a plan object.');
  const forbidden=scanForbiddenKeys(candidate);
  if(forbidden.length)throw new AIProviderError('FORBIDDEN_FIELD',`The suggestion contained a disallowed field: ${forbidden[0]}`);

  const out={};
  if('roomId' in candidate)out.roomId=clean(candidate.roomId);
  if('targetHp' in candidate){const n=Number(candidate.targetHp);out.targetHp=Number.isFinite(n)?Math.round(n):undefined}
  if('enemyTypes' in candidate)out.enemyTypes=Array.isArray(candidate.enemyTypes)?candidate.enemyTypes.map(clean):[];
  if('trapTypes' in candidate)out.trapTypes=Array.isArray(candidate.trapTypes)?candidate.trapTypes.map(clean):[];
  if('supportTypes' in candidate)out.supportTypes=Array.isArray(candidate.supportTypes)?candidate.supportTypes.map(clean):[];
  if('summary' in candidate){
    const summary=clean(candidate.summary).replace(/<[^>]*>/g,'').slice(0,160);
    if(/<script|javascript:|on\w+=/i.test(clean(candidate.summary)))throw new AIProviderError('FORBIDDEN_CONTENT','The suggestion summary contained unsafe markup.');
    out.summary=summary;
  }
  return Object.freeze(out);
}

/**
 * Deterministic repair: makes an out-of-range but well-intentioned plan legal wherever it is safe to
 * do so, using only existing governed IDs and the existing budget. Returns {plan, repaired}.
 */
export function repairPlan(candidate,{catalog,budget=100}={}){
  let repaired=false;
  const roomId=ROOM_IDS.includes(candidate.roomId)?candidate.roomId:null;
  if(candidate.roomId&&!roomId)repaired=true;

  let targetHp=Number.isInteger(candidate.targetHp)?candidate.targetHp:AI_DEFAULT_TARGET_HP;
  if(targetHp<1||targetHp>100){targetHp=Math.min(100,Math.max(1,targetHp));repaired=true}

  const legalEnemies=(candidate.enemyTypes||[]).filter(id=>id==='none'||MONSTER_IDS.includes(id));
  if(legalEnemies.length!==(candidate.enemyTypes||[]).length)repaired=true;
  let enemyTypes=legalEnemies.slice(0,ENEMY_SLOTS);
  if(enemyTypes.length<ENEMY_SLOTS){repaired=repaired||enemyTypes.length!==(candidate.enemyTypes||[]).length;while(enemyTypes.length<ENEMY_SLOTS)enemyTypes.push('none')}
  if((candidate.enemyTypes||[]).length>ENEMY_SLOTS)repaired=true;

  let trapTypes=[...new Set((candidate.trapTypes||[]).filter(id=>TRAP_IDS.includes(id)))];
  if(trapTypes.length!==new Set(candidate.trapTypes||[]).size||trapTypes.length!==(candidate.trapTypes||[]).length)repaired=true;
  let supportTypes=[...new Set((candidate.supportTypes||[]).filter(id=>SUPPORT_IDS.includes(id)))];
  if(supportTypes.length!==(candidate.supportTypes||[]).length)repaired=true;

  const encounter=normalizeEncounter({enemyTypes,supportTypes,trapTypes});

  // Deterministic budget trim: drop the lowest-priority extras (traps, then supports, then enemies)
  // until the encounter fits, exactly mirroring the manual customization budget rule.
  if(catalog){
    let cost=encounterCost(catalog,encounter);
    while(cost>budget&&(encounter.trapTypes.length||encounter.supportTypes.length||encounter.enemyTypes.some(x=>x!=='none'))){
      if(encounter.trapTypes.length){encounter.trapTypes.pop()}
      else if(encounter.supportTypes.length){encounter.supportTypes.pop()}
      else{const idx=[...encounter.enemyTypes].reverse().findIndex(x=>x!=='none');if(idx<0)break;encounter.enemyTypes[encounter.enemyTypes.length-1-idx]='none'}
      repaired=true;
      cost=encounterCost(catalog,encounter);
    }
  }

  return Object.freeze({roomId,targetHp,encounter:Object.freeze(encounter),repaired});
}

/**
 * The safety net: a plan built entirely from the existing deterministic calibrator, never from
 * fabricated content. Used whenever a provider plan cannot be safely repaired (unknown/missing room,
 * empty result, provider failure).
 */
export function deterministicFallbackPlan({catalog,model,runnerId,runner,targetHp=AI_DEFAULT_TARGET_HP,roomSpec}={}){
  if(!catalog||!model||!runner||!roomSpec)throw new AIProviderError('FALLBACK_UNAVAILABLE','No governed fallback could be built.');
  const calibrated=calibrateEncounter({catalog,model,runnerId,runner,targetHp});
  return Object.freeze({
    roomId:roomSpec.id,targetHp,encounter:calibrated.encounter,
    estimate:calibrated.estimate,cue:calibrated.cue,
    summary:`Fallback: a calibrated encounter near ${targetHp}% finishing HP.`
  });
}

/**
 * Orchestrates validate -> repair -> (fallback if unsalvageable) -> estimate. This is the single
 * entry point the UI and tests use; it never trusts the provider's numbers for the final estimate.
 */
export function finalizePlan({raw,catalog,model,runnerId,runner,roomSpecsById,budget=100}={}){
  let candidate,usedFallback=false,repaired=false,rejected=false,rejectionReason=null;
  try{
    candidate=validatePlanShape(parseProviderResponse(raw));
  }catch(error){
    rejected=true;rejectionReason=error.code||'INVALID';
    candidate={};
  }

  const {roomId,targetHp,encounter,repaired:wasRepaired}=repairPlan(candidate,{catalog,budget});
  repaired=wasRepaired;
  const roomSpec=roomId?roomSpecsById.get(roomId):null;
  const hasContent=encounter.enemyTypes.some(x=>x!=='none')||encounter.trapTypes.length||encounter.supportTypes.length;

  let finalRoomSpec=roomSpec,finalEncounter=encounter,finalTargetHp=targetHp,summary=candidate.summary||'';

  if(!finalRoomSpec||(rejected&&!hasContent)){
    usedFallback=true;
    const anyRoom=roomSpec||[...roomSpecsById.values()][0];
    const fb=deterministicFallbackPlan({catalog,model,runnerId,runner,targetHp:finalTargetHp,roomSpec:anyRoom});
    finalRoomSpec=roomSpecsById.get(fb.roomId);
    finalEncounter=fb.encounter;
    finalTargetHp=fb.targetHp;
    summary=fb.summary;
  }

  const cost=encounterCost(catalog,finalEncounter);
  if(cost>budget){
    // Should be unreachable after repair/fallback, but never ship an illegal plan under any path.
    usedFallback=true;
    const fb=deterministicFallbackPlan({catalog,model,runnerId,runner,targetHp:finalTargetHp,roomSpec:finalRoomSpec});
    finalEncounter=fb.encounter;finalTargetHp=fb.targetHp;summary=fb.summary;
  }

  const estimate=estimateEncounter({catalog,model,runnerId,runner,encounter:finalEncounter});
  const cue=difficultyCue(estimate.estimatedHpPercent,finalTargetHp);

  return Object.freeze({
    version:AI_ENCOUNTER_PLAN_VERSION,
    roomId:finalRoomSpec.id,roomName:finalRoomSpec.name,
    targetHp:finalTargetHp,encounter:finalEncounter,
    budgetUsed:encounterCost(catalog,finalEncounter),budget,
    estimate,cue,
    summary:summary||(usedFallback?'Calibrated by the game’s existing rules.':'AI-suggested encounter, validated against current game rules.'),
    // isAiGenerated is the single source of truth the UI uses to label a result: it must never say
    // "AI SUGGESTION" for a plan that was actually produced by the deterministic fallback calibrator.
    isAiGenerated:!usedFallback,
    repaired,usedFallback,rejected,rejectionReason
  });
}

// Deterministic Encounter Advisor.
// Self-contained Quick Dungeon application logic: no AI model, provider, network inference,
// Edge Function, provider credential, database write, reward authority, or external service.
// Advice is derived only from governed Builder controls plus the existing deterministic estimator.
import {MONSTER_IDS,TRAP_IDS,SUPPORT_IDS,normalizeEncounter,encounterCost} from '../flare-s7/game.mjs';
import {estimateEncounter,difficultyCue} from '../flare-s7/calibration.mjs';

export const ENCOUNTER_ADVISOR_VERSION='p10-deterministic-encounter-advisor-001';
export const ADVISOR_BRIEF_MAX_LENGTH=280;
export const ADVISOR_DEFAULT_TARGET_HP=60;

const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const subsets=values=>{
  const out=[];
  for(let mask=0;mask<(1<<values.length);mask++)out.push(values.filter((_,i)=>mask&(1<<i)));
  return out;
};
const TRAP_SETS=Object.freeze(subsets(TRAP_IDS).map(Object.freeze));
const SUPPORT_SETS=Object.freeze(subsets(SUPPORT_IDS).map(Object.freeze));
const ENEMY_VALUES=Object.freeze(['none',...MONSTER_IDS]);

export function sanitizeAdvisorBrief(raw){
  return clean(raw).slice(0,ADVISOR_BRIEF_MAX_LENGTH);
}

export function advisorIntent(raw,{currentHpPercent,targetHp=ADVISOR_DEFAULT_TARGET_HP}={}){
  const brief=sanitizeAdvisorBrief(raw).toLowerCase();
  const explicit=brief.match(/(?:near|around|closer to|target|at)\s*(\d{1,3})\s*%?/);
  const explicitTarget=explicit?Number(explicit[1]):null;
  if(Number.isFinite(explicitTarget))targetHp=clamp(Math.round(explicitTarget),1,100);

  let mode='target';
  if(/easier|gentler|less difficult|reduce difficulty|less damage/.test(brief))mode='easier';
  else if(/harder|tougher|more difficult|increase challenge|more danger/.test(brief))mode='harder';
  else if(/another|variation|different|alternative/.test(brief))mode='variation';

  const current=Number(currentHpPercent);
  if(mode==='easier'&&Number.isFinite(current))targetHp=clamp(Math.round(current+15),1,100);
  if(mode==='harder'&&Number.isFinite(current))targetHp=clamp(Math.round(current-15),1,100);
  if(mode==='variation'&&Number.isFinite(current)&&!explicit)targetHp=clamp(Math.round(current),1,100);

  return Object.freeze({mode,targetHp,brief});
}

function encounterKey(e){
  const n=normalizeEncounter(e);
  return JSON.stringify([n.enemyTypes,n.trapTypes,n.supportTypes]);
}

function editDistance(a,b){
  const x=normalizeEncounter(a),y=normalizeEncounter(b);
  let edits=0;
  for(let i=0;i<3;i++)if(x.enemyTypes[i]!==y.enemyTypes[i])edits++;
  for(const id of TRAP_IDS)if(x.trapTypes.includes(id)!==y.trapTypes.includes(id))edits++;
  for(const id of SUPPORT_IDS)if(x.supportTypes.includes(id)!==y.supportTypes.includes(id))edits++;
  return edits;
}

function describeChange(current,next){
  const a=normalizeEncounter(current),b=normalizeEncounter(next),parts=[];
  for(let i=0;i<3;i++)if(a.enemyTypes[i]!==b.enemyTypes[i]){
    if(a.enemyTypes[i]==='none')parts.push(`add ${b.enemyTypes[i]}`);
    else if(b.enemyTypes[i]==='none')parts.push(`remove ${a.enemyTypes[i]}`);
    else parts.push(`replace ${a.enemyTypes[i]} with ${b.enemyTypes[i]}`);
  }
  for(const id of TRAP_IDS){
    if(!a.trapTypes.includes(id)&&b.trapTypes.includes(id))parts.push(`add ${id}`);
    if(a.trapTypes.includes(id)&&!b.trapTypes.includes(id))parts.push(`remove ${id}`);
  }
  for(const id of SUPPORT_IDS){
    if(!a.supportTypes.includes(id)&&b.supportTypes.includes(id))parts.push(`add ${id}`);
    if(a.supportTypes.includes(id)&&!b.supportTypes.includes(id))parts.push(`remove ${id}`);
  }
  return parts.length?parts.join('; '):'keep the current controls';
}

export function enumerateLegalEncounters({catalog,budget=100}={}){
  if(!catalog)throw new Error('ADVISOR_CATALOG_REQUIRED');
  const out=[],seen=new Set();
  for(const a of ENEMY_VALUES)for(const b of ENEMY_VALUES)for(const c of ENEMY_VALUES){
    for(const trapTypes of TRAP_SETS)for(const supportTypes of SUPPORT_SETS){
      const encounter=normalizeEncounter({enemyTypes:[a,b,c],trapTypes,supportTypes});
      const key=encounterKey(encounter);
      if(seen.has(key))continue;
      seen.add(key);
      let cost;
      try{cost=encounterCost(catalog,encounter)}catch{continue}
      if(cost<=budget)out.push(Object.freeze({encounter:Object.freeze(encounter),cost}));
    }
  }
  return Object.freeze(out);
}

export function adviseEncounter({
  brief='',catalog,model,runnerId,runner,currentEncounter,targetHp=ADVISOR_DEFAULT_TARGET_HP,
  budget=100,limit=3
}={}){
  if(!catalog||!model||!runner)throw new Error('ADVISOR_CONTEXT_REQUIRED');
  const current=normalizeEncounter(currentEncounter||{});
  const currentEstimate=estimateEncounter({catalog,model,runnerId,runner,encounter:current});
  const intent=advisorIntent(brief,{currentHpPercent:currentEstimate.estimatedHpPercent,targetHp});
  const currentKey=encounterKey(current);
  const candidates=[];

  for(const row of enumerateLegalEncounters({catalog,budget})){
    const key=encounterKey(row.encounter);
    if(intent.mode==='variation'&&key===currentKey)continue;
    const estimate=estimateEncounter({catalog,model,runnerId,runner,encounter:row.encounter});
    const targetDelta=Math.abs(estimate.estimatedHpPercent-intent.targetHp);
    const edits=editDistance(current,row.encounter);
    // Target closeness is primary. Minimal control changes are secondary. Lower cost breaks ties.
    const score=targetDelta*100+edits*5+row.cost/100;
    candidates.push({score,key,edits,...row,estimate});
  }

  candidates.sort((x,y)=>x.score-y.score||x.key.localeCompare(y.key));
  const selected=candidates.slice(0,Math.max(1,Math.min(5,Number(limit)||3))).map((row,index)=>{
    const cue=difficultyCue(row.estimate.estimatedHpPercent,intent.targetHp);
    return Object.freeze({
      rank:index+1,
      version:ENCOUNTER_ADVISOR_VERSION,
      targetHp:intent.targetHp,
      intent:intent.mode,
      encounter:row.encounter,
      budgetUsed:row.cost,
      budget,
      estimate:row.estimate,
      cue,
      edits:row.edits,
      changeSummary:describeChange(current,row.encounter),
      summary:`Suggested adjustment: ${describeChange(current,row.encounter)}. Estimated finish ~${row.estimate.estimatedHpPercent}% HP.`
    });
  });

  if(!selected.length)throw new Error('NO_LEGAL_ADVISOR_VARIATION');
  return Object.freeze({
    version:ENCOUNTER_ADVISOR_VERSION,
    current:Object.freeze({encounter:current,estimate:currentEstimate}),
    intent,
    suggestions:Object.freeze(selected)
  });
}

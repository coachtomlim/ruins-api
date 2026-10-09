// 002E9C — Level 1 governed starter presets and the bounded five-monster extension.
//
// public/flare-s7 and public/flare-s71 are frozen predecessor trees: their encounter model is capped at
// three monsters and a 100 budget (normalizeEncounter slices to 3; buildS7Challenge/validateChallenge refuse
// more than 100). The Owner-approved Level 1 BRUTAL preset is FIVE monsters (Goblin x2 + Skeleton x3, nominal
// content cost 130), so it is layered on here. Nothing in the frozen trees is edited, and the ordinary
// player-authored budget stays 100: the single exception is the exact governed BRUTAL preset below.
import {deriveSlots,gridPath} from '../flare-s2/core.mjs';
import {Simulation} from '../flare-s7/simulation.mjs';
import {buildS7Challenge,encounterCost,monsterSummary,itemSummary,normalizeEncounter} from '../flare-s7/game.mjs';
import {estimateEncounter} from '../flare-s7/calibration.mjs';

export const PLAYER_BUDGET=100;
export const MAX_GOVERNED_ENEMIES=5;
// 002E9D: the Level 2 guard mixer has EIGHT guard slots. That is structural capacity only — the 100 budget still
// decides what is legal (the cheapest monster costs 20, so at most five guards ever fit).
export const MAX_GUARD_SLOTS=8;
export const GOVERNED_BRUTAL_ROOM_ID='iron-labyrinth-08';

const freezeEncounter=e=>Object.freeze({enemyTypes:Object.freeze([...e.enemyTypes]),trapTypes:Object.freeze([...(e.trapTypes||[])]),supportTypes:Object.freeze([...(e.supportTypes||[])])});

// Level 1 starter presets: no Support, no Traps, nothing that is not unlocked at Level 1. Order inside
// enemyTypes is route order (first = nearest the entrance).
export const LEVEL1_PRESETS=Object.freeze([
  Object.freeze({id:'easy',kind:'easy',label:'EASY',roomId:'iron-labyrinth-01',governed:false,encounter:freezeEncounter({enemyTypes:['skeleton','goblin','none']})}),
  Object.freeze({id:'just-nice',kind:'just-nice',label:'JUST NICE',roomId:'iron-labyrinth-03',governed:false,recommended:true,encounter:freezeEncounter({enemyTypes:['skeleton','goblin','skeleton']})}),
  Object.freeze({id:'brutal',kind:'brutal',label:'BRUTAL',roomId:GOVERNED_BRUTAL_ROOM_ID,governed:true,encounter:freezeEncounter({enemyTypes:['goblin','goblin','skeleton','skeleton','skeleton']})})
]);
export const presetByLevel1Id=id=>LEVEL1_PRESETS.find(p=>p.id===id)||null;

const monstersOf=e=>(e?.enemyTypes||[]).filter(id=>id&&id!=='none');
const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);

// The ONLY encounter allowed to exceed the ordinary 100 budget / 3 monsters: the exact governed BRUTAL.
export function isGovernedBrutal(roomId,encounter){
  const b=LEVEL1_PRESETS[2];
  return roomId===b.roomId&&same(monstersOf(encounter),monstersOf(b.encounter))&&!(encounter?.trapTypes||[]).length&&!(encounter?.supportTypes||[]).length;
}

export function monsterCount(encounter){return monstersOf(encounter).length;}

// Full cost of any encounter, including >3 monsters (encounterCost itself only sees three).
export function governedCost(catalog,encounter){
  const e=normalizeEncounter(encounter);
  const extra=monstersOf(encounter).slice(3).reduce((n,id)=>{const spec=catalog.enemies[id];if(!spec)throw Error(`Unknown encounter entry: ${id}`);return n+spec.cost},0);
  return encounterCost(catalog,e)+extra;
}
export function governedHeroGold(catalog,encounter){return monstersOf(encounter).reduce((n,id)=>n+(catalog.enemies[id]?.gold||0),0);}

// Budget rule: every ordinary encounter stays within the eight guard slots AND the 100 budget. Only the exact
// governed BRUTAL preset may exceed the budget (its nominal cost is 130).
export function assertLegalEncounter({roomId,catalog,encounter,budget=PLAYER_BUDGET}){
  const cost=governedCost(catalog,encounter);
  if(isGovernedBrutal(roomId,encounter))return Object.freeze({cost,governed:true});
  if(monstersOf(encounter).length>MAX_GUARD_SLOTS)throw Error(`Maximum ${MAX_GUARD_SLOTS} enemies`);
  if(cost>budget)throw Error(`Budget exceeded: ${cost}/${budget}`);
  return Object.freeze({cost,governed:false});
}

// Would adding one more of `monsterId` (or a trap/support id) to this encounter still be legal? Used by the
// guard mixer so an addition is PREVENTED (with a clear reason) instead of silently accepted.
export function canAddGuard({roomId,catalog,encounter,monsterId,budget=PLAYER_BUDGET}){
  const spec=catalog.enemies[monsterId];
  if(!spec)return Object.freeze({ok:false,reason:'UNKNOWN_MONSTER',message:'That monster is not available.'});
  const count=monstersOf(encounter).length;
  if(count>=MAX_GUARD_SLOTS)return Object.freeze({ok:false,reason:'NO_SLOTS',message:`All ${MAX_GUARD_SLOTS} guard slots are full.`});
  const used=governedCost(catalog,encounter),left=budget-used;
  if(spec.cost>left)return Object.freeze({ok:false,reason:'OVER_BUDGET',message:`Not enough dungeon budget: ${spec.name} costs ${spec.cost} and you have ${Math.max(0,left)} left.`,cost:spec.cost,left:Math.max(0,left)});
  return Object.freeze({ok:true,cost:spec.cost,left});
}

// Same additive estimator formula as flare-s7 estimateEncounter, but over every monster (the original
// ignores a 4th/5th). Falls through to the original for <=3 monsters so ordinary numbers are unchanged.
const hitsBeforeDefeat=(monster,bonus=0)=>Math.max(1,Math.max(1,Math.ceil(monster.hp/Math.max(1,monster.runnerDamage+bonus)))-1);
export function estimateGoverned({catalog,model,runnerId,runner,encounter}){
  if(monstersOf(encounter).length<=3)return estimateEncounter({catalog,model,runnerId,runner,encounter});
  const e=normalizeEncounter(encounter);
  const attackBonus=e.supportTypes.includes('battle-tonic')?2:0,defenseBonus=e.supportTypes.includes('iron-tonic')?2:0;
  let gross=0;
  for(const id of monstersOf(encounter)){const m=monsterSummary(id,model,runnerId,catalog,runner);gross+=Math.max(1,m.attack-runner.defense-defenseBonus)*hitsBeforeDefeat(m,attackBonus);}
  for(const id of e.trapTypes){const trap=itemSummary(id,model);gross+=trap.armorPiercing?trap.damage:Math.max(1,trap.damage-runner.defense-defenseBonus);}
  if(e.supportTypes.includes('small-potion'))gross=Math.max(0,gross-(catalog.items['small-potion']?.heal||0));
  const factor=Number(model?.calibration?.timingFactor)||.75,damage=gross*factor,loss=runner.hp?damage/runner.hp*100:100;
  return Object.freeze({estimatedDamage:Number(damage.toFixed(1)),estimatedHpPercent:Number(Math.max(0,100-loss).toFixed(1)),cost:governedCost(catalog,encounter)});
}

const fnv1a=text=>{let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(36).padStart(7,'0')};
function nearestFree(path,index,used){for(let d=0;d<path.length;d++)for(const i of [index-d,index+d])if(i>0&&i<path.length-1){const p=path[i],key=p.join(',');if(!used.has(key)){used.add(key);return p}}return null}

// Challenge for any encounter with MORE than three monsters (the governed BRUTAL and, from 002E9D, ordinary
// quantity-based Level 2 builds up to eight guards): same shape and the same placement rule as buildS7Challenge
// (route fractions along the spawn->exit path), spread evenly over however many guards there are. Placement is
// deterministic and system-controlled — the player never positions guards.
export const spreadFractions=n=>n<=1?[.5]:Array.from({length:n},(_,i)=>Number((.2+.6*i/(n-1)).toFixed(4)));
const ITEM_FRACTIONS=Object.freeze({'battle-tonic':.16,'iron-tonic':.38,'small-potion':.48,'spike-trap':.63,'dart-trap':.82});
function buildSpreadChallenge({roomId,roomTitle,map,catalog,targetHp,encounter,governed,budget}){
  const types=monstersOf(encounter);
  if(types.length>MAX_GUARD_SLOTS)throw Error(`Maximum ${MAX_GUARD_SLOTS} enemies`);
  const e=normalizeEncounter(encounter);
  const slots=deriveSlots(map,3),path=gridPath(map,slots.spawn,slots.exit);if(!path)throw Error('S7 route unavailable');
  const used=new Set([slots.spawn.join(','),slots.exit.join(',')]),enemies=[],fractions=spreadFractions(types.length);
  for(let i=0;i<types.length;i++){
    if(!catalog.enemies[types[i]])throw Error(`Unknown enemy: ${types[i]}`);
    const at=nearestFree(path,Math.round((path.length-1)*fractions[i]),used);if(!at)throw Error('No legal enemy slot');
    enemies.push({id:`guard-${i+1}`,type:types[i],at});
  }
  const items=[];
  for(const type of [...e.supportTypes,...e.trapTypes]){
    if(!catalog.items[type])throw Error(`Unknown item: ${type}`);
    const at=nearestFree(path,Math.round((path.length-1)*ITEM_FRACTIONS[type]),used);if(!at)throw Error(`No legal ${type} slot`);
    items.push({id:`${type}-${items.length+1}`,type,at});
  }
  const spent=governedCost(catalog,encounter);
  const challenge={version:1,rules:catalog.rules,id:'',title:roomTitle||'Quick Challenge',room:roomId,hero:'warrior',spawn:slots.spawn,exit:slots.exit,budget:governed?spent:budget,targetHp:Number(targetHp),enemies,items};
  if(!Number.isInteger(challenge.targetHp)||challenge.targetHp<1||challenge.targetHp>100)throw Error('Target HP must be 1..100');
  challenge.id=`quick-${fnv1a(JSON.stringify({...challenge,id:undefined}))}`;
  return{challenge,spent,remaining:budget-spent,governed,slots:{...slots,itemSlots:Object.fromEntries(items.map(x=>[x.type,x.at]))}};
}

export function buildRunChallenge({roomId,roomTitle,map,catalog,targetHp,encounter,budget=PLAYER_BUDGET}){
  const legal=assertLegalEncounter({roomId,catalog,encounter,budget});
  if(legal.governed)return buildSpreadChallenge({roomId,roomTitle,map,catalog,targetHp,encounter,governed:true,budget});
  // up to three guards: the frozen S7 builder, byte-for-byte the previous behaviour
  if(monstersOf(encounter).length<=3)return{...buildS7Challenge({roomId,roomTitle,map,catalog,targetHp,encounter,budget}),governed:false};
  return buildSpreadChallenge({roomId,roomTitle,map,catalog,targetHp,encounter,governed:false,budget});
}

// The base Simulation validates budget <= 100 in its constructor. For the governed BRUTAL ONLY the
// constructor is handed a cost-neutral validation copy (structure, reachability and placement are still
// validated); the real catalog and the real challenge are then restored before the run starts, so combat
// uses the true monster stats and `spent` reports the true 130.
class GovernedSimulation extends Simulation{
  constructor(map,challenge,catalog){
    const validationCatalog=structuredClone(catalog);for(const e of Object.values(validationCatalog.enemies))e.cost=0;
    const validationChallenge={...structuredClone(challenge),budget:PLAYER_BUDGET};
    super(map,validationChallenge,validationCatalog);
    this.challenge=structuredClone(challenge);this.catalog=structuredClone(catalog);
    this.budget={spent:challenge.budget,remaining:PLAYER_BUDGET-challenge.budget,governed:true};
    this.reset();
  }
}
export function createRunSimulation({roomId,roomTitle,map,catalog,targetHp,encounter,budget=PLAYER_BUDGET}){
  const built=buildRunChallenge({roomId,roomTitle,map,catalog,targetHp,encounter,budget});
  const sim=built.governed?new GovernedSimulation(map,built.challenge,catalog):new Simulation(map,built.challenge,catalog);
  return{built,sim};
}

const INTERPRETATION=Object.freeze({
  easy:(est,target)=>`Estimated finish ~${est}% HP. Likely too gentle for the ${target}% target.`,
  'just-nice':(est,target)=>`Estimated finish ~${est}% HP. Closest starting setup to the ${target}% target.`,
  brutal:(est,target)=>`Estimated finish ~${est}% HP. Likely too harsh, but the Runner should still have a chance to clear.`
});

// The three player-facing Level 1 choices with their estimator numbers attached. Compositions are fixed
// Owner authority — they are NOT recomputed from the target, so no estimator tuning can alter them.
export function buildLevel1Presets({catalog,model,runnerId,runner,targetHp}={}){
  const target=Number(targetHp);if(!Number.isFinite(target))throw new Error('Target HP unavailable');
  return Object.freeze(LEVEL1_PRESETS.map(p=>{
    const estimate=estimateGoverned({catalog,model,runnerId,runner,encounter:p.encounter});
    return Object.freeze({...p,targetHp:target,estimatedHpPercent:estimate.estimatedHpPercent,contentCost:governedCost(catalog,p.encounter),monsterCount:monsterCount(p.encounter),heroGoldPotential:governedHeroGold(catalog,p.encounter),interpretation:INTERPRETATION[p.kind](Math.round(estimate.estimatedHpPercent),Math.round(target))});
  }));
}

// "Goblin x2 · Skeleton x3" style grouping for display (route order preserved by first appearance).
export function describeMix(names){
  const counts=new Map();for(const n of names)counts.set(n,(counts.get(n)||0)+1);
  return [...counts].map(([n,c])=>c>1?`${n} ×${c}`:n);
}

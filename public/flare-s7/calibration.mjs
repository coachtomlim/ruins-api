import {encounterCost,monsterSummary,itemSummary,normalizeEncounter} from './game.mjs';

export const S7_CALIBRATION_VERSION='web-flare-s7-calibration-0.1.0';
const LEGACY_PRESETS=Object.freeze([
  {id:'soft',enemyTypes:['goblin','none','none'],supportTypes:['small-potion'],trapTypes:[]},
  {id:'light',enemyTypes:['goblin','goblin','none'],supportTypes:['small-potion'],trapTypes:[]},
  {id:'balanced',enemyTypes:['goblin','skeleton','none'],supportTypes:['small-potion'],trapTypes:[]},
  {id:'firm',enemyTypes:['skeleton','skeleton','none'],supportTypes:['small-potion'],trapTypes:[]},
  {id:'hard',enemyTypes:['skeleton','skeleton','goblin'],supportTypes:[],trapTypes:[]},
  {id:'brutal',enemyTypes:['skeleton','skeleton','goblin'],supportTypes:[],trapTypes:['spike-trap']}
]);
function hitsBeforeDefeat(monster,attackBonus=0){const rounds=Math.max(1,Math.ceil(monster.hp/Math.max(1,monster.runnerDamage+attackBonus)));return Math.max(1,rounds-1)}
export function estimateEncounter({catalog,model,runnerId,runner,encounter}){
  const e=normalizeEncounter(encounter),attackBonus=e.supportTypes.includes('battle-tonic')?2:0,defenseBonus=e.supportTypes.includes('iron-tonic')?2:0;
  let gross=0;for(const id of e.enemyTypes.filter(x=>x!=='none')){const monster=monsterSummary(id,model,runnerId,catalog,runner);gross+=Math.max(1,monster.attack-runner.defense-defenseBonus)*hitsBeforeDefeat(monster,attackBonus)}
  for(const id of e.trapTypes){const trap=itemSummary(id,model);gross+=trap.armorPiercing?trap.damage:Math.max(1,trap.damage-runner.defense-defenseBonus)}
  if(e.supportTypes.includes('small-potion'))gross=Math.max(0,gross-(catalog.items['small-potion']?.heal||0));
  const timingFactor=Number(model?.calibration?.timingFactor)||.75,estimatedDamage=gross*timingFactor,hpLossPct=runner.hp?estimatedDamage/runner.hp*100:100;
  return Object.freeze({estimatedDamage:Number(estimatedDamage.toFixed(1)),estimatedHpPercent:Number(Math.max(0,100-hpLossPct).toFixed(1)),cost:encounterCost(catalog,e)});
}
export function difficultyCue(estimatedHpPercent,targetHp){const delta=estimatedHpPercent-targetHp;if(delta>24)return Object.freeze({id:'easy',label:'Easy',note:'Likely too gentle for this target.'});if(delta>10)return Object.freeze({id:'fair',label:'Fair',note:'A sensible starting point, but you may want more danger.'});if(delta>=-10)return Object.freeze({id:'close',label:'Fair',note:'A credible starting point for this runner and target.'});return Object.freeze({id:'brutal',label:'Brutal',note:'This may hit harder than the target needs.'})}
export function calibrateEncounter({catalog,model,runnerId,runner,targetHp,budget=model.budget||100}){const target=Number(targetHp);if(!Number.isFinite(target))throw Error('Target HP unavailable');const legal=LEGACY_PRESETS.map(encounter=>({encounter,estimate:estimateEncounter({catalog,model,runnerId,runner,encounter})})).filter(x=>x.estimate.cost<=budget);legal.sort((a,b)=>Math.abs(a.estimate.estimatedHpPercent-target)-Math.abs(b.estimate.estimatedHpPercent-target)||a.estimate.cost-b.estimate.cost);if(!legal.length)throw Error('No legal calibrated encounter');const selected=legal[0],cue=difficultyCue(selected.estimate.estimatedHpPercent,target);return Object.freeze({encounter:structuredClone(selected.encounter),estimate:selected.estimate,cue})}
export function presetById(id){const found=LEGACY_PRESETS.find(x=>x.id===id);return found?structuredClone(found):null}

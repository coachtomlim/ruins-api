import {encounterCost,monsterSummary,trapSummary} from '../flare-s5/game.mjs';

export const S6_VERSION='web-flare-s6-0.2.0';

const PRESETS=Object.freeze([
  {id:'soft',enemyTypes:['goblin','none','none'],potion:true,trap:false},
  {id:'light',enemyTypes:['goblin','goblin','none'],potion:true,trap:false},
  {id:'balanced',enemyTypes:['goblin','skeleton','none'],potion:true,trap:false},
  {id:'firm',enemyTypes:['skeleton','skeleton','none'],potion:true,trap:false},
  {id:'hard',enemyTypes:['skeleton','skeleton','goblin'],potion:false,trap:false},
  {id:'brutal',enemyTypes:['skeleton','skeleton','goblin'],potion:false,trap:true}
]);

function hitsBeforeDefeat(monster){
  const rounds=Math.max(1,Math.ceil(monster.hp/Math.max(1,monster.runnerDamage)));
  return Math.max(1,rounds-1);
}

export function estimateEncounter({catalog,model,runnerId,runner,encounter}){
  const monsters=(encounter.enemyTypes||[]).filter(x=>x&&x!=='none').map(id=>monsterSummary(id,model,runnerId,catalog,runner));
  let gross=0;
  for(const monster of monsters)gross+=monster.damageToRunner*hitsBeforeDefeat(monster);
  if(encounter.trap){const trap=trapSummary({items:model.items});gross+=Math.max(1,trap.damage-runner.defense)}
  if(encounter.potion)gross=Math.max(0,gross-(catalog.items['small-potion']?.heal||0));
  const timingFactor=Number(model?.calibration?.timingFactor)||0.75;
  const estimatedDamage=gross*timingFactor;
  const hpLossPct=runner.hp?estimatedDamage/runner.hp*100:100;
  return Object.freeze({estimatedDamage:Number(estimatedDamage.toFixed(1)),estimatedHpPercent:Number(Math.max(0,100-hpLossPct).toFixed(1)),cost:encounterCost(catalog,encounter)});
}

export function difficultyCue(estimatedHpPercent,targetHp){
  const delta=estimatedHpPercent-targetHp;
  if(delta>24)return Object.freeze({id:'easy',label:'Easy',note:'Likely too gentle for this target.'});
  if(delta>10)return Object.freeze({id:'fair',label:'Fair',note:'A sensible starting point, but you may want more danger.'});
  if(delta>=-10)return Object.freeze({id:'close',label:'Fair',note:'A credible starting point for this runner and target.'});
  return Object.freeze({id:'brutal',label:'Brutal',note:'This may hit harder than the target needs.'});
}

export function calibrateEncounter({catalog,model,runnerId,runner,targetHp,budget=model.budget||100}){
  const target=Number(targetHp);if(!Number.isFinite(target))throw Error('Target HP unavailable');
  const legal=PRESETS.map(encounter=>({encounter,estimate:estimateEncounter({catalog,model,runnerId,runner,encounter})})).filter(x=>x.estimate.cost<=budget);
  if(!legal.length)throw Error('No legal calibrated encounter');
  legal.sort((a,b)=>Math.abs(a.estimate.estimatedHpPercent-target)-Math.abs(b.estimate.estimatedHpPercent-target)||a.estimate.cost-b.estimate.cost);
  const selected=legal[0],cue=difficultyCue(selected.estimate.estimatedHpPercent,target);
  return Object.freeze({encounter:structuredClone(selected.encounter),estimate:selected.estimate,cue});
}

export function presetById(id){const found=PRESETS.find(x=>x.id===id);return found?structuredClone(found):null}
export function calibratedPresetIds(){return PRESETS.map(x=>x.id)}

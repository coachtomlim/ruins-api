import {applyRunnerProgression,RUNNER_EQUIPMENT_SLOTS} from './runner-progression.mjs';

const clean=value=>String(value??'').trim();
const finite=value=>{const n=Number(value);if(!Number.isFinite(n)||n<0)throw new Error('Runner snapshot values must be finite and non-negative');return n};
const copyEquipment=equipment=>Object.freeze(Object.fromEntries(RUNNER_EQUIPMENT_SLOTS.map(slot=>{
  const item=equipment?.[slot];
  return [slot,item?Object.freeze({...item,modifiers:Object.freeze({...item.modifiers})}):null];
})));

export function createRunnerSnapshot({runnerId='',runnerName='',runnerLevel=0,baseRunner,progression={},rulesVersion='',contentVersion=''}={}){
  const id=clean(runnerId);if(!id)throw new Error('runnerId is required');
  const effective=applyRunnerProgression(baseRunner,progression);
  return Object.freeze({
    version:2,
    runnerId:id,
    runnerName:clean(runnerName)||id,
    runnerLevel:finite(runnerLevel),
    stats:Object.freeze({hp:effective.hp,attack:effective.attack,defense:effective.defense}),
    base:Object.freeze({...effective.base}),
    permanent:Object.freeze({...effective.statBonuses}),
    equipmentBonuses:Object.freeze({...effective.equipmentBonuses}),
    equipment:copyEquipment(effective.equipment),
    rulesVersion:clean(rulesVersion),
    contentVersion:clean(contentVersion)
  });
}

export function challengeRunnerSnapshot(snapshot){
  if(!snapshot?.runnerId||!snapshot?.stats)throw new Error('Valid runner snapshot is required');
  return structuredClone(snapshot);
}

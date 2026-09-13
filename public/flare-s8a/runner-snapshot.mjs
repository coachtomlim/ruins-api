import {applyRunnerProgression} from './runner-progression.mjs';

const clean=value=>String(value??'').trim();
const finite=value=>{const n=Number(value);if(!Number.isFinite(n)||n<0)throw new Error('Runner snapshot values must be finite and non-negative');return n};

export function createRunnerSnapshot({runnerId='',runnerName='',runnerLevel=0,baseRunner,progression={},rulesVersion='',contentVersion=''}={}){
  const id=clean(runnerId);if(!id)throw new Error('runnerId is required');
  const effective=applyRunnerProgression(baseRunner,progression);
  return Object.freeze({
    version:1,
    runnerId:id,
    runnerName:clean(runnerName)||id,
    runnerLevel:finite(runnerLevel),
    stats:Object.freeze({hp:effective.hp,attack:effective.attack,defense:effective.defense}),
    base:Object.freeze({...effective.base}),
    permanent:Object.freeze({...effective.statBonuses}),
    equipment:Object.freeze({
      weapon:effective.equipment.weapon?Object.freeze({...effective.equipment.weapon,modifiers:Object.freeze({...effective.equipment.weapon.modifiers})}):null,
      armor:effective.equipment.armor?Object.freeze({...effective.equipment.armor,modifiers:Object.freeze({...effective.equipment.armor.modifiers})}):null
    }),
    rulesVersion:clean(rulesVersion),
    contentVersion:clean(contentVersion)
  });
}

export function challengeRunnerSnapshot(snapshot){
  if(!snapshot?.runnerId||!snapshot?.stats)throw new Error('Valid runner snapshot is required');
  return structuredClone(snapshot);
}

export const RUNNER_STAT_KEYS=Object.freeze(['hp','attack','defense']);
export const RUNNER_EQUIPMENT_SLOTS=Object.freeze(['weapon','shield','head','chest','hands','legs','feet']);
export const RUNNER_ARMOR_SLOTS=Object.freeze(['head','chest','hands','legs','feet']);

const finiteNonNegative=value=>{
  const n=Number(value);
  if(!Number.isFinite(n)||n<0)throw new Error('Runner progression values must be finite and non-negative');
  return n;
};

export function normalizeModifiers(value={}){
  return Object.freeze({
    hp:finiteNonNegative(value.hp??0),
    attack:finiteNonNegative(value.attack??0),
    defense:finiteNonNegative(value.defense??0)
  });
}

export function normalizeOwnedEquipment(asset,slot){
  if(asset==null)return null;
  if(!RUNNER_EQUIPMENT_SLOTS.includes(slot))throw new Error(`Unknown equipment slot: ${slot}`);
  const id=String(asset.id||'').trim();
  if(!id)throw new Error(`${slot} asset id is required`);
  if(asset.slot&&asset.slot!==slot)throw new Error(`${id} cannot be equipped in ${slot}`);
  return Object.freeze({id,slot,modifiers:normalizeModifiers(asset.modifiers)});
}

export function equipmentModifiers(equipment={}){
  const total={hp:0,attack:0,defense:0};
  for(const slot of RUNNER_EQUIPMENT_SLOTS){
    const mods=equipment?.[slot]?.modifiers;if(!mods)continue;
    for(const key of RUNNER_STAT_KEYS)total[key]+=finiteNonNegative(mods[key]??0);
  }
  return Object.freeze(total);
}

export function applyRunnerProgression(baseRunner,progression={}){
  if(!baseRunner)throw new Error('Base runner is required');
  const base=Object.freeze({
    hp:finiteNonNegative(baseRunner.hp),
    attack:finiteNonNegative(baseRunner.attack),
    defense:finiteNonNegative(baseRunner.defense)
  });
  const training=normalizeModifiers(progression.statBonuses||{}),input=progression.equipment||{},equipped={};
  for(const slot of RUNNER_EQUIPMENT_SLOTS)equipped[slot]=normalizeOwnedEquipment(input[slot]??progression[slot]??null,slot);
  const gear=equipmentModifiers(equipped);
  return Object.freeze({
    hp:base.hp+training.hp+gear.hp,
    attack:base.attack+training.attack+gear.attack,
    defense:base.defense+training.defense+gear.defense,
    base,
    statBonuses:training,
    equipmentBonuses:gear,
    equipment:Object.freeze(equipped)
  });
}

export function runnerProgressionPurpose(){
  return Object.freeze({
    currency:'GOLD',
    headline:'USE GOLD TO UPGRADE YOUR RUNNER',
    categories:Object.freeze(['Stats','Equipment','Armor'])
  });
}

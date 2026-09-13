export const RUNNER_STAT_KEYS=Object.freeze(['hp','attack','defense']);
export const RUNNER_EQUIPMENT_SLOTS=Object.freeze(['weapon','armor']);

const finiteNonNegative=value=>{
  const n=Number(value);
  if(!Number.isFinite(n)||n<0)throw new Error('Runner progression values must be finite and non-negative');
  return n;
};

function modifiers(value={}){
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
  return Object.freeze({id,slot,modifiers:modifiers(asset.modifiers)});
}

export function applyRunnerProgression(baseRunner,{statBonuses={},weapon=null,armor=null}={}){
  if(!baseRunner)throw new Error('Base runner is required');
  const base=Object.freeze({
    hp:finiteNonNegative(baseRunner.hp),
    attack:finiteNonNegative(baseRunner.attack),
    defense:finiteNonNegative(baseRunner.defense)
  });
  const training=modifiers(statBonuses),equippedWeapon=normalizeOwnedEquipment(weapon,'weapon'),equippedArmor=normalizeOwnedEquipment(armor,'armor');
  const weaponMods=equippedWeapon?.modifiers||modifiers(),armorMods=equippedArmor?.modifiers||modifiers();
  return Object.freeze({
    hp:base.hp+training.hp+weaponMods.hp+armorMods.hp,
    attack:base.attack+training.attack+weaponMods.attack+armorMods.attack,
    defense:base.defense+training.defense+weaponMods.defense+armorMods.defense,
    base,
    statBonuses:training,
    equipment:Object.freeze({weapon:equippedWeapon,armor:equippedArmor})
  });
}

export function runnerProgressionPurpose(){
  return Object.freeze({
    currency:'GOLD',
    headline:'USE GOLD TO UPGRADE YOUR RUNNER',
    categories:Object.freeze(['Stats','Equipment','Armor'])
  });
}

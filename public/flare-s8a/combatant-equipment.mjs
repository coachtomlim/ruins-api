import {RUNNER_EQUIPMENT_SLOTS,normalizeOwnedEquipment,equipmentModifiers} from './runner-progression.mjs';

const finite=value=>{const n=Number(value);if(!Number.isFinite(n)||n<0)throw new Error('Combatant base stats must be finite and non-negative');return n};

export function normalizeCombatantEquipment(loadout={}){
  const equipment={};
  for(const slot of RUNNER_EQUIPMENT_SLOTS)equipment[slot]=normalizeOwnedEquipment(loadout?.[slot]??null,slot);
  return Object.freeze(equipment);
}

export function applyCombatantEquipment(baseStats,loadout={}){
  if(!baseStats)throw new Error('Combatant base stats are required');
  const base=Object.freeze({hp:finite(baseStats.hp),attack:finite(baseStats.attack),defense:finite(baseStats.defense)});
  const equipment=normalizeCombatantEquipment(loadout),bonus=equipmentModifiers(equipment);
  return Object.freeze({
    hp:base.hp+bonus.hp,
    attack:base.attack+bonus.attack,
    defense:base.defense+bonus.defense,
    base,
    equipment,
    equipmentBonuses:bonus
  });
}

export function monsterCombatStats({baseStats,equipment={}}={}){
  return applyCombatantEquipment(baseStats,equipment);
}

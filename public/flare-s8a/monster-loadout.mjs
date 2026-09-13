import {applyCombatantEquipment} from './combatant-equipment.mjs';

const clean=value=>String(value??'').trim();

export function createMonsterProfile({monsterId,name='',baseStats,equipment={}}={}){
  const id=clean(monsterId);if(!id)throw new Error('monsterId is required');
  const effective=applyCombatantEquipment(baseStats,equipment);
  return Object.freeze({
    monsterId:id,
    name:clean(name)||id,
    baseStats:Object.freeze({...effective.base}),
    equipment:effective.equipment,
    equipmentBonuses:effective.equipmentBonuses,
    effectiveStats:Object.freeze({hp:effective.hp,attack:effective.attack,defense:effective.defense})
  });
}

export function legacyMonsterProfile({monsterId,name='',effectiveStats}={}){
  const id=clean(monsterId);if(!id)throw new Error('monsterId is required');
  const e=applyCombatantEquipment(effectiveStats,{});
  return Object.freeze({monsterId:id,name:clean(name)||id,legacyEffective:true,baseStats:e.base,equipment:e.equipment,equipmentBonuses:e.equipmentBonuses,effectiveStats:Object.freeze({hp:e.hp,attack:e.attack,defense:e.defense})});
}

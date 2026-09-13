import {RUNNER_EQUIPMENT_SLOTS} from './runner-progression.mjs';
import {equipmentItemById} from './equipment-catalog.mjs';
import {createMonsterProfile} from './monster-loadout.mjs';

const clean=value=>String(value??'').trim();

export function monsterEquipmentFromItemIds({equipmentCatalog,loadout={}}={}){
  const equipment={};
  for(const slot of RUNNER_EQUIPMENT_SLOTS){
    const itemId=clean(loadout?.[slot]);
    if(!itemId){equipment[slot]=null;continue;}
    const item=equipmentItemById(equipmentCatalog,itemId);
    if(item.slot!==slot)throw new Error(`${item.id} cannot be used in ${slot}`);
    equipment[slot]=Object.freeze({id:item.id,slot:item.slot,modifiers:item.modifiers});
  }
  return Object.freeze(equipment);
}

export function createEquippedMonster({monsterId,name='',baseStats,equipmentCatalog,loadout={}}={}){
  return createMonsterProfile({monsterId,name,baseStats,equipment:monsterEquipmentFromItemIds({equipmentCatalog,loadout})});
}

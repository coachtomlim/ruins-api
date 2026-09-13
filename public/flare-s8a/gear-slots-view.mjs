import {RUNNER_EQUIPMENT_SLOTS,RUNNER_ARMOR_SLOTS} from './runner-progression.mjs';

const SLOT_LABELS=Object.freeze({weapon:'WEAPON',shield:'SHIELD',head:'HEAD',chest:'CHEST',hands:'HANDS',legs:'LEGS',feet:'FEET'});

export function buildGearSlotsView({loadout={},itemsById={}}={}){
  return Object.freeze(RUNNER_EQUIPMENT_SLOTS.map(slot=>{
    const itemId=loadout?.[slot]||null,item=itemId?itemsById?.[itemId]||null:null;
    return Object.freeze({
      slot,
      label:SLOT_LABELS[slot],
      itemId,
      itemName:item?.name||itemId||null,
      equipped:Boolean(itemId),
      armorPiece:RUNNER_ARMOR_SLOTS.includes(slot),
      emptyLabel:itemId?null:(RUNNER_ARMOR_SLOTS.includes(slot)?'EMPTY — FIND YOUR FIRST PIECE':'EMPTY')
    });
  }));
}

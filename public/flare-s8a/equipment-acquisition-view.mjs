import {RUNNER_EQUIPMENT_SLOTS,RUNNER_ARMOR_SLOTS} from './runner-progression.mjs';

const clean=value=>String(value??'').trim();
const labelForSlot=slot=>({weapon:'WEAPON',shield:'SHIELD',head:'HEAD GEAR',chest:'CHEST ARMOR',hands:'GLOVES',legs:'LEG ARMOR',feet:'FOOTWEAR'})[slot]||slot.toUpperCase();
const sourceLabel=source=>({STARTER:'STARTER GEAR',PURCHASE:'ACQUIRED WITH GOLD',DROP:'DUNGEON DROP',FUTURE_TRANSFER:'TRANSFERRED'})[clean(source)]||clean(source)||'UNSPECIFIED';

export function buildEquipmentAcquisitionView({item,alreadyOwned=false,source=''}={}){
  const id=clean(item?.id),slot=clean(item?.slot);if(!id||!RUNNER_EQUIPMENT_SLOTS.includes(slot))throw new Error('Valid equipment item is required');
  const mods=item.modifiers||{},effects=[];
  if(Number(mods.hp)>0)effects.push(`+${Number(mods.hp)} HP`);
  if(Number(mods.attack)>0)effects.push(`+${Number(mods.attack)} ATK`);
  if(Number(mods.defense)>0)effects.push(`+${Number(mods.defense)} DEF`);
  const firstArmor=!alreadyOwned&&RUNNER_ARMOR_SLOTS.includes(slot);
  return Object.freeze({
    itemId:id,
    itemName:clean(item.name)||id,
    slot,
    slotLabel:labelForSlot(slot),
    effects:Object.freeze(effects),
    firstArmorPiece:firstArmor,
    headline:firstArmor?`NEW ${labelForSlot(slot)}!`:'NEW GEAR!',
    body:firstArmor?`You acquired your first ${labelForSlot(slot).toLowerCase()}. Equip it to use its bonuses.`:'Equip this item to use its bonuses.',
    source:clean(source)||'UNSPECIFIED',
    sourceLabel:sourceLabel(source),
    action:'EQUIP',
    secondaryAction:'KEEP IN INVENTORY'
  });
}

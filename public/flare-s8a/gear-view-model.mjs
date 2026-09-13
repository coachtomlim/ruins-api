import {RUNNER_EQUIPMENT_SLOTS} from './runner-progression.mjs';

const clean=value=>String(value??'').trim();
const label=slot=>({weapon:'WEAPON',shield:'SHIELD',head:'HEAD',chest:'CHEST',hands:'HANDS',legs:'LEGS',feet:'FEET'})[slot]||slot.toUpperCase();

export function buildGearSlotView({loadout={},items=[]}={}){
  const byId=new Map(items.map(item=>[clean(item.id||item.itemId),item]));
  return Object.freeze(RUNNER_EQUIPMENT_SLOTS.map(slot=>{
    const itemId=clean(loadout?.[slot]);
    const item=itemId?byId.get(itemId):null;
    return Object.freeze({slot,label:label(slot),empty:!itemId,itemId:itemId||null,name:item?clean(item.name)||itemId:itemId||'EMPTY'});
  }));
}

export function newGearReveal({item,sourceLabel=''}={}){
  if(!item?.id||!item?.slot)throw new Error('item with id and slot is required');
  const mods=item.modifiers||{};
  const parts=[];
  if(Number(mods.hp)>0)parts.push(`+${Number(mods.hp)} HP`);
  if(Number(mods.attack)>0)parts.push(`+${Number(mods.attack)} ATK`);
  if(Number(mods.defense)>0)parts.push(`+${Number(mods.defense)} DEF`);
  return Object.freeze({eyebrow:'NEW GEAR!',name:clean(item.name)||item.id,slot:label(item.slot),effect:parts.join(' · ')||'No stat bonus',source:clean(sourceLabel),primaryAction:'EQUIP',secondaryAction:'KEEP IN INVENTORY'});
}

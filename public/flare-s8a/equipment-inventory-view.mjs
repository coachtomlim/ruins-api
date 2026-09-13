import {RUNNER_EQUIPMENT_SLOTS} from './runner-progression.mjs';

const clean=value=>String(value??'').trim();
const slotLabel=slot=>({weapon:'WEAPON',shield:'SHIELD',head:'HEAD GEAR',chest:'CHEST ARMOR',hands:'GLOVES',legs:'LEG ARMOR',feet:'FOOTWEAR'})[slot]||slot.toUpperCase();
const sourceLabel=source=>({STARTER:'STARTER GEAR',PURCHASE:'ACQUIRED WITH GOLD',DROP:'DUNGEON DROP',REWARD:'REWARD',UNLOCK:'UNLOCKED'})[clean(source)]||clean(source)||'ACQUIRED';

export function buildEquipmentInventoryItem({item,source='',equipped=false}={}){
  const id=clean(item?.id),slot=clean(item?.slot);if(!id||!RUNNER_EQUIPMENT_SLOTS.includes(slot))throw new Error('Valid equipment item is required');
  const mods=item.modifiers||{},effects=[];
  if(Number(mods.hp)>0)effects.push(`+${Number(mods.hp)} HP`);
  if(Number(mods.attack)>0)effects.push(`+${Number(mods.attack)} ATK`);
  if(Number(mods.defense)>0)effects.push(`+${Number(mods.defense)} DEF`);
  return Object.freeze({
    itemId:id,
    name:clean(item.name)||id,
    slot,
    slotLabel:slotLabel(slot),
    effects:Object.freeze(effects),
    sourceLabel:sourceLabel(source),
    equipped:Boolean(equipped),
    action:equipped?'EQUIPPED':'EQUIP'
  });
}

export function groupInventoryBySlot(items=[]){
  const groups=Object.fromEntries(RUNNER_EQUIPMENT_SLOTS.map(slot=>[slot,[]]));
  for(const item of items){const vm=buildEquipmentInventoryItem(item);groups[vm.slot].push(vm);}
  return Object.freeze(Object.fromEntries(Object.entries(groups).map(([slot,rows])=>[slot,Object.freeze(rows)])));
}

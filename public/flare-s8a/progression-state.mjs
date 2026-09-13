import {RUNNER_EQUIPMENT_SLOTS} from './runner-progression.mjs';

const clean=value=>String(value??'').trim();

function statOffers({catalog={},progressionOffers={}}={}){
  const rows=progressionOffers.statOffers?.length?progressionOffers.statOffers:(catalog.statUpgrades||[]);
  return new Map(rows.map(x=>[x.id,x]));
}

function equipmentItems({catalog={},equipmentCatalog={}}={}){
  const rows=equipmentCatalog.items?.length?equipmentCatalog.items:(catalog.equipment||[]);
  return new Map(rows.map(x=>[x.id,x]));
}

export function deriveRunnerProgressionState({catalog={},progressionOffers={},equipmentCatalog={},statPurchaseOfferIds=[],ownedAssetIds=[],loadout={}}={}){
  const stats=statOffers({catalog,progressionOffers}),items=equipmentItems({catalog,equipmentCatalog}),seen=new Set(),bonuses={hp:0,attack:0,defense:0};
  for(const raw of statPurchaseOfferIds){
    const id=clean(raw);if(!id)continue;
    if(seen.has(id))throw new Error(`Duplicate stat upgrade application: ${id}`);seen.add(id);
    const offer=stats.get(id);if(!offer||offer.kind!=='stat')throw new Error(`Unknown stat upgrade offer: ${id}`);
    bonuses[offer.stat]+=Number(offer.amount)||0;
  }
  const owned=new Set(ownedAssetIds.map(clean).filter(Boolean)),equipment={};
  for(const slot of RUNNER_EQUIPMENT_SLOTS){
    equipment[slot]=null;
    const id=clean(loadout?.[slot]);if(!id)continue;
    if(!owned.has(id))throw new Error(`Equipped ${slot} is not owned`);
    const item=items.get(id);if(!item||item.slot!==slot)throw new Error(`Invalid ${slot} item: ${id}`);
    equipment[slot]=Object.freeze({id:item.id,slot:item.slot,modifiers:Object.freeze({...item.modifiers})});
  }
  return Object.freeze({statBonuses:Object.freeze(bonuses),equipment:Object.freeze(equipment),...equipment});
}

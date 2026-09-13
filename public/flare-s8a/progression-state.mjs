const clean=value=>String(value??'').trim();

function byId(catalog={}){
  return new Map([...(catalog.statUpgrades||[]),...(catalog.equipment||[])].map(x=>[x.id,x]));
}

export function deriveRunnerProgressionState({catalog,statPurchaseOfferIds=[],ownedAssetIds=[],loadout={}}={}){
  const offers=byId(catalog),seen=new Set(),bonuses={hp:0,attack:0,defense:0};
  for(const raw of statPurchaseOfferIds){
    const id=clean(raw);if(!id)continue;
    if(seen.has(id))throw new Error(`Duplicate stat upgrade application: ${id}`);seen.add(id);
    const offer=offers.get(id);if(!offer||offer.kind!=='stat')throw new Error(`Unknown stat upgrade offer: ${id}`);
    bonuses[offer.stat]+=Number(offer.amount)||0;
  }
  const owned=new Set(ownedAssetIds.map(clean).filter(Boolean));
  const equipment={weapon:null,armor:null};
  for(const slot of ['weapon','armor']){
    const id=clean(loadout?.[slot]);if(!id)continue;
    if(!owned.has(id))throw new Error(`Equipped ${slot} is not owned`);
    const offer=offers.get(id);if(!offer||offer.kind!=='equipment'||offer.slot!==slot)throw new Error(`Invalid ${slot} offer: ${id}`);
    equipment[slot]=Object.freeze({id:offer.id,slot:offer.slot,modifiers:Object.freeze({...offer.modifiers})});
  }
  return Object.freeze({statBonuses:Object.freeze(bonuses),weapon:equipment.weapon,armor:equipment.armor});
}

import {RUNNER_EQUIPMENT_SLOTS} from './runner-progression.mjs';

const text=value=>String(value??'').trim();

export function activeAssets(records=[]){
  const result=new Map();
  for(const record of records){
    const key=text(record?.assetKey||record?.id);
    if(key&&!record?.revokedAt)result.set(key,record);
  }
  return result;
}

export function validateEquip({playerId,runnerId,slot,assetId,offer,assets=[]}={}){
  const player=text(playerId),runner=text(runnerId),asset=text(assetId),targetSlot=text(slot);
  if(!player||!runner||!asset)throw new Error('playerId, runnerId and assetId are required');
  if(!RUNNER_EQUIPMENT_SLOTS.includes(targetSlot))throw new Error(`Unknown equipment slot: ${targetSlot}`);
  if(offer?.slot&&offer.slot!==targetSlot)throw new Error(`${asset} cannot be equipped in ${targetSlot}`);
  const row=activeAssets(assets).get(asset);
  if(!row||text(row.playerId)!==player)throw new Error('Asset is not available to this player');
  return Object.freeze({playerId:player,runnerId:runner,slot:targetSlot,assetId:asset});
}

export function loadoutView({weapon=null,armor=null}={}){
  return Object.freeze({weapon:weapon?text(weapon):null,armor:armor?text(armor):null});
}

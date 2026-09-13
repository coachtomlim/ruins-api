import {STARTER_CLUB,STARTER_SHIELD} from '../flare-s8a/starter-loadout.mjs';

const clean=value=>String(value??'').trim();

export function starterRunnerState({runnerId='warrior-l1'}={}){
  const id=clean(runnerId);if(!id)throw new Error('runnerId is required');
  return Object.freeze({
    runnerId:id,
    statOfferIds:Object.freeze([]),
    ownedAssetIds:Object.freeze([STARTER_CLUB.id,STARTER_SHIELD.id]),
    loadout:Object.freeze({weapon:STARTER_CLUB.id,shield:STARTER_SHIELD.id,head:null,chest:null,hands:null,legs:null,feet:null})
  });
}

export function starterOwnershipRecords({playerId,runnerId='warrior-l1'}={}){
  const player=clean(playerId),runner=clean(runnerId);if(!player||!runner)throw new Error('playerId and runnerId are required');
  return Object.freeze([STARTER_CLUB,STARTER_SHIELD].map(item=>{
    const ownershipId=`starter-${player}-${runner}-${item.id}`;
    return Object.freeze({
      ownershipId,
      playerId:player,
      runnerId:runner,
      assetKey:item.id,
      itemId:item.id,
      slot:item.slot,
      acquisitionReason:'STARTER_GRANT',
      sourceId:`starter:${runner}`,
      idempotencyKey:`starter:${player}:${runner}:${item.id}`,
      ledgerEntryId:null
    });
  }));
}

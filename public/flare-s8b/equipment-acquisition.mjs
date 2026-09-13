import {RUNNER_EQUIPMENT_SLOTS} from '../flare-s8a/runner-progression.mjs';

export const EQUIPMENT_ACQUISITION_REASONS=Object.freeze(['STARTER_GRANT','PURCHASE','REWARD','DROP','UNLOCK']);
const clean=value=>String(value??'').trim();

export function normalizeEquipmentAcquisition({ownershipId,playerId,runnerId,itemId,slot,reason,sourceId='',ledgerEntryId=null}={}){
  const ownership=clean(ownershipId),player=clean(playerId),runner=clean(runnerId),item=clean(itemId),targetSlot=clean(slot),why=clean(reason);
  if(!ownership||!player||!runner||!item)throw new Error('ownershipId, playerId, runnerId and itemId are required');
  if(!RUNNER_EQUIPMENT_SLOTS.includes(targetSlot))throw new Error(`Unknown equipment slot: ${targetSlot}`);
  if(!EQUIPMENT_ACQUISITION_REASONS.includes(why))throw new Error(`Unsupported acquisition reason: ${why}`);
  if(why==='PURCHASE'&&!clean(ledgerEntryId))throw new Error('Purchased equipment requires a Gold ledger entry');
  if(why!=='PURCHASE'&&ledgerEntryId!=null&&clean(ledgerEntryId))throw new Error(`${why} equipment must not require a purchase ledger debit`);
  return Object.freeze({ownershipId:ownership,playerId:player,runnerId:runner,itemId:item,slot:targetSlot,reason:why,sourceId:clean(sourceId),ledgerEntryId:why==='PURCHASE'?clean(ledgerEntryId):null});
}

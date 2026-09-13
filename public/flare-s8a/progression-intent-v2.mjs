import {quoteProgressionOffer} from './progression-quote.mjs';

const clean=value=>String(value??'').trim();

export function progressionIntentV2({playerId,runnerId,offers,equipmentCatalog,offerId,goldBalance,idempotencyKey}={}){
  const player=clean(playerId),runner=clean(runnerId),key=clean(idempotencyKey);
  if(!player||!runner||!key)throw new Error('playerId, runnerId and idempotencyKey are required');
  const quote=quoteProgressionOffer({offers,equipmentCatalog,offerId,goldBalance});
  if(!quote.affordable)throw new Error('Insufficient Gold');
  const reasonCode=quote.kind==='stat'?'RUNNER_STAT_UPGRADE':'EQUIPMENT_PURCHASE';
  return Object.freeze({playerId:player,runnerId:runner,offerId:quote.offerId,itemId:quote.itemId,amount:-quote.cost,currency:'GOLD',reasonCode,idempotencyKey:key});
}

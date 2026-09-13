import {RUNNER_ARMOR_SLOTS} from './runner-progression.mjs';

const clean=value=>String(value??'').trim();
const money=value=>{const n=Number(value);if(!Number.isInteger(n)||n<0)throw new Error('Gold balance must be a non-negative integer');return n};

export function progressionOfferById(catalog,offerId){
  const id=clean(offerId);if(!id)throw new Error('offerId is required');
  const all=[...(catalog?.statUpgrades||[]),...(catalog?.equipment||[])];
  const offer=all.find(x=>x.id===id);if(!offer)throw new Error(`Unknown progression offer: ${id}`);
  return offer;
}

export function quoteProgressionPurchase({catalog,offerId,goldBalance}={}){
  const balance=money(goldBalance),offer=progressionOfferById(catalog,offerId),cost=money(offer.goldCost);
  const reasonCode=offer.kind==='stat'?'RUNNER_STAT_UPGRADE':RUNNER_ARMOR_SLOTS.includes(offer.slot)?'ARMOR_PURCHASE':'EQUIPMENT_PURCHASE';
  return Object.freeze({
    offerId:offer.id,
    kind:offer.kind,
    slot:offer.slot||null,
    cost,
    balance,
    remaining:Math.max(0,balance-cost),
    affordable:balance>=cost,
    reasonCode
  });
}

export function purchaseIntent({playerId,runnerId,catalog,offerId,goldBalance,idempotencyKey}={}){
  const player=clean(playerId),runner=clean(runnerId),key=clean(idempotencyKey);
  if(!player||!runner||!key)throw new Error('playerId, runnerId and idempotencyKey are required');
  const quote=quoteProgressionPurchase({catalog,offerId,goldBalance});
  if(!quote.affordable)throw new Error('Insufficient Gold');
  return Object.freeze({playerId:player,runnerId:runner,offerId:quote.offerId,amount:-quote.cost,currency:'GOLD',reasonCode:quote.reasonCode,idempotencyKey:key});
}

import {RUNNER_STAT_KEYS} from './runner-progression.mjs';
import {equipmentItemById} from './equipment-catalog.mjs';

const clean=value=>String(value??'').trim();
const positiveInt=(value,label)=>{const n=Number(value);if(!Number.isInteger(n)||n<=0)throw new Error(`${label} must be a positive integer`);return n;};

export function normalizeStatOffer(offer={}){
  const id=clean(offer.id),stat=clean(offer.stat);if(!id)throw new Error('Stat offer id is required');
  if(!RUNNER_STAT_KEYS.includes(stat))throw new Error(`Unknown stat: ${stat}`);
  return Object.freeze({id,kind:'stat',stat,amount:positiveInt(offer.amount,'Stat amount'),goldCost:positiveInt(offer.goldCost,'Gold cost'),tier:positiveInt(offer.tier??1,'Tier')});
}

export function normalizeItemPurchaseOffer(offer={},equipmentCatalog){
  const id=clean(offer.id),itemId=clean(offer.itemId);if(!id||!itemId)throw new Error('Purchase offer id and itemId are required');
  const item=equipmentItemById(equipmentCatalog,itemId);
  return Object.freeze({id,kind:'item',itemId:item.id,slot:item.slot,goldCost:positiveInt(offer.goldCost,'Gold cost')});
}

export function normalizeProgressionOffers({version=1,statOffers=[],itemOffers=[]}={},equipmentCatalog){
  const v=positiveInt(version,'Offer catalog version');
  const stats=Object.freeze(statOffers.map(normalizeStatOffer));
  const items=Object.freeze(itemOffers.map(x=>normalizeItemPurchaseOffer(x,equipmentCatalog)));
  const ids=[...stats,...items].map(x=>x.id);if(new Set(ids).size!==ids.length)throw new Error('Progression offer ids must be unique');
  return Object.freeze({version:v,statOffers:stats,itemOffers:items});
}

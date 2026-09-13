import {equipmentItemById} from './equipment-catalog.mjs';

const clean=value=>String(value??'').trim();
const balance=value=>{const n=Number(value);if(!Number.isInteger(n)||n<0)throw new Error('Gold balance must be a non-negative integer');return n;};

export function progressionOfferByIdV2(offers={},offerId=''){
  const id=clean(offerId);if(!id)throw new Error('offerId is required');
  const row=[...(offers.statOffers||[]),...(offers.itemOffers||[])].find(x=>x.id===id);
  if(!row)throw new Error(`Unknown progression offer: ${id}`);
  return row;
}

export function quoteProgressionOffer({offers,equipmentCatalog,offerId,goldBalance}={}){
  const offer=progressionOfferByIdV2(offers,offerId),current=balance(goldBalance),cost=balance(offer.goldCost),item=offer.kind==='item'?equipmentItemById(equipmentCatalog,offer.itemId):null;
  return Object.freeze({
    offerId:offer.id,
    kind:offer.kind,
    itemId:item?.id||null,
    slot:item?.slot||null,
    stat:offer.stat||null,
    amount:offer.amount||null,
    cost,
    balance:current,
    remaining:Math.max(0,current-cost),
    affordable:current>=cost,
    modifiers:item?item.modifiers:null
  });
}

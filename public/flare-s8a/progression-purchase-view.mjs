import {quoteProgressionPurchase,progressionOfferById} from './progression-purchase.mjs';

const labelForOffer=offer=>offer.kind==='stat'?`${String(offer.stat).toUpperCase()} +${offer.amount}`:String(offer.name||offer.id);

export function buildProgressionPurchaseView({catalog,offerId,goldBalance}={}){
  const offer=progressionOfferById(catalog,offerId),quote=quoteProgressionPurchase({catalog,offerId,goldBalance});
  return Object.freeze({
    title:quote.affordable?'CONFIRM UPGRADE':'NOT ENOUGH GOLD',
    offerId:offer.id,
    label:labelForOffer(offer),
    kind:offer.kind,
    slot:offer.slot||null,
    modifiers:offer.modifiers?Object.freeze({...offer.modifiers}):offer.kind==='stat'?Object.freeze({[offer.stat]:offer.amount}):Object.freeze({}),
    currentGold:quote.balance,
    cost:quote.cost,
    remainingGold:quote.remaining,
    affordable:quote.affordable,
    primaryAction:quote.affordable?(offer.kind==='stat'?'BUY UPGRADE':'BUY ITEM'):'EARN MORE GOLD',
    secondaryAction:'CANCEL'
  });
}

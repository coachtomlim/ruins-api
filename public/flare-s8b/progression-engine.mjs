import {foldGoldLedger} from './ledger.mjs';
import {progressionDebitEntry,foldGoldLedgerNonNegative} from './progression-ledger.mjs';
import {progressionOfferById,quoteProgressionPurchase} from '../flare-s8a/progression-purchase.mjs';
import {validateEquip} from '../flare-s8a/runner-loadout.mjs';

const clone=value=>structuredClone(value);
const clean=value=>String(value??'').trim();

export function createProgressionAccount({playerId,ledgerEntries=[],runners={}}={}){
  const player=clean(playerId);if(!player)throw new Error('playerId is required');
  foldGoldLedgerNonNegative(ledgerEntries);
  return Object.freeze({playerId:player,ledgerEntries:Object.freeze(clone(ledgerEntries)),runners:Object.freeze(clone(runners))});
}

function runnerState(account,runnerId){
  const id=clean(runnerId),state=account.runners?.[id];if(!id||!state)throw new Error('Owned Runner is required');
  return {id,state:clone(state)};
}

export function applyProgressionPurchase({account,catalog,runnerId,offerId,idempotencyKey,ledgerEntryId}={}){
  if(!account)throw new Error('account is required');
  const key=clean(idempotencyKey),ledgerId=clean(ledgerEntryId);if(!key||!ledgerId)throw new Error('idempotencyKey and ledgerEntryId are required');
  const existing=account.ledgerEntries.find(x=>x.idempotency_key===key);
  if(existing)return Object.freeze({account,duplicate:true,balance:foldGoldLedger(account.ledgerEntries).balance});
  const {id,state}=runnerState(account,runnerId),balance=foldGoldLedger(account.ledgerEntries).balance;
  const offer=progressionOfferById(catalog,offerId),quote=quoteProgressionPurchase({catalog,offerId,goldBalance:balance});
  if(!quote.affordable)throw new Error('Insufficient Gold');
  const debit=progressionDebitEntry({ledgerEntryId:ledgerId,playerId:account.playerId,goldCost:quote.cost,reasonCode:quote.reasonCode,sourceId:offer.id,idempotencyKey:key});
  const ledgerEntries=[...account.ledgerEntries,debit];foldGoldLedgerNonNegative(ledgerEntries);
  state.statOfferIds=[...(state.statOfferIds||[])];state.ownedAssetIds=[...(state.ownedAssetIds||[])];state.loadout={...(state.loadout||{})};
  if(offer.kind==='stat'){
    if(state.statOfferIds.includes(offer.id))throw new Error('Stat upgrade already applied');
    state.statOfferIds.push(offer.id);
  }else{
    if(!state.ownedAssetIds.includes(offer.id))state.ownedAssetIds.push(offer.id);
  }
  const runners={...clone(account.runners),[id]:state};
  const next=createProgressionAccount({playerId:account.playerId,ledgerEntries,runners});
  return Object.freeze({account:next,duplicate:false,balance:foldGoldLedger(next.ledgerEntries).balance,offerId:offer.id});
}

export function applyProgressionEquip({account,catalog,runnerId,slot,assetId}={}){
  const {id,state}=runnerState(account,runnerId),offer=progressionOfferById(catalog,assetId);
  const assets=(state.ownedAssetIds||[]).map(assetKey=>({playerId:account.playerId,assetKey}));
  validateEquip({playerId:account.playerId,runnerId:id,slot,assetId,offer,assets});
  state.loadout={...(state.loadout||{}),[slot]:assetId};
  const runners={...clone(account.runners),[id]:state};
  return createProgressionAccount({playerId:account.playerId,ledgerEntries:account.ledgerEntries,runners});
}

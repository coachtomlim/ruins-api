import {foldGoldLedger} from './ledger.mjs';
import {progressionDebitEntry,foldGoldLedgerNonNegative} from './progression-ledger.mjs';
import {quoteProgressionOffer} from '../flare-s8a/progression-quote.mjs';
import {equipmentItemById} from '../flare-s8a/equipment-catalog.mjs';
import {normalizeGearInstance} from './gear-instance.mjs';

const clean=value=>String(value??'').trim();
const clone=value=>structuredClone(value);

export function createGearAccount({accountId,ledgerEntries=[],gearInstances=[]}={}){
  const account=clean(accountId);if(!account)throw new Error('accountId is required');
  foldGoldLedgerNonNegative(ledgerEntries);
  const instances=gearInstances.map(normalizeGearInstance);
  return Object.freeze({accountId:account,ledgerEntries:Object.freeze(clone(ledgerEntries)),gearInstances:Object.freeze(clone(instances))});
}

function duplicateOperation(account,operationKey){
  const key=clean(operationKey);if(!key)throw new Error('operationKey is required');
  return account.ledgerEntries.find(x=>x.idempotency_key===key)||account.gearInstances.find(x=>x.sourceId===key);
}

export function purchaseGear({account,offers,equipmentCatalog,offerId,operationKey,ledgerEntryId,gearInstanceId}={}){
  if(!account)throw new Error('account is required');
  const key=clean(operationKey),ledgerId=clean(ledgerEntryId),instanceId=clean(gearInstanceId);
  if(!key||!ledgerId||!instanceId)throw new Error('operationKey, ledgerEntryId and gearInstanceId are required');
  if(duplicateOperation(account,key))return Object.freeze({account,duplicate:true,balance:foldGoldLedger(account.ledgerEntries).balance});
  const balance=foldGoldLedger(account.ledgerEntries).balance;
  const quote=quoteProgressionOffer({offers,equipmentCatalog,offerId,goldBalance:balance});
  if(quote.kind!=='item'||!quote.itemId)throw new Error('Gear purchase requires an item offer');
  if(!quote.affordable)throw new Error('Insufficient Gold');
  const item=equipmentItemById(equipmentCatalog,quote.itemId);
  const debit=progressionDebitEntry({ledgerEntryId:ledgerId,playerId:account.accountId,goldCost:quote.cost,reasonCode:'EQUIPMENT_PURCHASE',sourceId:offerId,idempotencyKey:key});
  const ledgerEntries=[...account.ledgerEntries,debit];foldGoldLedgerNonNegative(ledgerEntries);
  const gear=normalizeGearInstance({instanceId,accountId:account.accountId,itemId:item.id,slot:item.slot,source:'PURCHASE',sourceId:key});
  const next=createGearAccount({accountId:account.accountId,ledgerEntries,gearInstances:[...account.gearInstances,gear]});
  return Object.freeze({account:next,duplicate:false,balance:foldGoldLedger(next.ledgerEntries).balance,gear});
}

export function grantRunGear({account,equipmentCatalog,itemId,runAwardId,gearInstanceId}={}){
  if(!account)throw new Error('account is required');
  const sourceId=clean(runAwardId),instanceId=clean(gearInstanceId);if(!sourceId||!instanceId)throw new Error('runAwardId and gearInstanceId are required');
  const existing=account.gearInstances.find(x=>x.source==='DROP'&&x.sourceId===sourceId);
  if(existing)return Object.freeze({account,duplicate:true,balance:foldGoldLedger(account.ledgerEntries).balance,gear:existing});
  const item=equipmentItemById(equipmentCatalog,itemId);
  const gear=normalizeGearInstance({instanceId,accountId:account.accountId,itemId:item.id,slot:item.slot,source:'DROP',sourceId});
  const next=createGearAccount({accountId:account.accountId,ledgerEntries:account.ledgerEntries,gearInstances:[...account.gearInstances,gear]});
  return Object.freeze({account:next,duplicate:false,balance:foldGoldLedger(next.ledgerEntries).balance,gear});
}

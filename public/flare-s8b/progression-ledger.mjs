import {normalizeLedgerEntry,foldGoldLedger} from './ledger.mjs';

export const PROGRESSION_DEBIT_REASONS=Object.freeze(['RUNNER_STAT_UPGRADE','EQUIPMENT_PURCHASE','ARMOR_PURCHASE']);

const clean=value=>String(value??'').trim();

export function progressionDebitEntry({ledgerEntryId,playerId,goldCost,reasonCode,sourceType='PROGRESSION_OFFER',sourceId,idempotencyKey}={}){
  const cost=Number(goldCost),reason=clean(reasonCode);
  if(!Number.isInteger(cost)||cost<=0)throw new Error('Gold cost must be a positive integer');
  if(!PROGRESSION_DEBIT_REASONS.includes(reason))throw new Error(`Unsupported progression debit reason: ${reason}`);
  return normalizeLedgerEntry({
    ledger_entry_id:clean(ledgerEntryId),player_id:clean(playerId),amount:-cost,currency:'GOLD',reason_code:reason,
    source_type:clean(sourceType),source_id:clean(sourceId),idempotency_key:clean(idempotencyKey)
  });
}

export function foldGoldLedgerNonNegative(entries=[]){
  const seen=[];
  for(let i=0;i<entries.length;i++){
    seen.push(entries[i]);
    const current=foldGoldLedger(seen);
    if(current.balance<0)throw new Error(`Gold balance cannot be negative after ledger entry ${i+1}`);
  }
  return foldGoldLedger(seen);
}

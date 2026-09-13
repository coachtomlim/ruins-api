export const GOLD_REASON_CODES=Object.freeze({
  DUNGEON_BUILDER_REWARD:'DUNGEON_BUILDER_REWARD',
  HERO_RUN_REWARD:'HERO_RUN_REWARD',
  STARTER_GRANT:'STARTER_GRANT'
});

const clean=value=>String(value||'').trim();
const finite=value=>Number.isFinite(Number(value))?Number(value):NaN;

export function rewardIdempotencyKey({reasonCode,canonicalRunId,playerId}={}){
  const reason=clean(reasonCode),run=clean(canonicalRunId),player=clean(playerId);
  if(!run||!player)throw new Error('canonicalRunId and playerId are required');
  if(reason===GOLD_REASON_CODES.DUNGEON_BUILDER_REWARD)return `builder-reward:${run}:${player}`;
  if(reason===GOLD_REASON_CODES.HERO_RUN_REWARD)return `hero-reward:${run}:${player}`;
  throw new Error(`Unsupported reward reason: ${reason}`);
}

export function normalizeLedgerEntry(entry={}){
  const amount=finite(entry.amount),reason=clean(entry.reason_code),key=clean(entry.idempotency_key);
  if(!clean(entry.ledger_entry_id)||!clean(entry.player_id)||!Number.isFinite(amount)||!reason||!key)throw new Error('Invalid Gold ledger entry');
  if(entry.currency!=='GOLD')throw new Error('Unsupported currency');
  return Object.freeze({...entry,amount,currency:'GOLD',reason_code:reason,idempotency_key:key});
}

export function foldGoldLedger(entries=[]){
  const seenIds=new Set(),seenKeys=new Set();let balance=0;
  for(const raw of entries){const entry=normalizeLedgerEntry(raw);if(seenIds.has(entry.ledger_entry_id))throw new Error(`Duplicate ledger entry id: ${entry.ledger_entry_id}`);if(seenKeys.has(entry.idempotency_key))throw new Error(`Duplicate ledger idempotency key: ${entry.idempotency_key}`);seenIds.add(entry.ledger_entry_id);seenKeys.add(entry.idempotency_key);balance+=entry.amount;}
  return Object.freeze({currency:'GOLD',balance,entryCount:seenIds.size});
}

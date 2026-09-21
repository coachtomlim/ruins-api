export const DAILY_TRIAL_VERSION='s8b-daily-trial-001';
export const DAILY_TRIAL_REWARD_GOLD=5;
export const DAILY_TRIAL_BUDGET=65;
export const DAILY_TRIAL_ENCOUNTER_ID='fair-goblin-skeleton-potion-001';
export const DAILY_TRIAL_RULES_VERSION='web-flare-0.2.0';
export const DAILY_TRIAL_CONTENT_VERSION='web-flare-s7-0.1.0';
export const DAILY_TRIAL_STATES=Object.freeze(['AVAILABLE','RUNNING','CLAIMABLE','CLAIMED']);
export const DAILY_TRIAL_ROOM_IDS=Object.freeze([
  'iron-labyrinth-01','iron-labyrinth-03','iron-labyrinth-07',
  'iron-labyrinth-08','iron-labyrinth-15','iron-labyrinth-18'
]);
export const DAILY_TRIAL_ENCOUNTER=Object.freeze({
  enemyTypes:Object.freeze(['goblin','skeleton','none']),
  supportTypes:Object.freeze(['small-potion']),
  trapTypes:Object.freeze([])
});

const clean=value=>String(value??'').trim();
const fail=code=>{throw new Error(code)};
const sameList=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((value,index)=>value===b[index]);

function integer(value,code,min,max){
  const n=Number(value);
  if(!Number.isInteger(n)||n<min||n>max)fail(code);
  return n;
}
function stat(value,code){
  const n=Number(value);
  if(!Number.isFinite(n)||n<0)fail(code);
  return n;
}
function isoInstant(value,code){
  const text=clean(value);
  if(!text||Number.isNaN(Date.parse(text)))fail(code);
  return text;
}
function requireGoverned(row,prefix){
  if(clean(row.trial_version)!==DAILY_TRIAL_VERSION)fail(`${prefix}_VERSION_UNSUPPORTED`);
  if(clean(row.encounter_id)!==DAILY_TRIAL_ENCOUNTER_ID)fail(`${prefix}_ENCOUNTER_UNSUPPORTED`);
  if(integer(row.budget_spent,`${prefix}_BUDGET_INVALID`,0,1000)!==DAILY_TRIAL_BUDGET)fail(`${prefix}_BUDGET_UNSUPPORTED`);
  if(integer(row.reward_gold,`${prefix}_REWARD_INVALID`,0,1000)!==DAILY_TRIAL_REWARD_GOLD)fail(`${prefix}_REWARD_UNSUPPORTED`);
  if(!DAILY_TRIAL_ROOM_IDS.includes(clean(row.room_id)))fail(`${prefix}_ROOM_UNSUPPORTED`);
  if(!clean(row.room_name))fail(`${prefix}_ROOM_NAME_REQUIRED`);
  if(clean(row.rules_version)!==DAILY_TRIAL_RULES_VERSION)fail(`${prefix}_RULES_UNSUPPORTED`);
  if(clean(row.content_version)!==DAILY_TRIAL_CONTENT_VERSION)fail(`${prefix}_CONTENT_UNSUPPORTED`);
}

export function normalizeDailyTrialStatus(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('AUTHORITATIVE_DAILY_TRIAL_STATUS_REQUIRED');
  const state=clean(raw.state);
  if(!DAILY_TRIAL_STATES.includes(state))fail('INVALID_DAILY_TRIAL_STATE');
  const trialDay=clean(raw.trial_day);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(trialDay))fail('INVALID_DAILY_TRIAL_DAY');
  requireGoverned(raw,'INVALID_DAILY_TRIAL');
  const runId=raw.run_id==null?null:clean(raw.run_id);
  if(state==='AVAILABLE'&&runId!==null)fail('INVALID_DAILY_TRIAL_AVAILABLE_RUN');
  if(state!=='AVAILABLE'&&!runId)fail('INVALID_DAILY_TRIAL_RUN_REQUIRED');
  const expectedTicks=integer(raw.expected_ticks,'INVALID_DAILY_TRIAL_TICKS',1,3600);
  const settleAfter=raw.settle_after==null?null:isoInstant(raw.settle_after,'INVALID_DAILY_TRIAL_SETTLE_AFTER');
  if(state!=='AVAILABLE'&&!settleAfter)fail('INVALID_DAILY_TRIAL_SETTLE_AFTER');
  return Object.freeze({
    state,trialDay,runId,
    roomId:clean(raw.room_id),roomName:clean(raw.room_name),
    rewardGold:DAILY_TRIAL_REWARD_GOLD,budgetSpent:DAILY_TRIAL_BUDGET,
    expectedTicks,expectedSeconds:expectedTicks/60,settleAfter
  });
}

function secondsLabel(seconds){
  const low=Math.floor(seconds);
  return `${low}–${low+1}`;
}

export function dailyTrialView(raw,{today=new Date().toISOString().slice(0,10)}={}){
  const status=normalizeDailyTrialStatus(raw);
  const gold=`${status.rewardGold} GOLD`;
  const priorDay=status.state!=='AVAILABLE'&&status.state!=='CLAIMED'&&status.trialDay<today;
  const base={...status,rewardLabel:gold,priorDay,headline:'DAILY TRIAL'};
  if(status.state==='AVAILABLE')return Object.freeze({...base,
    statusLabel:gold,actionKind:'start',actionLabel:'START DAILY TRIAL',actionDisabled:false,
    detail:`One clear per trial day · about ${secondsLabel(status.expectedSeconds)} second automatic run.`});
  if(status.state==='RUNNING')return Object.freeze({...base,
    statusLabel:'TRIAL IN PROGRESS',actionKind:'continue',actionLabel:'CONTINUE TRIAL',actionDisabled:false,
    detail:priorDay?`Unfinished Trial from ${status.trialDay}. Continue to finish it.`:'Your Trial is running. Continue to watch it finish.'});
  if(status.state==='CLAIMABLE')return Object.freeze({...base,
    statusLabel:`${gold} READY`,actionKind:'claim',actionLabel:`CLAIM ${status.rewardGold} GOLD`,actionDisabled:false,
    detail:priorDay?`Unclaimed Trial from ${status.trialDay}. Claim it now.`:'Your Trial is complete. Claim your reward.'});
  return Object.freeze({...base,
    statusLabel:'CLAIMED TODAY',actionKind:'none',actionLabel:'CLAIMED TODAY',actionDisabled:true,
    detail:'Come back tomorrow for the next Trial.'});
}

export function normalizeDailyTrialRun(row){
  if(!row||typeof row!=='object'||Array.isArray(row))fail('AUTHORITATIVE_DAILY_TRIAL_RUN_REQUIRED');
  requireGoverned(row,'INVALID_DAILY_TRIAL_RUN');
  const id=clean(row.id);
  if(!id)fail('INVALID_DAILY_TRIAL_RUN_ID');
  const encounter=row.encounter;
  if(!encounter||typeof encounter!=='object'
    ||!sameList(encounter.enemyTypes,DAILY_TRIAL_ENCOUNTER.enemyTypes)
    ||!sameList(encounter.supportTypes,DAILY_TRIAL_ENCOUNTER.supportTypes)
    ||!sameList(encounter.trapTypes,DAILY_TRIAL_ENCOUNTER.trapTypes)){
    fail('INVALID_DAILY_TRIAL_RUN_ENCOUNTER_UNSUPPORTED');
  }
  const hp=stat(row.runner_hp,'INVALID_DAILY_TRIAL_RUN_HP');
  const attack=stat(row.runner_attack,'INVALID_DAILY_TRIAL_RUN_ATTACK');
  const defense=stat(row.runner_defense,'INVALID_DAILY_TRIAL_RUN_DEFENSE');
  if(hp<=0)fail('INVALID_DAILY_TRIAL_RUN_HP');
  const snapshot=row.runner_snapshot;
  const effective=snapshot?.effective_stats;
  if(!snapshot||typeof snapshot!=='object'||!effective)fail('INVALID_DAILY_TRIAL_RUN_SNAPSHOT_REQUIRED');
  if(Number(effective.hp)!==hp||Number(effective.attack)!==attack||Number(effective.defense)!==defense)fail('INVALID_DAILY_TRIAL_RUN_SNAPSHOT_MISMATCH');
  const trialDay=clean(row.trial_day);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(trialDay))fail('INVALID_DAILY_TRIAL_RUN_DAY');
  const settledAt=row.settled_at==null?null:isoInstant(row.settled_at,'INVALID_DAILY_TRIAL_RUN_SETTLED_AT');
  return Object.freeze({
    mode:'DAILY_TRIAL',
    id,trialDay,
    roomId:clean(row.room_id),roomName:clean(row.room_name),
    expectedTicks:integer(row.expected_ticks,'INVALID_DAILY_TRIAL_RUN_TICKS',1,3600),
    startedAt:isoInstant(row.started_at,'INVALID_DAILY_TRIAL_RUN_STARTED_AT'),
    settleAfter:isoInstant(row.settle_after,'INVALID_DAILY_TRIAL_RUN_SETTLE_AFTER'),
    settledAt,ledgerEntryId:row.ledger_entry_id||null,
    rewardGold:DAILY_TRIAL_REWARD_GOLD,budgetSpent:DAILY_TRIAL_BUDGET,
    encounterId:DAILY_TRIAL_ENCOUNTER_ID,
    encounter:Object.freeze({
      enemyTypes:Object.freeze([...encounter.enemyTypes]),
      supportTypes:Object.freeze([...encounter.supportTypes]),
      trapTypes:Object.freeze([...encounter.trapTypes])
    }),
    runner:Object.freeze({id:clean(row.player_runner_id),name:clean(snapshot.runner_name)||'Your Runner',hp,attack,defense})
  });
}

export function dailyTrialErrorMessage(error){
  const message=clean(error?.message||error).toUpperCase();
  if(message.includes('DAILY_TRIAL_NOT_COMPLETE'))return Object.freeze({kind:'wait',message:'Your Trial is still finishing. Checking again…'});
  if(message.includes('DAILY_TRIAL_RUN_NOT_FOUND')||message.includes('PGRST116'))return Object.freeze({kind:'known',message:'That Daily Trial run was not found on your account.'});
  if(message.includes('RUNNER_OUTSIDE_DAILY_TRIAL_ENVELOPE'))return Object.freeze({kind:'known',message:'Your current Runner build is not eligible for the Daily Trial yet.'});
  if(message.includes('AUTH_REQUIRED'))return Object.freeze({kind:'known',message:'Sign in from your Hub to continue.'});
  if(message.includes('UNSUPPORTED')||message.includes('INVALID_DAILY_TRIAL')||message.includes('SNAPSHOT'))return Object.freeze({kind:'known',message:'This Daily Trial cannot be presented safely. Return to your Hub.'});
  return Object.freeze({kind:'unknown',message:'Daily Trial status is uncertain. Reload to check your account.'});
}

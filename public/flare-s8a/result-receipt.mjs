const clean=value=>String(value??'').trim();
const boundedInt=(value,min,max,label)=>{const n=Number(value);if(!Number.isInteger(n)||n<min||n>max)throw new Error(`INVALID_${label}`);return n};

export function buildResultReceipt({publicToken,roomId,encounter,rulesVersion,result,heroGold,attemptToken}={}){
  const token=clean(publicToken);
  if(!/^[A-Za-z0-9_-]{32,128}$/.test(token))throw new Error('PUBLIC_CHALLENGE_TOKEN_REQUIRED');
  const status=clean(result?.status);
  if(!['cleared','dead','blocked','timeout'].includes(status))throw new Error('INVALID_TERMINAL_STATUS');
  const maxHp=boundedInt(result?.maxHp,1,10000,'MAX_HP'),finishingHp=boundedInt(result?.hp,0,maxHp,'FINISHING_HP');
  const attempt=clean(attemptToken);
  if(!/^[A-Za-z0-9_-]{16,128}$/.test(attempt))throw new Error('ATTEMPT_TOKEN_REQUIRED');
  return Object.freeze({
    p_public_token:token,p_room_id:clean(roomId).slice(0,64),p_encounter:structuredClone(encounter||{}),
    p_rules_version:clean(rulesVersion||'s8a-1').slice(0,64),p_terminal_status:status,
    p_finishing_hp:finishingHp,p_max_hp:maxHp,p_hero_gold:boundedInt(heroGold,0,31,'HERO_GOLD'),
    p_attempt_token:attempt
  });
}

export async function submitResultReceipt({client,payload}={}){
  if(typeof client?.rpc!=='function')throw new Error('RESULT_RECEIPT_CLIENT_REQUIRED');
  const {data,error}=await client.rpc('submit_builder_challenge_result_v2',payload);
  if(error)throw error;
  const row=Array.isArray(data)?data[0]:data;
  if(!row?.result_id)throw new Error('RESULT_RECEIPT_NOT_CONFIRMED');
  return Object.freeze({...row});
}

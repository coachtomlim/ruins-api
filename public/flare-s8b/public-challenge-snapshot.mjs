// Friend Feedback 002B — adapter contract for the future S8A Runner Inspector. Not wired into any
// UI yet: this only proves the shape a correlated receiver would use to fetch the challenge-time
// Runner snapshot by public token, so 002C's inspector work has a tested contract to build on.
// Legacy links without a c= token never call this — they keep using local/template Runner data.
const clean=value=>String(value??'').trim();

export async function fetchPublicChallengeSnapshot({client,publicToken}={}){
  const token=clean(publicToken);
  if(!/^[A-Za-z0-9_-]{32,128}$/.test(token))throw new Error('PUBLIC_CHALLENGE_TOKEN_REQUIRED');
  if(typeof client?.rpc!=='function')throw new Error('PUBLIC_SNAPSHOT_CLIENT_REQUIRED');
  const {data,error}=await client.rpc('get_builder_challenge_public_snapshot',{p_public_token:token});
  if(error)throw error;
  const row=Array.isArray(data)?data[0]:data;
  if(!row)return null;
  return Object.freeze({
    senderName:clean(row.sender_name)||'Buddy',
    targetHp:Number(row.target_hp)||0,
    runnerSnapshot:row.runner_snapshot?structuredClone(row.runner_snapshot):null
  });
}

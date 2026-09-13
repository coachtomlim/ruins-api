const text=value=>String(value??'').trim();

export function createChallengeEnvelope({senderPlayerId,runnerSnapshot,targetHp,rulesVersion='',contentVersion=''}={}){
  const sender=text(senderPlayerId),target=Number(targetHp);
  if(!sender)throw new Error('senderPlayerId is required');
  if(!runnerSnapshot?.runnerId||!runnerSnapshot?.stats)throw new Error('runnerSnapshot is required');
  if(!Number.isInteger(target)||target<5||target>95||target%5!==0)throw new Error('Target HP must be 5..95 in steps of 5');
  return Object.freeze({version:1,senderPlayerId:sender,targetHp:target,runnerSnapshot:structuredClone(runnerSnapshot),rulesVersion:text(rulesVersion||runnerSnapshot.rulesVersion),contentVersion:text(contentVersion||runnerSnapshot.contentVersion)});
}

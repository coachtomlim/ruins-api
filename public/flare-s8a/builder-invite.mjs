import {encodeInviteCode,makeInviteUrl,safeSender} from './flow.mjs';
import {challengeShareCopy} from './share-copy.mjs';

export function buildChallengeInvite({baseUrl,sender='Buddy',runnerId,targetHp,model}={}){
  if(!baseUrl)throw new Error('baseUrl is required');
  const name=safeSender(sender),invite=Object.freeze({runnerId:String(runnerId||''),targetHp:Number(targetHp)}),code=encodeInviteCode(invite,model),url=makeInviteUrl(baseUrl,invite,model,{sender:name}),share=challengeShareCopy({sender:name,targetHp:invite.targetHp});
  return Object.freeze({invite,code,url:url.href,sender:name,share});
}

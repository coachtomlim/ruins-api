import {missionCopy} from './mission-copy.mjs';
import {targetFitAction} from './target-fit-action.mjs';
import {rewardTeaser} from './reward-teaser.mjs';

const clean=value=>String(value||'').trim();

export function buildMissionViewModel({targetHp=0,sender='Buddy',roomName='',roomIndex=0,roomCount=0,estimatedHpPercent=null}={}){
  const copy=missionCopy({targetHp,sender});
  const fit=targetFitAction(estimatedHpPercent,targetHp);
  const reward=rewardTeaser();
  const index=Math.max(0,Number(roomIndex)||0),count=Math.max(0,Number(roomCount)||0);
  return Object.freeze({
    eyebrow:'YOUR MISSION',
    title:copy.title,
    incentive:copy.incentive,
    warning:copy.warning,
    rewardCue:copy.rewardCue,
    reward:Object.freeze({headline:reward.headline,compact:reward.compact,body:reward.body}),
    senderLine:copy.senderLine,
    room:Object.freeze({name:clean(roomName)||'Dungeon',index,count,label:count?`${index+1} / ${count}`:''}),
    targetFit:Object.freeze({id:fit.id,label:fit.label,note:fit.note,action:fit.action}),
    actions:Object.freeze({primary:'USE THIS DUNGEON',secondary:'CUSTOMIZE — OPTIONAL'}),
    mobilePriority:Object.freeze(['title','rewardCue','room','primaryAction'])
  });
}

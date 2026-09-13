import {rewardSummary} from './rewards.mjs';
import {rewardCopy} from './mission-copy.mjs';

const finite=value=>Number.isFinite(Number(value))?Number(value):0;

export function buildResultViewModel({result,score,targetHp,senderName='Buddy'}={}){
  const summary=rewardSummary({result:result||{},score:finite(score),senderName});
  const copy=rewardCopy({sender:senderName,heroGold:summary.heroGold,builderGold:summary.builderGold,cleared:summary.cleared});
  const actual=result?.maxHp>0?Math.max(0,Math.min(100,finite(result.hp)/finite(result.maxHp)*100)):0;
  const target=Math.max(0,Math.min(100,finite(targetHp)));
  return Object.freeze({
    cleared:summary.cleared,
    outcome:copy.outcome,
    score:finite(score),
    actualHpPercent:actual,
    targetHpPercent:target,
    heroReward:Object.freeze({label:copy.heroLabel,value:copy.heroValue,gold:summary.heroGold}),
    builderReward:Object.freeze({label:copy.builderLabel,value:copy.builderValue,sublabel:copy.builderSublabel,gold:summary.builderGold}),
    actions:Object.freeze(['RUN AGAIN','EDIT THIS DUNGEON','SAVE THIS GOAL & BUILD YOUR OWN'])
  });
}

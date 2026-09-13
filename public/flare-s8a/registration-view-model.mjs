import {registrationCopy} from './mission-copy.mjs';
import {registrationActionState} from './registration-action-state.mjs';

export function buildRegistrationViewModel(handoff={}){
  const sender=handoff?.senderName||'Buddy';
  const target=Number(handoff?.goal?.targetHp)||0;
  const runner=handoff?.runner||{};
  const reward=handoff?.rewardPreview||{};
  const copy=registrationCopy({targetHp:target,sender});
  return Object.freeze({
    title:copy.title,
    body:copy.body,
    carriedGoal:copy.carriedGoal,
    notSaved:copy.notSaved,
    runnerLabel:`Level ${Number(runner.level)||0} ${String(runner.name||runner.id||'Hero-Runner')}`,
    targetHp:target,
    previewBuilderGold:Number(reward.builderGold)||0,
    previewHeroGold:Number(reward.heroGold)||0,
    persisted:false,
    accountAction:registrationActionState({accountServiceAvailable:false}),
    actions:Object.freeze(['CREATE ACCOUNT','BACK TO REWARDS'])
  });
}

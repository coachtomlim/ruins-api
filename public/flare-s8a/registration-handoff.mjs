import {createFinishHpGoal} from './goal.mjs';

function finiteOr(value, fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}

export function buildRegistrationHandoff({
  senderName='Buddy', runnerId='', runnerName='', runnerLevel=0, targetHp=0,
  score=0, heroGold=0, builderGold=0, roomId='', encounter=null, result=null,
}={}){
  const target=finiteOr(targetHp,0),goalSpec=createFinishHpGoal(target);
  return Object.freeze({
    version:1,
    senderName:String(senderName||'Buddy'),
    runner:Object.freeze({id:String(runnerId||''),name:String(runnerName||''),level:finiteOr(runnerLevel,0)}),
    goal:Object.freeze({targetHp:target}),
    goalSpec,
    rewardPreview:Object.freeze({score:finiteOr(score,0),heroGold:finiteOr(heroGold,0),builderGold:finiteOr(builderGold,0)}),
    dungeon:Object.freeze({roomId:String(roomId||''),encounter:encounter?structuredClone(encounter):null}),
    run:Object.freeze(result?structuredClone(result):{}),
    persisted:false,
  });
}

export function registrationGateCopy(handoff){
  const target=finiteOr(handoff?.goal?.targetHp,0);
  return Object.freeze({
    title:'CREATE YOUR DUNGEON RUNNER ACCOUNT',
    body:`Create an account to save this ${target}% goal, keep your gold and store your game assets.`,
    persistedNotice:'Nothing has been saved yet.',
  });
}

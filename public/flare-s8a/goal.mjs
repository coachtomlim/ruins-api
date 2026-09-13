export const GOAL_TYPES=Object.freeze({FINISH_HP_PERCENT:'FINISH_HP_PERCENT'});

export function createFinishHpGoal(targetHpPercent){
  const target=Number(targetHpPercent);
  if(!Number.isInteger(target)||target<5||target>95||target%5!==0)throw new Error('Finish HP target must be 5..95 in steps of 5');
  return Object.freeze({goalVersion:1,goalType:GOAL_TYPES.FINISH_HP_PERCENT,payload:Object.freeze({targetHpPercent:target})});
}

export function goalTargetHp(goal){
  if(goal?.goalVersion!==1||goal?.goalType!==GOAL_TYPES.FINISH_HP_PERCENT)throw new Error('Unsupported Dungeon Runner goal');
  return createFinishHpGoal(goal?.payload?.targetHpPercent).payload.targetHpPercent;
}

export function plainGoalLabel(goal){return `GET THE HERO TO THE EXIT AT ~${goalTargetHp(goal)}% HP`;}

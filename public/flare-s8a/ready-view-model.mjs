import {buildBudgetViewModel} from './budget-view-model.mjs';
import {targetFitAction} from './target-fit-action.mjs';

const clean=value=>String(value||'').trim();
const list=value=>Array.isArray(value)?value.filter(Boolean):[];

export function buildReadyViewModel({targetHp=0,roomName='',usedBudget=0,totalBudget=100,estimatedHpPercent=null,monsters=[],traps=[],supports=[]}={}){
  const target=Math.max(0,Math.min(100,Number(targetHp)||0));
  const budget=buildBudgetViewModel({used:usedBudget,total:totalBudget});
  const fit=targetFitAction(estimatedHpPercent,target);
  return Object.freeze({
    eyebrow:'READY TO RUN',
    title:`AIM FOR ~${target}% HP AT THE EXIT`,
    roomName:clean(roomName)||'Dungeon',
    budget,
    targetFit:Object.freeze({id:fit.id,label:fit.label,note:fit.note,action:fit.action}),
    build:Object.freeze({monsters:Object.freeze(list(monsters)),traps:Object.freeze(list(traps)),supports:Object.freeze(list(supports))}),
    primaryAction:budget.legal?'RUN THE HERO':'FIX BUDGET',
    secondaryAction:'EDIT DUNGEON',
    canRun:budget.legal
  });
}

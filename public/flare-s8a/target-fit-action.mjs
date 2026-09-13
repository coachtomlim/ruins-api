import {targetFitCue} from './target-fit.mjs';

export function targetFitAction(estimatedHpPercent,targetHp){
  const cue=targetFitCue(estimatedHpPercent,targetHp);
  if(cue.id==='gentle')return Object.freeze({...cue,action:'ADD CHALLENGE'});
  if(cue.id==='harsh')return Object.freeze({...cue,action:'EASE DUNGEON'});
  if(cue.id==='close')return Object.freeze({...cue,action:'RUN THIS SETUP'});
  return Object.freeze({...cue,action:'CHECK SETUP'});
}

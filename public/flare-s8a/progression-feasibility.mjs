import {calibrateEncounter} from '../flare-s7/calibration.mjs';
import {calibrationRunnerFromSnapshot} from './runner-calibration.mjs';

export function assessProgressionChallengeability({catalog,model,runnerSnapshot,targetHp,budget=100,tolerance=15}={}){
  const runner=calibrationRunnerFromSnapshot(runnerSnapshot),target=Number(targetHp);
  if(!Number.isFinite(target))throw new Error('targetHp is required');
  const result=calibrateEncounter({catalog,model,runnerId:runner.id,runner,targetHp:target,budget});
  const delta=Math.abs(Number(result.estimate.estimatedHpPercent)-target);
  return Object.freeze({
    credible:delta<=Number(tolerance),
    targetHp:target,
    estimatedHpPercent:Number(result.estimate.estimatedHpPercent),
    delta,
    cost:Number(result.estimate.cost),
    budget:Number(budget),
    encounter:structuredClone(result.encounter),
    cue:result.cue
  });
}

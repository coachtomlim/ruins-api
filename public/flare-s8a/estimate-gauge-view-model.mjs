import {targetFitCue} from './target-fit.mjs';

const clampPercent=value=>Math.max(0,Math.min(100,Number(value)||0));

// The gauge is OUTPUT only: a fixed TARGET marker plus (when an estimate exists) a moving
// ESTIMATE marker along a 0-100% HP track. The player never sets a value by touching the gauge —
// they change the dungeon, and the estimate marker moves in response.
export function buildEstimateGaugeViewModel({targetHp,estimatedHpPercent}={}){
  const target=clampPercent(targetHp);
  const estimateRaw=Number(estimatedHpPercent);
  const hasEstimate=Number.isFinite(estimateRaw);
  const estimate=hasEstimate?clampPercent(estimateRaw):null;
  const fit=hasEstimate?targetFitCue(estimate,target):null;
  const guidance=!fit?'':fit.id==='gentle'?`Too gentle. Add danger to move closer to ${target}%.`
    :fit.id==='harsh'?`Too harsh. Add support to move closer to ${target}%.`
    :fit.id==='close'?`Near target. This build should land close to ${target}%.`
    :'Check your dungeon setup.';
  return Object.freeze({
    targetPercent:target,
    estimatePercent:estimate,
    hasEstimate,
    estimateLabel:hasEstimate?`~${Math.round(estimate)}% HP`:'',
    zone:fit?.id||null,
    zoneLabel:fit?.label||'',
    guidance
  });
}

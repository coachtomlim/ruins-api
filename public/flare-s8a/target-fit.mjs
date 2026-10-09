// 002E9D (Owner-approved V18): ONE set of difficulty bands, used by the invitation, READY, the editor gauge and the
// target-fit cue. Relative to the target T: below T-15 is TOO HARSH, T-15..T+20 is JUST NICE, above T+20 is TOO
// GENTLE. At the default 50% target that is exactly <35% / 35%-70% / >70%.
export const HARSH_MARGIN=15,GENTLE_MARGIN=20;
export function targetBands(targetHp){
  const t=Math.max(0,Math.min(100,Number(targetHp)||0));
  return Object.freeze({target:t,harshBelow:Math.max(0,t-HARSH_MARGIN),gentleAbove:Math.min(100,t+GENTLE_MARGIN)});
}
export function bandsCopy(targetHp){
  const b=targetBands(targetHp);
  return `HP Less than ${b.harshBelow}%: Too Harsh · ${b.harshBelow}%-${b.gentleAbove}%: Just Nice · Above ${b.gentleAbove}%: Too Gentle`;
}
export function targetFitCue(estimatedHpPercent,targetHp){
  const estimate=Number(estimatedHpPercent),target=Number(targetHp);
  if(!Number.isFinite(estimate)||!Number.isFinite(target))return Object.freeze({id:'unknown',label:'CHECK SETUP',note:'Target fit is unavailable.'});
  const delta=estimate-target;
  if(delta>GENTLE_MARGIN)return Object.freeze({id:'gentle',label:'TOO GENTLE',note:'The Hero may finish too healthy. Add a little challenge.'});
  if(delta<-HARSH_MARGIN)return Object.freeze({id:'harsh',label:'TOO HARSH',note:'The Hero may take too much damage. Ease the dungeon.'});
  return Object.freeze({id:'close',label:'CLOSE TO TARGET',note:'This setup is a good starting point for the target.'});
}

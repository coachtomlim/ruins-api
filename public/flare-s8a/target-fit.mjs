export function targetFitCue(estimatedHpPercent,targetHp){
  const estimate=Number(estimatedHpPercent),target=Number(targetHp);
  if(!Number.isFinite(estimate)||!Number.isFinite(target))return Object.freeze({id:'unknown',label:'CHECK SETUP',note:'Target fit is unavailable.'});
  const delta=estimate-target;
  if(delta>10)return Object.freeze({id:'gentle',label:'TOO GENTLE',note:'The Hero may finish too healthy. Add a little challenge.'});
  if(delta<-10)return Object.freeze({id:'harsh',label:'TOO HARSH',note:'The Hero may take too much damage. Ease the dungeon.'});
  return Object.freeze({id:'close',label:'CLOSE TO TARGET',note:'This setup is a good starting point for the target.'});
}

const finite=(value,label)=>{
  const number=Number(value);
  if(!Number.isFinite(number)||number<0)throw new Error(`INVALID_PRACTICE_CATALOG_STAT:${label}`);
  return number;
};

export function applyPracticeRunnerToCatalog(baseCatalog,snapshot){
  if(!baseCatalog?.heroes?.warrior)throw new Error('PRACTICE_BASE_CATALOG_REQUIRED');
  if(snapshot?.mode!=='PRACTICE'||snapshot?.rewardSettlement!==false)throw new Error('PRACTICE_RUNNER_SNAPSHOT_REQUIRED');
  if(!snapshot?.effectiveStats)throw new Error('PRACTICE_RUNNER_STATS_REQUIRED');

  const catalog=structuredClone(baseCatalog);
  catalog.heroes.warrior.maxHp=finite(snapshot.effectiveStats.hp,'hp');
  catalog.heroes.warrior.damage=finite(snapshot.effectiveStats.attack,'attack');
  catalog.heroes.warrior.armor=finite(snapshot.effectiveStats.defense,'defense');
  return catalog;
}

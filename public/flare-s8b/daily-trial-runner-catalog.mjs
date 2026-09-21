const finite=(value,label)=>{
  const number=Number(value);
  if(!Number.isFinite(number)||number<0)throw new Error(`INVALID_DAILY_TRIAL_CATALOG_STAT:${label}`);
  return number;
};

export function applyDailyTrialRunnerToCatalog(baseCatalog,run){
  if(!baseCatalog?.heroes?.warrior)throw new Error('DAILY_TRIAL_BASE_CATALOG_REQUIRED');
  if(run?.mode!=='DAILY_TRIAL')throw new Error('DAILY_TRIAL_RUN_REQUIRED');
  if(!run?.runner)throw new Error('DAILY_TRIAL_RUNNER_STATS_REQUIRED');

  const catalog=structuredClone(baseCatalog);
  catalog.heroes.warrior.maxHp=finite(run.runner.hp,'hp');
  catalog.heroes.warrior.damage=finite(run.runner.attack,'attack');
  catalog.heroes.warrior.armor=finite(run.runner.defense,'defense');
  return catalog;
}

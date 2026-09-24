const SLOT_ORDER=Object.freeze(['weapon','shield','head','chest','hands','legs','feet']);

const finite=(value,label)=>{
  const number=Number(value);
  if(!Number.isFinite(number)||number<0)throw new Error(`INVALID_PRACTICE_RUNNER_STAT:${label}`);
  return number;
};
const clean=value=>String(value??'').trim();

export function createPracticeRunnerSnapshot(viewModel,{accessToken}={}){
  const runner=viewModel?.runner;
  if(!runner?.id||!runner?.name)throw new Error('PRACTICE_RUNNER_IDENTITY_REQUIRED');
  if(!runner?.stats||!runner?.baseStats)throw new Error('PRACTICE_RUNNER_STATS_REQUIRED');
  if(!Array.isArray(viewModel?.gear)||viewModel.gear.length!==SLOT_ORDER.length)throw new Error('PRACTICE_RUNNER_GEAR_REQUIRED');

  const bySlot=new Map(viewModel.gear.map(row=>[clean(row?.slot).toLowerCase(),row]));
  const gear=Object.freeze(SLOT_ORDER.map(slot=>{
    const row=bySlot.get(slot);
    if(!row)throw new Error(`PRACTICE_RUNNER_SLOT_MISSING:${slot}`);
    return Object.freeze({
      slot,
      equipped:row.equipped===true,
      itemId:row.equipped?clean(row.itemId):null,
      itemName:row.equipped?clean(row.itemName):null,
      gfx:row.equipped?clean(row.gfx):'',
      modifiers:Object.freeze({
        hp:finite(row?.modifiers?.hp??0,`${slot}_hp`),
        attack:finite(row?.modifiers?.attack??0,`${slot}_attack`),
        defense:finite(row?.modifiers?.defense??0,`${slot}_defense`)
      })
    });
  }));

  return Object.freeze({
    version:1,
    mode:'PRACTICE',
    rewardSettlement:false,
    dungeonBudget:100,
    // Optional: lets Practice's AI Encounter Assist authenticate to the suggest-encounter Edge
    // Function without ever importing the Supabase client itself. Never used for progression.
    accessToken:accessToken?clean(accessToken):null,
    playerRunnerId:clean(runner.id),
    runnerTemplateId:clean(runner.templateId),
    runnerName:clean(runner.name),
    progressionVersion:clean(runner.progressionVersion),
    catalogVersion:clean(runner.catalogVersion),
    baseStats:Object.freeze({
      hp:finite(runner.baseStats.hp,'base_hp'),
      attack:finite(runner.baseStats.attack,'base_attack'),
      defense:finite(runner.baseStats.defense,'base_defense')
    }),
    effectiveStats:Object.freeze({
      hp:finite(runner.stats.hp,'effective_hp'),
      attack:finite(runner.stats.attack,'effective_attack'),
      defense:finite(runner.stats.defense,'effective_defense')
    }),
    gear
  });
}

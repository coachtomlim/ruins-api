import {presetById} from '../flare-s71/calibration.mjs';
import {estimateEncounter} from '../flare-s71/calibration.mjs';

// Friend Feedback 002E1 — three outcome-based starting presets, built entirely from the existing
// governed preset library (calibration.mjs's 6 named LEGACY_PRESETS, reachable via presetById) and
// the existing deterministic estimateEncounter(). No new monster/trap/support combinations are
// invented here; HARDCORE/IMPOSSIBLE are deliberately not surfaced yet (Part I), but every preset
// still carries a stable `kind` so a future tier can be added without reshaping this contract.
const GOVERNED_PRESET_IDS=['soft','light','balanced','firm','hard','brutal'];

function interpretation(kind,estimatedHpPercent,targetHp){
  const estimate=Math.round(estimatedHpPercent),target=Math.round(targetHp);
  if(kind==='too-easy')return `Estimated finish ~${estimate}% HP. Likely too gentle for the ${target}% target.`;
  if(kind==='just-right')return `Estimated finish ~${estimate}% HP. Closest starting setup to the ${target}% target.`;
  return `Estimated finish ~${estimate}% HP. Likely too harsh, but the Runner should still have a chance to clear.`;
}

// Band definitions (Part B), relative to the challenged target, not hard-coded to 60%:
//   JUST RIGHT: the legal preset with the smallest |estimate - target| (ties broken by lower cost).
//   TOO EASY:   among legal presets with estimate - target > TOO_EASY_MARGIN, the one CLOSEST to
//               that boundary (gentlest "too easy" option, not necessarily the single gentlest
//               preset in the whole library).
//   BRUTAL:     among legal presets with target - estimate > BRUTAL_MARGIN, the one CLOSEST to
//               that boundary (least-extreme "brutal" option) — this is what keeps Brutal
//               "plausibly clearable" rather than the single harshest preset regardless of target.
// Fallback: the governed library only has 6 fixed presets, so for an unusually tanky Runner at a
// moderate target (or an unusually fragile Runner at an extreme target) there may be no legal
// preset that actually clears a ±15-point margin from JUST RIGHT in one direction. When that
// happens the nearest still-unused legal preset on that side is used instead, and if even that
// doesn't exist, the slot falls back to JUST RIGHT's own preset (a known, documented limitation of
// a 6-preset library, not a silent ordering violation).
const MARGIN=15;

export function buildDungeonPresets({catalog,model,runnerId,runner,targetHp,budget,roomIds=[]}={}){
  const target=Number(targetHp);
  if(!Number.isFinite(target))throw new Error('Target HP unavailable');
  const legalBudget=Number(budget)||Number(model?.budget)||100;
  const evaluated=GOVERNED_PRESET_IDS.map(id=>{
    const encounter=presetById(id);
    const estimate=estimateEncounter({catalog,model,runnerId,runner,encounter});
    return Object.freeze({id,encounter,estimate});
  }).filter(x=>x.estimate.cost<=legalBudget);
  if(evaluated.length<1)throw new Error('No legal dungeon presets within budget');

  const byClosestToTarget=[...evaluated].sort((a,b)=>Math.abs(a.estimate.estimatedHpPercent-target)-Math.abs(b.estimate.estimatedHpPercent-target)||a.estimate.cost-b.estimate.cost);
  const justRight=byClosestToTarget[0];

  const tooEasyBand=evaluated.filter(x=>x.estimate.estimatedHpPercent-target>MARGIN).sort((a,b)=>a.estimate.estimatedHpPercent-b.estimate.estimatedHpPercent);
  const brutalBand=evaluated.filter(x=>target-x.estimate.estimatedHpPercent>MARGIN).sort((a,b)=>b.estimate.estimatedHpPercent-a.estimate.estimatedHpPercent);

  // Fallback candidates must be strictly on the correct side of JUST RIGHT's own estimate, or the
  // ordering invariant (tooEasy > justRight > brutal) would be violated by picking "any other
  // preset" without regard to direction.
  const aboveJustRight=evaluated.filter(x=>x.id!==justRight.id&&x.estimate.estimatedHpPercent>justRight.estimate.estimatedHpPercent).sort((a,b)=>a.estimate.estimatedHpPercent-b.estimate.estimatedHpPercent);
  const belowJustRight=evaluated.filter(x=>x.id!==justRight.id&&x.estimate.estimatedHpPercent<justRight.estimate.estimatedHpPercent).sort((a,b)=>b.estimate.estimatedHpPercent-a.estimate.estimatedHpPercent);

  const tooEasy=tooEasyBand[0]||aboveJustRight[0]||justRight;
  const brutal=brutalBand[0]||belowJustRight[0]||justRight;

  const rooms=Array.isArray(roomIds)&&roomIds.length?roomIds:['iron-labyrinth-01'];
  const roomFor=index=>rooms[index%rooms.length];

  const build=(kind,label,picked,roomIndex)=>Object.freeze({
    kind,
    label,
    recommended:kind==='just-right',
    roomId:roomFor(roomIndex),
    encounter:Object.freeze({
      enemyTypes:Object.freeze([...picked.encounter.enemyTypes]),
      trapTypes:Object.freeze([...(picked.encounter.trapTypes||[])]),
      supportTypes:Object.freeze([...(picked.encounter.supportTypes||[])])
    }),
    estimatedHpPercent:picked.estimate.estimatedHpPercent,
    targetHp:target,
    budgetUsed:picked.estimate.cost,
    totalBudget:legalBudget,
    interpretation:interpretation(kind,picked.estimate.estimatedHpPercent,target)
  });

  return Object.freeze({
    tooEasy:build('too-easy','TOO EASY',tooEasy,0),
    justRight:build('just-right','JUST RIGHT',justRight,1),
    brutal:build('brutal','BRUTAL',brutal,2)
  });
}

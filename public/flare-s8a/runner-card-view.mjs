import {decomposeLegacyRunnerForStarterGear} from './starter-runner-adapter.mjs';

const clean=value=>String(value??'').trim();

export function buildRunnerCardView(runner={}){
  const d=decomposeLegacyRunnerForStarterGear(runner);
  return Object.freeze({
    id:clean(runner.id),
    name:clean(runner.name)||'Hero-Runner',
    className:clean(runner.className)||'Warrior',
    level:Number(runner.level)||1,
    stats:Object.freeze({hp:d.effective.hp,attack:d.effective.attack,defense:d.effective.defense}),
    breakdown:Object.freeze({
      hp:`${d.base.hp} base`,
      attack:`${d.base.attack} base + 4 Club`,
      defense:`${d.base.defense} base + 1 Wooden Shield`
    }),
    equipment:Object.freeze([
      Object.freeze({slot:'weapon',name:'Wooden Club',effect:'+4 ATK'}),
      Object.freeze({slot:'shield',name:'Wooden Shield',effect:'+1 DEF'})
    ])
  });
}

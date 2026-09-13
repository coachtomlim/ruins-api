import {STARTER_CLUB,STARTER_SHIELD} from './starter-loadout.mjs';
import {applyRunnerProgression} from './runner-progression.mjs';

const finite=value=>{const n=Number(value);if(!Number.isFinite(n))throw new Error('Runner stat must be finite');return n};

export function decomposeLegacyRunnerForStarterGear(runner={}){
  const baseHp=finite(runner.baseHp),baseAttack=finite(runner.baseAttack),legacyBaseDefense=finite(runner.baseDefense);
  const weaponAttack=finite(runner.weapon?.attack??STARTER_CLUB.modifiers.attack);
  if(weaponAttack!==STARTER_CLUB.modifiers.attack)throw new Error('Legacy Runner weapon attack does not match governed starter Club');
  if(legacyBaseDefense<STARTER_SHIELD.modifiers.defense)throw new Error('Legacy Runner defense cannot absorb starter Shield decomposition');
  const base=Object.freeze({hp:baseHp,attack:baseAttack,defense:legacyBaseDefense-STARTER_SHIELD.modifiers.defense});
  const progression=Object.freeze({statBonuses:Object.freeze({hp:0,attack:0,defense:0}),equipment:Object.freeze({weapon:STARTER_CLUB,shield:STARTER_SHIELD,head:null,chest:null,hands:null,legs:null,feet:null})});
  const effective=applyRunnerProgression(base,progression);
  return Object.freeze({base,progression,effective:Object.freeze({hp:effective.hp,attack:effective.attack,defense:effective.defense})});
}

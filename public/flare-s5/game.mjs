import {applyGameModel as applyS4Model,runnerSummary as s4RunnerSummary,monsterSummary as s4MonsterSummary,trapSummary,buildS4Challenge} from '../flare-s4/game.mjs';

export const S5_VERSION='web-flare-s5-0.1.0';
export const ROOM_IDS=Object.freeze(['iron-labyrinth-01','iron-labyrinth-07','iron-labyrinth-15']);
export const DEFAULT_ENCOUNTER=Object.freeze({enemyTypes:['goblin','skeleton','none'],potion:true,trap:false});

export function runnerIds(model){return Object.keys(model?.runners||{})}
export function runnerById(model,id){const runner=model?.runners?.[id];if(!runner)throw Error(`Unknown runner: ${id}`);return structuredClone(runner)}
export function modelForRunner(model,id){const runner=runnerById(model,id);return{version:model.version,runner,monsters:structuredClone(model.monsters),items:structuredClone(model.items)}}
export function applyRunnerModel(baseCatalog,model,id){return applyS4Model(baseCatalog,modelForRunner(model,id))}
export function runnerSummary(model,id,catalog){return s4RunnerSummary(modelForRunner(model,id),catalog)}
export function monsterSummary(monsterId,model,runnerId,catalog,runner){return s4MonsterSummary(monsterId,modelForRunner(model,runnerId),catalog,runner)}
export {trapSummary};

export function targetInstruction(targetHp){const n=Number(targetHp);if(!Number.isInteger(n)||n<5||n>95||n%5!==0)throw Error('Target HP must be 5..95 in steps of 5');return `Build a gauntlet that leaves the runner as close as possible to ${n}% HP.`}
export function actualHpPercent(status,hp,maxHp){if(status==='dead')return 0;const max=Number(maxHp);if(!(max>0))throw Error('Invalid runner max HP');return Math.max(0,Math.min(100,(Number(hp)||0)/max*100))}
export function scoreForTarget(status,hp,targetHp,maxHp=100){if(status!=='cleared'&&status!=='dead')return 0;const actual=actualHpPercent(status,hp,maxHp);return Math.max(0,100-Math.abs(actual-Number(targetHp))*2)}
export function scoreLabel(score){if(score>=95)return'Bullseye';if(score>=80)return'Excellent';if(score>=60)return'Close';if(score>=30)return'Off target';return'Way off'}

export function encounterCost(catalog,{enemyTypes=DEFAULT_ENCOUNTER.enemyTypes,potion=DEFAULT_ENCOUNTER.potion,trap=DEFAULT_ENCOUNTER.trap}={}){
  let total=0;for(const type of enemyTypes||[]){if(type&&type!=='none'){if(!catalog?.enemies?.[type])throw Error(`Unknown enemy: ${type}`);total+=catalog.enemies[type].cost}}
  if(potion)total+=catalog.items['small-potion']?.cost||0;if(trap)total+=catalog.items['spike-trap']?.cost||0;return total;
}
export function buildReceiverDungeon({roomId,roomTitle,map,catalog,targetHp,enemyTypes=DEFAULT_ENCOUNTER.enemyTypes,potion=DEFAULT_ENCOUNTER.potion,trap=DEFAULT_ENCOUNTER.trap,budget=100}){
  return buildS4Challenge({roomId,roomTitle,map,catalog,targetHp,enemyTypes,potion,trap,budget});
}

export const BUILDER_REWARD_TIERS=Object.freeze([
  Object.freeze({minScore:100,maxScore:100,gold:25,label:'PERFECT'}),
  Object.freeze({minScore:75,maxScore:99.999,gold:20,label:'VERY CLOSE'}),
  Object.freeze({minScore:50,maxScore:74.999,gold:15,label:'CLOSE'}),
  Object.freeze({minScore:25,maxScore:49.999,gold:10,label:'OFF TARGET'}),
  Object.freeze({minScore:0,maxScore:24.999,gold:5,label:'FAR OFF'})
]);

export function rewardTeaser(){
  return Object.freeze({
    eyebrow:'PRECISION REWARD',
    headline:'WIN UP TO 25 GOLD',
    body:'The Hero must clear the dungeon. The closer the finishing HP is to the target, the more Builder Gold you earn.',
    compact:'CLEAR + HIT THE TARGET = MORE GOLD',
    tiers:BUILDER_REWARD_TIERS
  });
}

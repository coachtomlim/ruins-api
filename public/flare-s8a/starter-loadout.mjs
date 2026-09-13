import {applyRunnerProgression} from './runner-progression.mjs';

export const STARTER_CLUB=Object.freeze({id:'wooden-club',slot:'weapon',name:'Wooden Club',modifiers:Object.freeze({hp:0,attack:4,defense:0}),flareSource:'mods/fantasycore/items/base/weapons/melee/club.txt',gfx:'club'});
export const STARTER_SHIELD=Object.freeze({id:'wooden-shield',slot:'shield',name:'Wooden Shield',modifiers:Object.freeze({hp:0,attack:0,defense:1}),flareSource:'mods/fantasycore/items/base/shields/wood.txt',gfx:'buckler'});

export function rookieStarterProgression(){
  return Object.freeze({
    statBonuses:Object.freeze({hp:0,attack:0,defense:0}),
    equipment:Object.freeze({
      weapon:STARTER_CLUB,
      shield:STARTER_SHIELD,
      head:null,
      chest:null,
      hands:null,
      legs:null,
      feet:null
    })
  });
}

export function rookieStarterSnapshot(){
  const base=Object.freeze({hp:100,attack:8,defense:0});
  const effective=applyRunnerProgression(base,rookieStarterProgression());
  return Object.freeze({base,progression:rookieStarterProgression(),effective:Object.freeze({hp:effective.hp,attack:effective.attack,defense:effective.defense})});
}

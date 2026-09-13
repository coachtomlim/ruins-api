import {rookieStarterSnapshot} from '../flare-s8a/starter-loadout.mjs';
import {buildGearSlotsView} from '../flare-s8a/gear-slots-view.mjs';

export function buildAccountReadyView({goldBalance=0,savedGoalLabel='Saved goal ready'}={}){
  const starter=rookieStarterSnapshot();
  const loadout=Object.fromEntries(Object.entries(starter.progression.equipment).map(([slot,item])=>[slot,item?.id||null]));
  const itemsById={
    'wooden-club':{name:'Wooden Club'},
    'wooden-shield':{name:'Wooden Shield'}
  };
  return Object.freeze({
    title:'ACCOUNT READY',
    savedGoalLabel:String(savedGoalLabel||'Saved goal ready'),
    goldBalance:Math.max(0,Number(goldBalance)||0),
    runner:Object.freeze({name:'Rookie Warrior',stats:starter.effective}),
    gear:buildGearSlotsView({loadout,itemsById}),
    actions:Object.freeze(['BUILD YOUR CHALLENGE','UPGRADE YOUR RUNNER'])
  });
}

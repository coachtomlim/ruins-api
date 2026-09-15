import {rookieStarterSnapshot} from '../flare-s8a/starter-loadout.mjs';
import {buildGearSlotsView} from '../flare-s8a/gear-slots-view.mjs';

const ITEM_CATALOG=Object.freeze({
  'wooden-club':Object.freeze({name:'Wooden Club',modifiers:Object.freeze({hp:0,attack:4,defense:0})}),
  'wooden-shield':Object.freeze({name:'Wooden Shield',modifiers:Object.freeze({hp:0,attack:0,defense:1})})
});

const SLOT_KEYS=Object.freeze(['weapon','shield','head','chest','hands','legs','feet']);

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

export function buildAccountReadyViewFromBackend(account){
  if(!account?.profile||!account?.runner||!account?.loadout)throw new Error('AUTHORITATIVE_ACCOUNT_STATE_REQUIRED');
  if(account.runner.runner_template_id!=='warrior-l1')throw new Error('UNSUPPORTED_STARTER_RUNNER');
  const ownershipById=new Map((account.ownedEquipment||[]).map(row=>[row.id,row]));
  const loadout={};
  const equippedItems=[];
  for(const slot of SLOT_KEYS){
    const ownershipId=account.loadout[`${slot}_ownership_id`]||null;
    const owned=ownershipId?ownershipById.get(ownershipId):null;
    if(ownershipId&&!owned)throw new Error(`LOADOUT_OWNERSHIP_MISSING:${slot}`);
    if(owned&&owned.slot!==slot)throw new Error(`LOADOUT_SLOT_MISMATCH:${slot}`);
    loadout[slot]=owned?.item_id||null;
    if(owned)equippedItems.push(ITEM_CATALOG[owned.item_id]||{name:owned.item_id,modifiers:{hp:0,attack:0,defense:0}});
  }
  const stats=equippedItems.reduce((total,item)=>({
    hp:total.hp+(Number(item.modifiers?.hp)||0),
    attack:total.attack+(Number(item.modifiers?.attack)||0),
    defense:total.defense+(Number(item.modifiers?.defense)||0)
  }),{hp:100,attack:8,defense:0});
  const latestGoal=account.savedGoals?.[0]||null;
  const savedGoalLabel=latestGoal
    ?`${latestGoal.source_sender_name||'Friend'} · ${latestGoal.source_runner_name||latestGoal.source_runner_id} · ${latestGoal.target_hp}% HP`
    :'No saved goal yet';
  return Object.freeze({
    title:'ACCOUNT READY',
    displayName:String(account.profile.display_name||account.identity?.email||'Player'),
    email:String(account.identity?.email||''),
    savedGoalLabel,
    goldBalance:Math.max(0,Number(account.goldBalance)||0),
    runner:Object.freeze({name:String(account.runner.display_name||'Rookie Warrior'),stats:Object.freeze(stats)}),
    gear:buildGearSlotsView({loadout,itemsById:ITEM_CATALOG}),
    actions:Object.freeze(['BUILD YOUR CHALLENGE','UPGRADE YOUR RUNNER'])
  });
}

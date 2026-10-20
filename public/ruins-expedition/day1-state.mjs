// RUINS_DAILY_EXPEDITION_001B: deterministic, LOCAL-PROOF-ONLY reference authority.
// Do not use this client-side reducer to settle transferable Gold, XP, equipment or accounts.
export const DAY1_DEFINITION = 'ruins-gate-c-015';
export const DAY1_SOURCE = Object.freeze({
  room01: 'gate_c_room_01.txt', room02: 'gate_c_room_02.txt',
  discovery: 'gate_c_discovery', reward: 'gate_c_r2_reward',
  chest: 'ruins-gate-c-015:room02:chest:01',
  zombie: 'ruins-gate-c-015:room02:zombie:01:defeat'
});
export const PROOF_POLICY = Object.freeze({kind:'LOCAL_NONTRANSFERABLE', calendar:'UNRESOLVED', rest:'UNRESOLVED', retry:'UNRESOLVED', missed:'UNRESOLVED'});
const clone=value=>JSON.parse(JSON.stringify(value));
const requireTrue=(condition,code)=>{if(!condition)throw new Error(code)};
export const gridDistance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function createDay1State({id='local-proof-expedition',definition=DAY1_DEFINITION}={}){
  return {
    schema:1,definition,id,revision:0,status:'ACTIVE',currentDay:1,currentRoom:1,
    dayState:{1:'ACTIVE',2:'LOCKED',3:'LOCKED',4:'LOCKED',5:'LOCKED'},
    roomState:{1:'ACTIVE',2:'LOCKED'}, checkpoint:'day1-room1-entry',
    hero:{x:2,y:4,hp:100,maxHp:100,inventory:{},xp:0,gold:0,equipment:{}},
    flags:{gate_c_discovery:false,gate_c_r2_reward:false},
    encounter:{zombie:{id:'room02-zombie-01',x:4,y:4,hp:60,defeated:false}},
    claimedLoot:{},operationReceipts:{},eventJournal:[],
    policy:clone(PROOF_POLICY)
  };
}
function signature(command){return JSON.stringify([command.type,command.direction??null,command.target??null]);}
function inRectangle(point,{x,y,w,h}){return point.x>=x&&point.x<x+w&&point.y>=y&&point.y<y+h;}
const ROOM1_ALTAR={x:2,y:3,w:3,h:3};
const ROOM1_EXIT={x:6,y:1,w:1,h:6};
const ROOM2_CHEST={x:5,y:4};
const DIRECTIONS=Object.freeze({up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]});
export function applyDay1Command(input,command,rooms){
  requireTrue(input?.schema===1&&input.definition===DAY1_DEFINITION,'UNSUPPORTED_EXPEDITION_STATE');
  requireTrue(command&&typeof command.id==='string'&&command.id.length>0&&command.id.length<=128,'OPERATION_ID_REQUIRED');
  const fingerprint=signature(command);
  const prior=input.operationReceipts[command.id];
  if(prior){requireTrue(prior.fingerprint===fingerprint,'OPERATION_ID_PAYLOAD_MISMATCH');return {state:input,receipt:clone({...prior,duplicate:true})};}
  requireTrue(command.expectedRevision===input.revision,'REVISION_CONFLICT');
  requireTrue(input.status==='ACTIVE','DAY_ALREADY_SETTLED');
  const next=clone(input),events=[];
  const hero=next.hero,zombie=next.encounter.zombie;
  const room=rooms?.[next.currentRoom];
  requireTrue(room?.width===8&&room?.height===8,'AUTHORED_ROOM_REQUIRED');
  switch(command.type){
    case 'MOVE': {
      const direction=DIRECTIONS[command.direction];requireTrue(direction,'BAD_DIRECTION');
      const x=hero.x+direction[0],y=hero.y+direction[1];
      requireTrue(x>=0&&y>=0&&x<8&&y<8&&room.collision[y*8+x]===0,'BLOCKED_TILE');
      requireTrue(!(next.currentRoom===2&&!zombie.defeated&&zombie.x===x&&zombie.y===y),'ENEMY_OCCUPIES_TILE');
      hero.x=x;hero.y=y;events.push('move');break;
    }
    case 'DISCOVER_ALTAR': {
      requireTrue(next.currentRoom===1,'WRONG_ROOM');
      requireTrue(inRectangle(hero,ROOM1_ALTAR),'NOT_AT_ALTAR');
      requireTrue(!next.flags.gate_c_discovery,'ALREADY_DISCOVERED');
      next.flags.gate_c_discovery=true;next.roomState[1]='CLEARED';events.push('altar_discovered');break;
    }
    case 'ENTER_ROOM2': {
      requireTrue(next.currentRoom===1,'WRONG_ROOM');requireTrue(next.flags.gate_c_discovery,'ALTAR_REQUIRED');
      requireTrue(inRectangle(hero,{x:5,y:1,w:2,h:6}),'NOT_AT_ROOM1_EXIT');
      next.currentRoom=2;next.roomState[2]='ACTIVE';next.checkpoint='day1-room2-entry';hero.x=1;hero.y=4;
      events.push('door_open','room02_entered');break;
    }
    case 'ATTACK_ZOMBIE': {
      requireTrue(next.currentRoom===2,'WRONG_ROOM');requireTrue(!zombie.defeated,'ENCOUNTER_ALREADY_CLEARED');
      requireTrue(gridDistance(hero,zombie)<=1,'ENEMY_OUT_OF_RANGE');
      // Proof-only fixed combat fixture. Native Flare level-1 zombie is HP60, XP2.
      zombie.hp=Math.max(0,zombie.hp-20);events.push('zombie_hit');
      if(zombie.hp===0){
        zombie.defeated=true;next.claimedLoot[DAY1_SOURCE.zombie]={kind:'XP',xp:2,fixture:true};hero.xp+=2;
        events.push('zombie_die');
      }else{hero.hp=Math.max(0,hero.hp-5);events.push('player_hit');}
      if(hero.hp===0){next.status='DEAD';events.push('player_die');}
      break;
    }
    case 'CLAIM_ROOM2_CHEST': {
      requireTrue(next.currentRoom===2,'WRONG_ROOM');
      requireTrue(zombie.defeated,'ZOMBIE_NOT_DEFEATED');
      requireTrue(gridDistance(hero,ROOM2_CHEST)<=1,'NOT_AT_CHEST');
      if(next.claimedLoot[DAY1_SOURCE.chest])events.push('already_claimed');
      else{
        // The source's chest_level_1 guarantees gold 20..40 plus stock loot tables.
        // Only a visibly labelled 30-gold test fixture is simulated here.
        // No account wallet or portable inventory may accept this award.
        const payload={kind:'PROOF_CHEST',gold:30,fixture:true,source:'loot/chest_level_1.txt'};
        next.claimedLoot[DAY1_SOURCE.chest]=payload;hero.gold+=payload.gold;
        next.flags.gate_c_r2_reward=true;events.push('chest_claimed');
      }
      break;
    }
    case 'SETTLE_DAY1': {
      requireTrue(next.currentRoom===2,'WRONG_ROOM');requireTrue(zombie.defeated,'ZOMBIE_NOT_DEFEATED');
      requireTrue(Boolean(next.claimedLoot[DAY1_SOURCE.chest]),'CHEST_NOT_CLAIMED');
      next.status='AWAITING_DAY';next.dayState[1]='SETTLED';next.roomState[2]='CLEARED';
      next.checkpoint='day1-settled-room2';events.push('day1_settled');break;
    }
    default:throw new Error('UNKNOWN_EXPEDITION_OPERATION');
  }
  next.revision+=1;next.eventJournal.push({revision:next.revision,events});
  const receipt={id:command.id,fingerprint,revision:next.revision,events,claimedSources:Object.keys(next.claimedLoot),status:next.status};
  next.operationReceipts[command.id]=receipt;
  return {state:next,receipt:clone(receipt)};
}
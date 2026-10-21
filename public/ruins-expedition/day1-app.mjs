import {loadAuthoredDay1Rooms} from './day1-content.mjs';
import {createDay1IndexedDbStore} from './day1-store.mjs';
import {createAudioManager} from '../flare-s8a/audio-manager.mjs';
import {createDay1ArtRenderer} from './day1-art.mjs';
const $=id=>document.getElementById(id);
const board=$('board');
const store=createDay1IndexedDbStore();const audio=createAudioManager();
let state,rooms,art,busy=false,message='',settledThisSession=false;
function say(text){message=text;$('notice').textContent=text}
function actionKind(){if(state.status!=='ACTIVE')return null;
  if(state.currentRoom===1)return state.flags.gate_c_discovery?'ENTER_ROOM2':'DISCOVER_ALTAR';
  if(!state.encounter.zombie.defeated)return 'ATTACK_ZOMBIE';
  if(!state.claimedLoot['ruins-gate-c-015:room02:chest:01'])return 'CLAIM_ROOM2_CHEST';
  return 'SETTLE_DAY1';
}
function soundState(){return state.status==='AWAITING_DAY'?'SAFE':state.currentRoom===2&&!state.encounter.zombie.defeated?'COMBAT':'EXPLORE';}
function update(){
  $('room').textContent=state.currentRoom+' / 2';$('hp').textContent=state.hero.hp;
  $('xp').textContent=state.hero.xp;$('gold').textContent=state.hero.gold;
  $('checkpoint').textContent='Checkpoint: '+(state.status==='AWAITING_DAY'?'Day 1 complete':'Room '+state.currentRoom);
  $('title').innerHTML='DAY 1 <span>'+ (state.currentRoom===1?'DISCOVERY ALTAR':'FIRST BLOOD')+'</span>';
  const kind=actionKind();$('primary').textContent=({DISCOVER_ALTAR:'EXAMINE ALTAR',ENTER_ROOM2:'ENTER ROOM 2',ATTACK_ZOMBIE:'STRIKE ZOMBIE',CLAIM_ROOM2_CHEST:'CLAIM FIRST REWARD',SETTLE_DAY1:'SECURE DAY 1 CHECKPOINT'})[kind]??'';
  $('primary').disabled=busy||!kind;
  const help=state.status==='AWAITING_DAY'?'Day 1 is saved. The next chapter is not available in this prototype.':
    kind==='DISCOVER_ALTAR'?'Stand in the altar area, then examine.':kind==='ENTER_ROOM2'?'Move to the right-hand passage, then enter.':kind==='ATTACK_ZOMBIE'?'Move adjacent to the zombie, then strike.':kind==='CLAIM_ROOM2_CHEST'?'Move adjacent to the chest, then claim.':'Finish the day to seal this checkpoint.';
  $('instructions').textContent=help;$('statusTag').textContent=state.status==='AWAITING_DAY'?'COMPLETE':state.currentRoom===1?(state.flags.gate_c_discovery?'PASSAGE OPEN':'DISCOVERY'):state.encounter.zombie.defeated?(state.claimedLoot['ruins-gate-c-015:room02:chest:01']?'REWARD SECURED':'VICTORY'):'DANGER';
  document.body.classList.toggle('day-complete',state.status==='AWAITING_DAY');$('completion').hidden=state.status!=='AWAITING_DAY';$('completion').classList.toggle('fresh',settledThisSession);
  audio.setMusicState(soundState());draw();
}
function draw(time=0){if(state&&art)art.draw(state,time)}
function animate(time){draw(time);requestAnimationFrame(animate)}
let serial=0;const operationId=()=>{serial+=1;return (globalThis.crypto?.randomUUID?.()??`local-${Date.now()}-${serial}`)};
async function execute(type,direction){if(busy||!state||state.status!=='ACTIVE')return;busy=true;update();
  const cmd={id:operationId(),expectedRevision:state.revision,type,...(direction?{direction}:{})};
  try{const {state:next,receipt}=await store.dispatch(cmd,rooms);state=next;
    for(const name of receipt.events){if(name==='door_open')audio.playSfx('DOOR_OPEN');if(name==='zombie_hit')audio.playSfx('ZOMBIE_HIT');if(name==='zombie_die')audio.playSfx('ZOMBIE_DIE');if(name==='player_hit')audio.playSfx('PLAYER_HIT');if(name==='chest_claimed'){audio.playSfx('GOLD_PICKUP');audio.playSfx('ITEM_PICKUP');}}
    if(receipt.events.includes('day1_settled'))settledThisSession=true;
    say(({altar_discovered:'The altar answers. The sealed passage is now open.',room02_entered:'First Blood. A zombie guards the treasure.',zombie_hit:'Your strike lands.',zombie_die:'Guardian defeated. Treasure revealed.',chest_claimed:'+30 local test Gold secured. This reward will not transfer.',already_claimed:'This chest is already empty. No repeat reward.',day1_settled:'Day 1 complete. Your checkpoint is secured.'})[receipt.events.at(-1)]??message);
  }catch(error){if(error.message==='REVISION_CONFLICT'){try{state=await store.load()}catch{};say('Another tab changed your expedition. Reconciled to latest checkpoint.');}else say('Cannot do that: '+error.message.replaceAll('_',' ').toLowerCase());}
  finally{busy=false;update();}
}
$('primary').addEventListener('click',()=>{audio.unlock();if(actionKind())void execute(actionKind())});
document.querySelectorAll('[data-direction]').forEach(btn=>btn.addEventListener('click',()=>{audio.unlock();void execute('MOVE',btn.dataset.direction)}));
window.addEventListener('keydown',event=>{const dir={ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left'}[event.key];if(dir&&!$('journalDialog').open){event.preventDefault();audio.unlock();void execute('MOVE',dir)}});
$('sound').addEventListener('click',()=>{$('sound').textContent=audio.toggle()?'Sound On':'Sound Off';audio.unlock()});
$('journal').addEventListener('click',()=>{if(!state)return;const l=state.claimedLoot;
  $('journalBody').innerHTML=`<p><b>DAY 1 · THE FIRST DESCENT</b></p><p>Rooms cleared: <b>${state.status==='AWAITING_DAY'?'2 of 10':state.currentRoom===2?'1 of 10':'0 of 10'}</b>.</p><p>Ancient altar: <b>${state.flags.gate_c_discovery?'DISCOVERED':'UNREAD'}</b><br>Guardian: <b>${state.encounter.zombie.defeated?'DEFEATED':'ALIVE'}</b><br>First chest: <b>${l['ruins-gate-c-015:room02:chest:01']?'CLAIMED ONCE':'NOT CLAIMED'}</b></p><p>Local test receipt: <b>${state.hero.gold} Gold · ${state.hero.xp} XP</b></p><p class="journalLocal">LOCAL PREVIEW · Rewards do not transfer to your account.</p>`;
  $('journalDialog').showModal();});
$('closeJournal').addEventListener('click',()=>$('journalDialog').close());
window.addEventListener('resize',draw);
try{[rooms,state,art]=await Promise.all([loadAuthoredDay1Rooms(),store.load(),createDay1ArtRenderer(board)]);if(state.schema!==1)throw new Error('UNSUPPORTED_STORED_VERSION');
  $('sound').textContent=audio.enabled?'Sound On':'Sound Off';say(state.status==='AWAITING_DAY'?'Checkpoint restored. Day 1 remains complete.':state.currentRoom===2?'Room 2 checkpoint restored.':'Find the ancient altar.');update();requestAnimationFrame(animate);
}catch(error){console.error(error);$('primary').disabled=true;document.querySelectorAll('[data-direction]').forEach(b=>b.disabled=true);say('Expedition unavailable: '+(error?.message||error));}

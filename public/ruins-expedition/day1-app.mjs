import {loadAuthoredDay1Rooms} from './day1-content.mjs';
import {createDay1IndexedDbStore} from './day1-store.mjs';
import {createAudioManager} from '../flare-s8a/audio-manager.mjs';
const $=id=>document.getElementById(id);
const board=$('board'),ctx=board.getContext('2d');
const store=createDay1IndexedDbStore();const audio=createAudioManager();
let state,rooms,busy=false,message='';
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
  const kind=actionKind();$('primary').textContent=({DISCOVER_ALTAR:'EXAMINE ALTAR',ENTER_ROOM2:'ENTER ROOM 2',ATTACK_ZOMBIE:'STRIKE ZOMBIE',CLAIM_ROOM2_CHEST:'CLAIM FIRST REWARD',SETTLE_DAY1:'COMPLETE DAY 1'})[kind]??'DAY 2 LOCKED';
  $('primary').disabled=busy||!kind;
  const help=state.status==='AWAITING_DAY'?'Day 1 saved. Return for the next two rooms when the daily rule is approved.':
    kind==='DISCOVER_ALTAR'?'Stand in the altar area, then examine.':kind==='ENTER_ROOM2'?'Move to the right-hand passage, then enter.':kind==='ATTACK_ZOMBIE'?'Move adjacent to the zombie, then strike.':kind==='CLAIM_ROOM2_CHEST'?'Move adjacent to the chest, then claim.':'Finish the day to seal this checkpoint.';
  $('instructions').textContent=help;$('statusTag').textContent=state.status==='AWAITING_DAY'?'DAY COMPLETE':state.currentRoom===1?'DISCOVER':'SURVIVE';
  audio.setMusicState(soundState());draw();
}
function diamond(cx,cy,w,h,fill,stroke){ctx.beginPath();ctx.moveTo(cx,cy-h/2);ctx.lineTo(cx+w/2,cy);ctx.lineTo(cx,cy+h/2);ctx.lineTo(cx-w/2,cy);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
function marker(px,py,label,color,size){ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(px,py+8,size*.68,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.arc(px,py-size*.35,size,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f6f0dd';ctx.lineWidth=1.3;ctx.stroke();ctx.fillStyle='#131515';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${Math.max(10,size)}px system-ui`;ctx.fillText(label,px,py-size*.35);}
function draw(){if(!state||!rooms)return;const rect=board.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  if(board.width!==Math.round(rect.width*dpr)||board.height!==Math.round(rect.height*dpr)){board.width=Math.round(rect.width*dpr);board.height=Math.round(rect.height*dpr)}
  const w=rect.width,h=rect.height;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const tw=Math.max(25,Math.min(52,(w-22)/8,(h-50)/4)),th=tw*.53,centerX=w/2,offsetY=Math.max(72,(h-8*th)/2+9);
  function point(x,y){return {px:centerX+(x-y)*tw/2,py:offsetY+(x+y)*th/2}}
  const room=rooms[state.currentRoom];for(let y=0;y<8;y++)for(let x=0;x<8;x++){
    const {px,py}=point(x,y),blocked=room.collision[y*8+x]===1;
    diamond(px,py,tw,th,blocked?'#1c2329':(x+y)%2?'#455047':'#4a544b',blocked?'#28333b':'#657465');
  }
  if(state.currentRoom===1){let p=point(3,4);marker(p.px,p.py-4,'✶','#d6b167',Math.max(12,tw*.32));p=point(6,3);marker(p.px,p.py,'⇥',state.flags.gate_c_discovery?'#95b89d':'#818783',Math.max(11,tw*.29));}
  else {let p=point(5,4);marker(p.px,p.py,'◆',state.claimedLoot['ruins-gate-c-015:room02:chest:01']?'#76807b':'#d5a950',Math.max(11,tw*.28));
    if(!state.encounter.zombie.defeated){p=point(4,4);marker(p.px,p.py-3,'Z','#8bba83',Math.max(12,tw*.34));}}
  const hero=point(state.hero.x,state.hero.y);marker(hero.px,hero.py-6,'H','#8dbfdf',Math.max(12,tw*.33));
  ctx.fillStyle='#c4c9be';ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText('Isometric source layout • coordinates and collision from accepted Gate C',w/2,h-23);
}
let serial=0;const operationId=()=>{serial+=1;return (globalThis.crypto?.randomUUID?.()??`local-${Date.now()}-${serial}`)};
async function execute(type,direction){if(busy||!state||state.status!=='ACTIVE')return;busy=true;update();
  const cmd={id:operationId(),expectedRevision:state.revision,type,...(direction?{direction}:{})};
  try{const {state:next,receipt}=await store.dispatch(cmd,rooms);state=next;
    for(const name of receipt.events){if(name==='door_open')audio.playSfx('DOOR_OPEN');if(name==='zombie_hit')audio.playSfx('ZOMBIE_HIT');if(name==='zombie_die')audio.playSfx('ZOMBIE_DIE');if(name==='player_hit')audio.playSfx('PLAYER_HIT');if(name==='chest_claimed'){audio.playSfx('GOLD_PICKUP');audio.playSfx('ITEM_PICKUP');}}
    say(({altar_discovered:'The altar answers. A sealed route opens deeper into the ruins.',room02_entered:'Room 2: First Blood. The zombie approaches.',zombie_hit:'Your strike lands.',zombie_die:'Zombie defeated. First Reward is available.',chest_claimed:'Claim sealed: +30 proof-only gold. This cannot be transferred.',already_claimed:'This cache was claimed already. No repeat reward.',day1_settled:'Day 1 complete. Your checkpoint and loot claim are saved.'})[receipt.events.at(-1)]??message);
  }catch(error){if(error.message==='REVISION_CONFLICT'){try{state=await store.load()}catch{};say('Another tab changed your expedition. Reconciled to latest checkpoint.');}else say('Cannot do that: '+error.message.replaceAll('_',' ').toLowerCase());}
  finally{busy=false;update();}
}
$('primary').addEventListener('click',()=>{audio.unlock();if(actionKind())void execute(actionKind())});
document.querySelectorAll('[data-direction]').forEach(btn=>btn.addEventListener('click',()=>{audio.unlock();void execute('MOVE',btn.dataset.direction)}));
window.addEventListener('keydown',event=>{const dir={ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left'}[event.key];if(dir&&!$('journalDialog').open){event.preventDefault();audio.unlock();void execute('MOVE',dir)}});
$('sound').addEventListener('click',()=>{$('sound').textContent=audio.toggle()?'Sound On':'Sound Off';audio.unlock()});
$('journal').addEventListener('click',()=>{if(!state)return;const l=state.claimedLoot;
  $('journalBody').innerHTML=`<p>Expedition: <b>Gate C / Day 1</b>. Room ${state.currentRoom}. Revision ${state.revision}.</p><p>Altar: <b>${state.flags.gate_c_discovery?'DISCOVERED':'UNREAD'}</b>. Zombie: <b>${state.encounter.zombie.defeated?'DEFEATED':'ALIVE'}</b>.</p><p>First Reward: <b>${l['ruins-gate-c-015:room02:chest:01']?'CLAIMED ONCE':'NOT CLAIMED'}</b>.</p><p>Proof rewards: ${state.hero.gold} gold, ${state.hero.xp} XP. These cannot be transferred to an account or the Friend loop.</p><p>Day 2: <b>LOCKED</b> pending Owner policy and backend approval.</p>`;
  $('journalDialog').showModal();});
$('closeJournal').addEventListener('click',()=>$('journalDialog').close());
window.addEventListener('resize',draw);
try{[rooms,state]=await Promise.all([loadAuthoredDay1Rooms(),store.load()]);if(state.schema!==1)throw new Error('UNSUPPORTED_STORED_VERSION');
  $('sound').textContent=audio.enabled?'Sound On':'Sound Off';say(state.status==='AWAITING_DAY'?'Day 1 already settled. No replay loot is available.':state.currentRoom===2?'Room 2 checkpoint restored.':'Room 1 restored. Find the ancient altar.');update();
}catch(error){console.error(error);$('primary').disabled=true;document.querySelectorAll('[data-direction]').forEach(b=>b.disabled=true);say('Expedition unavailable: '+(error?.message||error));}

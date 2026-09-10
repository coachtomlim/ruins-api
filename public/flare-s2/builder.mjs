import {ROOMS,loadStockRoom,drawPreview} from './stock.mjs';
import {buildChallenge,encodeChallenge} from './core.mjs';

const $=id=>document.getElementById(id);
const roomSpecs=Object.values(ROOMS);
const stepNames=['ROOM','ENCOUNTER','PREDICTION','SEND'];
let step=0,roomIndex=0,catalog=null,currentUrl=null;
const loadedRooms=new Map();

function selectedSpec(){return roomSpecs[roomIndex];}
function selectedLoaded(){return loadedRooms.get(selectedSpec().id);}
function invalidate(){currentUrl=null;$('shareNow').disabled=true;$('url').value='';}
function currentSpend(){
  if(!catalog)return 0;let spent=0;
  for(const id of ['enemy1','enemy2','enemy3']){const type=$(id).value;if(type!=='none')spent+=catalog.enemies[type].cost;}
  if($('potion').checked)spent+=catalog.items['small-potion'].cost;return spent;
}

function playerUrl(challenge){const url=new URL('player.html',location.href);url.hash='c='+encodeChallenge(challenge);return url;}

function renderRoom(){
  const spec=selectedSpec(),loaded=selectedLoaded();
  $('roomName').textContent=spec.name;$('roomTier').textContent=`Stock Flare room · Tier ${spec.tier}`;$('roomIndex').textContent=`${roomIndex+1} / ${roomSpecs.length}`;
  if(loaded)drawPreview($('roomPreview'),loaded.map,loaded.tiles);invalidate();updateNav();
}
function changeRoom(delta){roomIndex=(roomIndex+delta+roomSpecs.length)%roomSpecs.length;renderRoom();}

function presetSignature(){return ['enemy1','enemy2','enemy3'].map(id=>$(id).value).join(',')+'|'+$('potion').checked;}
function presetName(){const s=presetSignature();if(s==='goblin,none,none|true')return'light';if(s==='goblin,skeleton,none|true')return'balanced';if(s==='skeleton,skeleton,goblin|true')return'heavy';return'';}
function markPreset(){const name=presetName();for(const b of document.querySelectorAll('[data-preset]'))b.classList.toggle('active',b.dataset.preset===name);}
function applyPreset(name){
  const presets={light:['goblin','none','none'],balanced:['goblin','skeleton','none'],heavy:['skeleton','skeleton','goblin']};const values=presets[name];if(!values)return;
  ['enemy1','enemy2','enemy3'].forEach((id,i)=>$(id).value=values[i]);$('potion').checked=true;costs();
}
function costs(){
  const spent=currentSpend();$('spent').textContent=spent;$('budgetFill').style.width=`${Math.min(100,spent)}%`;
  const remaining=100-spent;$('budgetMessage').textContent=remaining>=0?`${remaining} gold remaining`:`Over budget by ${-remaining} gold`;$('budgetMessage').classList.toggle('bad',remaining<0);
  markPreset();invalidate();updateNav();return spent;
}

function canAdvance(){if(step===0)return loadedRooms.size===roomSpecs.length;if(step===1)return currentSpend()<=100;return true;}
function updateNav(){
  $('back').disabled=step===0;const next=$('next');next.style.visibility=step===3?'hidden':'visible';next.disabled=step<3&&!canAdvance();next.innerHTML=step===2?'REVIEW <span>›</span>':'NEXT <span>›</span>';
  $('stepTitle').textContent=stepNames[step];$('stepCount').textContent=`${step+1} of 4`;
  for(const dot of document.querySelectorAll('.dot')){const n=Number(dot.dataset.step);dot.classList.toggle('active',n===step);if(n===step)dot.setAttribute('aria-current','step');else dot.removeAttribute('aria-current');}
}
function goStep(nextStep){
  nextStep=Math.max(0,Math.min(3,nextStep));if(nextStep>step&&!canAdvance())return;step=nextStep;$('track').style.transform=`translateX(-${step*100}%)`;updateNav();
  if(step===0)requestAnimationFrame(renderRoom);if(step===3)buildAndReview();
}

function buildAndReview(){
  try{
    const enemyTypes=['enemy1','enemy2','enemy3'].map(id=>$(id).value),loaded=selectedLoaded(),spec=selectedSpec();
    const built=buildChallenge({roomId:spec.id,roomTitle:spec.name,enemyTypes,potion:$('potion').checked,targetHp:Number($('target').value),catalog,map:loaded.map,budget:100});
    currentUrl=playerUrl(built.challenge);$('url').value=currentUrl.href;$('open').href=currentUrl.href;$('reviewRoom').textContent=spec.name;
    const labels=enemyTypes.filter(t=>t!=='none').map(t=>catalog.enemies[t].name);if($('potion').checked)labels.push('Potion');$('reviewEnemies').textContent=labels.length?labels.join(' + '):'Empty room';
    $('reviewSpent').textContent=`${built.spent} / 100 gold`;$('reviewTarget').textContent=`${$('target').value}% HP`;$('shareNow').disabled=false;$('status').textContent='Ready to send.';
  }catch(error){currentUrl=null;$('shareNow').disabled=true;$('status').textContent=error.message;}
}

async function copyLink(){
  if(!currentUrl)return;try{await navigator.clipboard.writeText(currentUrl.href);$('status').textContent='Challenge link copied.';}
  catch{$('url').style.display='block';$('url').select();try{document.execCommand('copy');$('status').textContent='Challenge link copied.';}catch{$('status').textContent='Select and copy the link.';}}
}
async function shareChallenge(){
  if(!currentUrl)return;const data={title:'Quick Dungeon Challenge',text:`Can you clear ${selectedSpec().name}? I predict ${$('target').value}% health.`,url:currentUrl.href};
  if(navigator.share){try{await navigator.share(data);$('status').textContent='Challenge shared.';return;}catch(e){if(e?.name==='AbortError')return;}}await copyLink();
}

$('prevRoom').addEventListener('click',()=>changeRoom(-1));$('nextRoom').addEventListener('click',()=>changeRoom(1));$('back').addEventListener('click',()=>goStep(step-1));$('next').addEventListener('click',()=>goStep(step+1));
for(const dot of document.querySelectorAll('.dot'))dot.addEventListener('click',()=>{const n=Number(dot.dataset.step);if(n<=step)goStep(n);});
for(const b of document.querySelectorAll('[data-preset]'))b.addEventListener('click',()=>applyPreset(b.dataset.preset));for(const id of ['enemy1','enemy2','enemy3','potion'])$(id).addEventListener('change',costs);
$('target').addEventListener('input',()=>{$('targetOut').textContent=$('target').value;invalidate();});$('shareNow').addEventListener('click',shareChallenge);$('copy').addEventListener('click',copyLink);

document.addEventListener('keydown',event=>{const tag=event.target?.tagName;if(['INPUT','SELECT','TEXTAREA'].includes(tag))return;if(event.key==='ArrowLeft'){event.preventDefault();step===0?changeRoom(-1):goStep(step-1);}if(event.key==='ArrowRight'){event.preventDefault();step===0?changeRoom(1):step<3&&goStep(step+1);}});
let swipeStart=null;$('roomStage').addEventListener('pointerdown',event=>{swipeStart={x:event.clientX,y:event.clientY,id:event.pointerId};});$('roomStage').addEventListener('pointerup',event=>{if(!swipeStart||swipeStart.id!==event.pointerId)return;const dx=event.clientX-swipeStart.x,dy=event.clientY-swipeStart.y;swipeStart=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2)changeRoom(dx<0?1:-1);});
new ResizeObserver(()=>{if(step===0&&selectedLoaded())drawPreview($('roomPreview'),selectedLoaded().map,selectedLoaded().tiles);}).observe($('roomStage'));

(async()=>{try{
  const response=await fetch(new URL('../flare-p0/data/catalog.json',location.href),{cache:'no-cache'});if(!response.ok)throw Error('Catalogue unavailable');catalog=await response.json();await Promise.all(roomSpecs.map(async spec=>loadedRooms.set(spec.id,await loadStockRoom(spec.id))));
  renderRoom();costs();$('targetOut').textContent=$('target').value;updateNav();
}catch(error){console.error(error);$('roomName').textContent='Could not load rooms';$('roomTier').textContent=error.message;$('budgetMessage').textContent='Reload to try again.';updateNav();}})();

import {loadS3ActorPack} from '../flare-s8a/actors.mjs';
import {loadLevel2ActorPack} from '../flare-s8a/level2-actors.mjs';
import {FLARE_115_PIN} from '../flare-s7/rooms.mjs';

const ROOT=`https://raw.githubusercontent.com/flareteam/flare-game/${FLARE_115_PIN}/`;
export const DAY1_ART_SOURCES=Object.freeze({
  stockPin:FLARE_115_PIN,
  cave:`${ROOT}mods/fantasycore/images/tilesets/tileset_cave.png`,
  doorLeft:`${ROOT}tiled/tilesheets/dungeon_door_left.png`,
  doorRight:`${ROOT}tiled/tilesheets/dungeon_door_right.png`,
  hero:'public/flare-s8a/actors.mjs (composed stock avatar layers)',
  zombie:'public/flare-s8a/level2-actors.mjs (stock zombie animation)'
});

const CAVE=Object.freeze({
  floor1:{x:1152,y:1149,w:192,h:96,ox:96,oy:48},
  floor2:{x:1344,y:1255,w:192,h:96,ox:96,oy:48},
  altarDormant:{x:0,y:0,w:384,h:192,ox:192,oy:96},
  altarActive:{x:384,y:0,w:384,h:192,ox:192,oy:96},
  chestClosed:{x:1916,y:2951,w:91,h:86,ox:40,oy:65},
  chestOpen:{x:1008,y:1690,w:121,h:106,ox:40,oy:85}
});

const images=new Map();
function image(url){
  if(!images.has(url))images.set(url,new Promise((resolve,reject)=>{
    const result=new Image();result.crossOrigin='anonymous';result.decoding='async';
    result.onload=()=>resolve(result);result.onerror=()=>reject(new Error(`RUINS_ART_IMAGE_FAILED:${url}`));result.src=url;
  }));
  return images.get(url);
}
function diamond(g,cx,cy,w,h,fill,stroke){
  g.beginPath();g.moveTo(cx,cy-h/2);g.lineTo(cx+w/2,cy);g.lineTo(cx,cy+h/2);g.lineTo(cx-w/2,cy);g.closePath();
  g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke()}
}
function stockFrame(g,atlas,frame,anchor,scale,alpha=1){
  g.save();g.globalAlpha=alpha;
  g.drawImage(atlas,frame.x,frame.y,frame.w,frame.h,anchor.x-frame.ox*scale,anchor.y-frame.oy*scale,frame.w*scale,frame.h*scale);
  g.restore();
}
function actorFrame(g,pack,id,state,anchor,targetHeight,time,{direction=2,alpha=1}={}){
  const spec=pack.sprites[id],atlas=pack.atlases[id],animation=spec?.animations?.[state]||spec?.animations?.stance;
  if(!animation||!atlas)return;
  const frameIndex=animation.frames>1?Math.floor(time/Math.max(80,animation.duration*1000/animation.frames))%animation.frames:0;
  const frame=animation.entries[`${frameIndex}:${direction}`]||animation.entries[`0:${direction}`]||Object.values(animation.entries)[0];
  const scale=targetHeight/frame.h;
  g.save();g.globalAlpha=alpha;g.drawImage(atlas,frame.x,frame.y,frame.w,frame.h,anchor.x-frame.ox*scale,anchor.y-frame.oy*scale,frame.w*scale,frame.h*scale);g.restore();
}
function door(g,left,right,anchor,scale,open){
  const sx=open?192:0,frameW=192,frameH=384,drawScale=scale*.72;
  g.save();g.globalAlpha=open?.92:1;
  g.drawImage(left,sx,0,frameW,frameH,anchor.x-frameW*drawScale*.84,anchor.y-frameH*drawScale*.78,frameW*drawScale,frameH*drawScale);
  g.drawImage(right,sx,0,frameW,frameH,anchor.x-frameW*drawScale*.16,anchor.y-frameH*drawScale*.78,frameW*drawScale,frameH*drawScale);
  g.restore();
}

export async function createDay1ArtRenderer(canvas){
  const [heroPack,zombiePack,cave,doorLeft,doorRight]=await Promise.all([
    loadS3ActorPack(),loadLevel2ActorPack(),image(DAY1_ART_SOURCES.cave),image(DAY1_ART_SOURCES.doorLeft),image(DAY1_ART_SOURCES.doorRight)
  ]);
  const g=canvas.getContext('2d');
  function draw(state,time=0){
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),width=Math.max(1,rect.width),height=Math.max(1,rect.height);
    if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr)}
    g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,width,height);
    const room2=state.currentRoom===2,tw=Math.min(76,Math.max(34,(width-20)/8.45,(height-18)/5.2)),th=tw*.5;
    const centerX=width/2,offsetY=Math.max(62,(height-8*th)/2+5),point=(x,y)=>({x:centerX+(x-y)*tw/2,y:offsetY+(x+y)*th/2});
    const background=g.createRadialGradient(width*.5,height*.45,20,width*.5,height*.48,width*.72);
    background.addColorStop(0,room2?'#34261f':'#22343a');background.addColorStop(.58,room2?'#171719':'#101a1f');background.addColorStop(1,'#070a0d');g.fillStyle=background;g.fillRect(0,0,width,height);
    const floor=room2?CAVE.floor2:CAVE.floor1,scale=tw/192;
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){
      const p=point(x,y);stockFrame(g,cave,floor,p,scale,state.status==='AWAITING_DAY'?.42:1);
      if(x===0||y===0||x===7||y===7)diamond(g,p.x,p.y,tw,th,'#0205089c','#51606a42');
    }
    if(!room2){
      const altar=state.flags.gate_c_discovery?CAVE.altarActive:CAVE.altarDormant,p=point(3,4);
      stockFrame(g,cave,altar,{x:p.x,y:p.y+th*.15},scale*.76);
      if(state.flags.gate_c_discovery){g.save();g.globalCompositeOperation='screen';g.fillStyle='#4cd9ff2e';g.beginPath();g.ellipse(p.x,p.y-th*.65,tw*1.35,th*1.05,0,0,Math.PI*2);g.fill();g.restore()}
      const exit=point(6,3);door(g,doorLeft,doorRight,{x:exit.x,y:exit.y+th*.65},scale,state.flags.gate_c_discovery);
    }else{
      const claimed=state.claimedLoot['ruins-gate-c-015:room02:chest:01'],chest=claimed?CAVE.chestOpen:CAVE.chestClosed,p=point(5,4);
      stockFrame(g,cave,chest,{x:p.x,y:p.y+th*.25},scale*1.75);
      const zombie=point(4,4),defeated=state.encounter.zombie.defeated;
      actorFrame(g,zombiePack,'zombie',defeated?'die':'stance',{x:zombie.x,y:zombie.y+th*.32},Math.max(54,tw*1.12),time,{direction:2,alpha:defeated?.42:1});
    }
    const hero=point(state.hero.x,state.hero.y);
    actorFrame(g,heroPack,'warrior','stance',{x:hero.x,y:hero.y+th*.25},Math.max(56,tw*1.08),time,{direction:room2?2:1});
    if(state.status==='AWAITING_DAY'){g.fillStyle='#071014ad';g.fillRect(0,0,width,height)}
  }
  return Object.freeze({draw,sources:DAY1_ART_SOURCES});
}

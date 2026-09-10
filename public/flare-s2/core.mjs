export const S2_VERSION = 'web-flare-s2-0.1.0';
export const walkable = value => value === 0 || value === 5 || value === 6;
const key=(x,y,w)=>y*w+x;
const dirs8=[[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]];

export function gridPath(map,start,goal){
  const {width:w,height:h,collision:c}=map;
  const open=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&walkable(c[key(x,y,w)]);
  const [sx,sy]=start,[gx,gy]=goal;
  if(!open(sx,sy)||!open(gx,gy))return null;
  const first=key(sx,sy,w),end=key(gx,gy,w),q=[first],parent=new Map([[first,-1]]);
  for(let i=0;i<q.length;i++){
    const id=q[i];if(id===end)break;const x=id%w,y=Math.floor(id/w);
    for(const [dx,dy] of dirs8){const nx=x+dx,ny=y+dy,nid=key(nx,ny,w);if(!open(nx,ny)||parent.has(nid))continue;
      if(dx&&dy&&(!open(x+dx,y)||!open(x,y+dy)))continue;
      parent.set(nid,id);q.push(nid);
    }
  }
  if(!parent.has(end))return null;
  const out=[];for(let id=end;id!==-1;id=parent.get(id))out.push([id%w,Math.floor(id/w)]);return out.reverse();
}

function largestComponent(map){
  const {width:w,height:h,collision:c}=map,seen=new Set();let best=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const start=key(x,y,w);if(seen.has(start)||!walkable(c[start]))continue;
    const q=[start],cells=[];seen.add(start);
    for(let i=0;i<q.length;i++){const id=q[i],cx=id%w,cy=Math.floor(id/w);cells.push([cx,cy]);
      for(const [dx,dy] of dirs8.slice(0,4)){const nx=cx+dx,ny=cy+dy,nid=key(nx,ny,w);if(nx<0||ny<0||nx>=w||ny>=h||seen.has(nid)||!walkable(c[nid]))continue;seen.add(nid);q.push(nid);}
    }
    if(cells.length>best.length)best=cells;
  }
  return best;
}

function nearestDistinct(path,index,used){
  for(let d=0;d<path.length;d++)for(const i of [index-d,index+d])if(i>=1&&i<path.length-1){const p=path[i],k=p.join(',');if(!used.has(k)){used.add(k);return p;}}
  return null;
}

export function deriveSlots(map,enemyCount=3){
  const cells=largestComponent(map);if(cells.length<8)throw Error('Room has insufficient connected walkable area');
  const spawn=[...cells].sort((a,b)=>(b[1]-b[0])-(a[1]-a[0])||b[1]-a[1]||a[0]-b[0])[0];
  let exit=null,path=null,best=-1;
  for(const p of cells){const candidate=gridPath(map,spawn,p);if(candidate&&candidate.length>best){best=candidate.length;exit=p;path=candidate;}}
  if(!path||path.length<6)throw Error('Room has no useful traversal path');
  const used=new Set([spawn.join(','),exit.join(',')]),enemySlots=[];
  const fractions=enemyCount<=1?[.52]:enemyCount===2?[.36,.70]:[.28,.53,.76];
  for(const f of fractions){const p=nearestDistinct(path,Math.round((path.length-1)*f),used);if(p)enemySlots.push(p);}
  const potion=nearestDistinct(path,Math.round((path.length-1)*.48),used);
  return {spawn,exit,enemySlots,potion,pathLength:path.length};
}

function fnv1a(text){let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(36).padStart(7,'0');}
export function buildChallenge({roomId,roomTitle,enemyTypes,potion,targetHp,catalog,map,budget=100}){
  if(!catalog?.enemies||!catalog?.items||!catalog?.heroes?.warrior)throw Error('Catalogue unavailable');
  const types=(enemyTypes||[]).filter(Boolean).filter(x=>x!=='none');if(types.length>3)throw Error('Maximum three enemies');
  for(const t of types)if(!catalog.enemies[t])throw Error(`Unknown enemy: ${t}`);
  const slots=deriveSlots(map,Math.max(1,types.length));
  const items=[];let spent=0;
  const enemies=types.map((type,i)=>{spent+=catalog.enemies[type].cost;return{id:`guard-${i+1}`,type,at:slots.enemySlots[i]};});
  if(potion){const spec=catalog.items['small-potion'];if(!spec||!slots.potion)throw Error('Potion unavailable');spent+=spec.cost;items.push({id:'potion-1',type:'small-potion',at:slots.potion});}
  if(spent>budget)throw Error(`Budget exceeded: ${spent}/${budget}`);
  const base={version:1,rules:catalog.rules,id:'',title:roomTitle||'Quick Challenge',room:roomId,hero:'warrior',spawn:slots.spawn,exit:slots.exit,budget,targetHp:Number(targetHp),enemies,items};
  if(!Number.isInteger(base.targetHp)||base.targetHp<1||base.targetHp>100)throw Error('Target HP must be 1..100');
  base.id=`quick-${fnv1a(JSON.stringify({...base,id:undefined}))}`;return {challenge:base,spent,remaining:budget-spent,slots};
}

export function encodeChallenge(value){
  const bytes=new TextEncoder().encode(JSON.stringify(value));
  if(typeof Buffer!=='undefined')return Buffer.from(bytes).toString('base64url');
  let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function decodeChallenge(token){
  if(typeof token!=='string'||token.length<4||token.length>6000)throw Error('Invalid challenge token');
  let bytes;if(typeof Buffer!=='undefined')bytes=Uint8Array.from(Buffer.from(token,'base64url'));else{const pad='='.repeat((4-token.length%4)%4),s=atob(token.replace(/-/g,'+').replace(/_/g,'/')+pad);bytes=Uint8Array.from(s,c=>c.charCodeAt(0));}
  const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid challenge payload');return value;
}
export function builderScore(status,hp,targetHp){if(status!=='cleared'&&status!=='dead')return 0;const actual=status==='dead'?0:Number(hp)||0;return Math.max(0,100-Math.abs(actual-targetHp)*2);}

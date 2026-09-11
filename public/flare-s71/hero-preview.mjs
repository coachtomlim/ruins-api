import {frameIndex} from '../flare-p0/src/core/flare.mjs';

export function heroStanceFrame(animation,elapsed=0,reducedMotion=false,direction=7){
  if(!animation?.entries)throw Error('Composed hero stance animation is unavailable');
  const frame=reducedMotion?0:frameIndex(animation,elapsed);
  return animation.entries[`${frame}:${direction}`]||animation.entries[`0:${direction}`]||animation.entries['0:0'];
}

export function drawComposedHeroStance(canvas,actorPack,elapsed=0,reducedMotion=false){
  const sprite=actorPack?.sprites?.warrior,atlas=actorPack?.atlases?.warrior,animation=sprite?.animations?.stance;
  const frame=heroStanceFrame(animation,elapsed,reducedMotion);if(!frame||!atlas)return false;
  const rect=canvas.getBoundingClientRect(),w=Math.max(180,rect.width||260),h=Math.max(220,rect.height||320),dpr=Math.min(devicePixelRatio||1,2),cw=Math.round(w*dpr),ch=Math.round(h*dpr);
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch}
  const g=canvas.getContext('2d'),dw=frame.dw??frame.w,dh=frame.dh??frame.h,scale=Math.min(w/(dw*1.28),h/(dh*1.08));g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);g.drawImage(atlas,frame.x,frame.y,frame.w,frame.h,w/2-(frame.ox??dw/2)*scale,h*.96-(frame.oy??dh)*scale,dw*scale,dh*scale);return true;
}

export function startComposedHeroStance(canvas,actorPack,{reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches,requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame,now=performance.now()}={}){
  let handle=0,stopped=false;const draw=time=>{if(stopped)return;drawComposedHeroStance(canvas,actorPack,(time-now)/1000,reducedMotion);if(!reducedMotion)handle=requestFrame(draw)};
  if(reducedMotion)draw(now);else handle=requestFrame(draw);
  return()=>{stopped=true;if(handle)cancelFrame(handle)};
}

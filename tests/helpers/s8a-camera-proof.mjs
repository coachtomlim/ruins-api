export function cameraSnapshot(renderer){
  const c=renderer?.camera||null;
  if(!c)return null;
  return Object.freeze({s:Number(c.s),x:Number(c.x),y:Number(c.y)});
}

export function cameraDelta(a,b){
  if(!a||!b)return Object.freeze({scaleDelta:Infinity,translationDelta:Infinity});
  const scaleDelta=Math.abs(Number(a.s)-Number(b.s));
  const dx=Number(a.x)-Number(b.x),dy=Number(a.y)-Number(b.y);
  return Object.freeze({scaleDelta,translationDelta:Math.hypot(dx,dy)});
}

export function cameraMateriallyChanged(a,b,{minScaleDelta=.02,minTranslationDelta=8}={}){
  const d=cameraDelta(a,b);
  return d.scaleDelta>=minScaleDelta||d.translationDelta>=minTranslationDelta;
}

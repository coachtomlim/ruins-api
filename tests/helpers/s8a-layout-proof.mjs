export function rectVisibleInViewport(rect,viewport,{tolerance=1}={}){
  if(!rect||!viewport)return false;
  return rect.left>=-tolerance&&rect.top>=-tolerance&&rect.right<=viewport.width+tolerance&&rect.bottom<=viewport.height+tolerance;
}

export function minTouchTarget(rect,min=44){
  return Boolean(rect)&&rect.width>=min&&rect.height>=min;
}

export function primaryActionProof({rect,viewport,min=44}={}){
  return Object.freeze({visible:rectVisibleInViewport(rect,viewport),touch:minTouchTarget(rect,min)});
}

export function missionAbovePrimary({missionRect,primaryRect}={}){
  if(!missionRect||!primaryRect)return false;
  return missionRect.bottom<=primaryRect.top;
}

export function overflowAmount({scrollHeight,clientHeight}={}){
  const s=Number(scrollHeight)||0,c=Number(clientHeight)||0;
  return Math.max(0,s-c);
}

export function cameraModeChanged(before,after,{minScaleDelta=.05,minPositionDelta=24}={}){
  if(!before||!after)return false;
  const ds=Math.abs((Number(before.s)||0)-(Number(after.s)||0));
  const dx=Math.abs((Number(before.x)||0)-(Number(after.x)||0));
  const dy=Math.abs((Number(before.y)||0)-(Number(after.y)||0));
  return ds>=minScaleDelta||Math.hypot(dx,dy)>=minPositionDelta;
}

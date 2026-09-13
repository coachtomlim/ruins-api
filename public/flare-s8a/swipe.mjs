export function roomSwipeDirection({startX=0,startY=0,endX=0,endY=0,threshold=42,axisRatio=1.15}={}){
  const dx=Number(endX)-Number(startX),dy=Number(endY)-Number(startY),t=Math.max(0,Number(threshold)||0),ratio=Math.max(1,Number(axisRatio)||1);
  if(!Number.isFinite(dx)||!Number.isFinite(dy))return 0;
  if(Math.abs(dx)<=t||Math.abs(dx)<=Math.abs(dy)*ratio)return 0;
  return dx<0?1:-1;
}

const finite=value=>Number.isFinite(Number(value))?Number(value):0;

export function mobilePolicy({width=390,height=844}={}){
  const w=Math.max(0,finite(width)),h=Math.max(0,finite(height));
  const compact=w<380||h<760;
  return Object.freeze({
    width:w,
    height:h,
    compact,
    orientation:h>=w?'portrait':'landscape',
    bodyTextMinPx:16,
    primaryActionMinPx:52,
    preferredPrimaryActionPx:56,
    categoryTabsMinPx:48,
    panelHeight:'100dvh',
    avoidDocumentScroll:true,
    safeArea:true,
    missionTargetPriority:'dominant'
  });
}

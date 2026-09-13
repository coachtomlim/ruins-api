export const PROGRESSION_STATES=Object.freeze({
  HOME:'home',STATS:'stats',EQUIPMENT:'equipment',ARMOR:'armor',CONFIRM:'confirm',SUCCESS:'success'
});

const T=Object.freeze({
  home:Object.freeze({OPEN_STATS:'stats',OPEN_EQUIPMENT:'equipment',OPEN_ARMOR:'armor'}),
  stats:Object.freeze({BACK:'home',SELECT_OFFER:'confirm'}),
  equipment:Object.freeze({BACK:'home',SELECT_OFFER:'confirm'}),
  armor:Object.freeze({BACK:'home',SELECT_OFFER:'confirm'}),
  confirm:Object.freeze({CANCEL:'home',PURCHASE_OK:'success',PURCHASE_STALE:'confirm',PURCHASE_FAILED:'confirm'}),
  success:Object.freeze({DONE:'home',OPEN_STATS:'stats',OPEN_EQUIPMENT:'equipment',OPEN_ARMOR:'armor'})
});

export function transitionProgression(state,event){
  const next=T[state]?.[event];if(!next)throw new Error(`Invalid progression transition: ${state} -> ${event}`);return next;
}
export function canTransitionProgression(state,event){return Boolean(T[state]?.[event]);}
export function progressionTransitions(){return T;}

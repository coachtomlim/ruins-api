export const GEAR_JOURNEY_STATES=Object.freeze({HOME:'home',REVEAL:'reveal',SLOT:'slot',DETAIL:'detail'});

const T=Object.freeze({
  home:Object.freeze({OPEN_SLOT:'slot',SHOW_NEW_GEAR:'reveal'}),
  reveal:Object.freeze({EQUIP:'detail',KEEP:'home'}),
  slot:Object.freeze({OPEN_ITEM:'detail',BACK:'home'}),
  detail:Object.freeze({EQUIPPED:'home',BACK:'slot'})
});

export function transitionGearJourney(state,event){
  const next=T[state]?.[event];if(!next)throw new Error(`Invalid gear journey transition: ${state} -> ${event}`);return next;
}

export function canTransitionGear(state,event){return Boolean(T[state]?.[event]);}

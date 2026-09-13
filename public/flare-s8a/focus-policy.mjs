import {JOURNEY_STATES} from './journey.mjs';

const HEADING=Object.freeze({
  [JOURNEY_STATES.INVITATION]:'heading-invitation',
  [JOURNEY_STATES.MISSION]:'heading-mission',
  [JOURNEY_STATES.READY]:'heading-ready',
  [JOURNEY_STATES.CUSTOMIZE]:'heading-customize',
  [JOURNEY_STATES.RUNTIME]:'heading-runtime',
  [JOURNEY_STATES.REWARDS]:'heading-rewards',
  [JOURNEY_STATES.REGISTRATION]:'heading-registration'
});

export function focusTargetForJourney(state){
  const id=HEADING[state];if(!id)throw new Error(`Unknown focus journey state: ${state}`);return id;
}

export function restoreFocusTarget(event){
  if(event==='BACK_TO_REWARDS')return 'save-goal';
  if(event==='DONE')return 'customize';
  if(event==='EDIT_DUNGEON')return 'edit-dungeon';
  return null;
}

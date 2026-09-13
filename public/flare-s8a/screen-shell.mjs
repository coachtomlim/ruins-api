import {JOURNEY_STATES} from './journey.mjs';

const META=Object.freeze({
  [JOURNEY_STATES.INVITATION]:Object.freeze({title:'Game invitation',step:0,progress:0}),
  [JOURNEY_STATES.MISSION]:Object.freeze({title:'Choose a dungeon',step:1,progress:1}),
  [JOURNEY_STATES.READY]:Object.freeze({title:'Ready to run',step:2,progress:2}),
  [JOURNEY_STATES.CUSTOMIZE]:Object.freeze({title:'Customize dungeon',step:2,progress:2}),
  [JOURNEY_STATES.RUNTIME]:Object.freeze({title:'The run',step:3,progress:3}),
  [JOURNEY_STATES.REWARDS]:Object.freeze({title:'Rewards',step:4,progress:4}),
  [JOURNEY_STATES.REGISTRATION]:Object.freeze({title:'Create account',step:5,progress:5})
});

export function screenShellState(state){
  const meta=META[state];
  if(!meta)throw new Error(`Unknown Dungeon Runner screen state: ${state}`);
  return Object.freeze({state,...meta,panelId:`panel-${state}`,headingId:`heading-${state}`});
}

export function screenStates(){return META;}

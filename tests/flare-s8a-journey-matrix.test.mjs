import test from 'node:test';
import assert from 'node:assert/strict';
import {JOURNEY_STATES,journeyTransitions,canTransition,transitionJourney} from '../public/flare-s8a/journey.mjs';

const expected={
  invitation:{ACCEPT:'mission'},
  mission:{USE_DUNGEON:'ready'},
  ready:{CUSTOMIZE:'customize',RUN:'runtime'},
  customize:{DONE:'ready',RUN:'runtime'},
  runtime:{COMPLETE:'rewards'},
  rewards:{RUN_AGAIN:'runtime',EDIT_DUNGEON:'customize',SAVE_GOAL:'registration'},
  registration:{BACK_TO_REWARDS:'rewards'}
};

test('journey transition table is exactly the governed S8A flow',()=>{
  assert.deepEqual(journeyTransitions(),expected);
});

test('all governed transitions resolve to their exact next panel',()=>{
  for(const [state,events] of Object.entries(expected))for(const [event,next] of Object.entries(events)){
    assert.equal(canTransition(state,event),true,`${state}/${event}`);
    assert.equal(transitionJourney(state,event),next,`${state}/${event}`);
  }
});

test('cross-panel shortcuts remain blocked',()=>{
  const forbidden=[
    [JOURNEY_STATES.INVITATION,'RUN'],[JOURNEY_STATES.INVITATION,'SAVE_GOAL'],
    [JOURNEY_STATES.MISSION,'RUN'],[JOURNEY_STATES.READY,'SAVE_GOAL'],
    [JOURNEY_STATES.RUNTIME,'EDIT_DUNGEON'],[JOURNEY_STATES.REGISTRATION,'RUN']
  ];
  for(const [state,event] of forbidden){assert.equal(canTransition(state,event),false);assert.throws(()=>transitionJourney(state,event));}
});

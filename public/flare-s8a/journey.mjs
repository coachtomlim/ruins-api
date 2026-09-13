export const JOURNEY_STATES = Object.freeze({
  INVITATION: 'invitation',
  MISSION: 'mission',
  READY: 'ready',
  CUSTOMIZE: 'customize',
  RUNTIME: 'runtime',
  REWARDS: 'rewards',
  REGISTRATION: 'registration',
});

const T = Object.freeze({
  invitation: Object.freeze({ ACCEPT: 'mission' }),
  mission: Object.freeze({ USE_DUNGEON: 'ready', CUSTOMIZE: 'customize' }),
  ready: Object.freeze({ CUSTOMIZE: 'customize', RUN: 'runtime' }),
  customize: Object.freeze({ DONE: 'ready', RUN: 'runtime' }),
  runtime: Object.freeze({ COMPLETE: 'rewards' }),
  rewards: Object.freeze({ RUN_AGAIN: 'runtime', EDIT_DUNGEON: 'customize', SAVE_GOAL: 'registration' }),
  registration: Object.freeze({ BACK_TO_REWARDS: 'rewards' }),
});

export function transitionJourney(state, event) {
  const next = T[state]?.[event];
  if (!next) throw new Error(`Invalid Dungeon Runner journey transition: ${state} -> ${event}`);
  return next;
}

export function canTransition(state, event) {
  return Boolean(T[state]?.[event]);
}

export function journeyTransitions() {
  return T;
}

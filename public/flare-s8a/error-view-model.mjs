const COPY=Object.freeze({
  invalidInvite:Object.freeze({title:'THIS CHALLENGE CANNOT OPEN',body:'The invitation is missing or invalid.',primary:null,rewardAllowed:false}),
  assetLoad:Object.freeze({title:'DUNGEON ASSETS COULD NOT LOAD',body:'The game could not load everything needed for this dungeon.',primary:'TRY AGAIN',rewardAllowed:false}),
  roomLoad:Object.freeze({title:'THIS DUNGEON COULD NOT LOAD',body:'Choose another available dungeon or try this one again.',primary:'CHOOSE ANOTHER DUNGEON',rewardAllowed:false}),
  runInit:Object.freeze({title:'THE RUN COULD NOT START',body:'Your dungeon setup is still here. Try the run again.',primary:'TRY RUN AGAIN',rewardAllowed:false}),
  interrupted:Object.freeze({title:'RUN INTERRUPTED',body:'Guest runs are not saved yet. Start the run again to get a result.',primary:'RUN AGAIN',rewardAllowed:false}),
  unknownResult:Object.freeze({title:'RESULT UNAVAILABLE',body:'No valid reward can be awarded from this run.',primary:'BACK TO DUNGEON',rewardAllowed:false})
});

export function buildErrorViewModel(kind='unknownResult'){
  const base=COPY[kind]||COPY.unknownResult;
  return Object.freeze({kind:COPY[kind]?kind:'unknownResult',...base,secondary:'BACK'});
}

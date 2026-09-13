import {createProgressionAccount} from './progression-engine.mjs';
import {starterRunnerState,starterOwnershipRecords} from './starter-grant.mjs';

const clean=value=>String(value??'').trim();

export function createStarterAccountProgression({playerId,runnerId='warrior-l1'}={}){
  const player=clean(playerId),runner=clean(runnerId);if(!player||!runner)throw new Error('playerId and runnerId are required');
  const state=starterRunnerState({runnerId:runner});
  const account=createProgressionAccount({playerId:player,ledgerEntries:[],runners:{[runner]:state}});
  return Object.freeze({
    account,
    starterOwnership:starterOwnershipRecords({playerId:player,runnerId:runner}),
    goldBalance:0
  });
}

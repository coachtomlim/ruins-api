import {JOURNEY_STATES,transitionJourney} from './journey.mjs';
import {rewardSummary} from './rewards.mjs';
import {validateTerminalResult} from './run-result.mjs';

const clone=value=>value==null?value:structuredClone(value);
const freeze=value=>Object.freeze(value);

export function createReceiverSession({invite=null,senderName='Buddy'}={}){
  return freeze({
    journey:JOURNEY_STATES.INVITATION,
    senderName:String(senderName||'Buddy'),
    invite:freeze(clone(invite)||{}),
    roomId:'',
    encounter:freeze({}),
    lastResult:null,
    score:null,
    reward:null,
    persisted:false
  });
}

function patch(session,changes){return freeze({...session,...changes});}
function requireRoom(session){if(!session.roomId)throw new Error('Choose a dungeon first');}

export function selectDungeon(session,roomId){
  const id=String(roomId||'').trim();if(!id)throw new Error('Dungeon room is required');
  return patch(session,{roomId:id});
}

export function setEncounter(session,encounter){return patch(session,{encounter:freeze(clone(encounter)||{})});}

export function advanceReceiver(session,event,payload={}){
  if(!session)throw new Error('Receiver session is required');
  switch(event){
    case 'ACCEPT':return patch(session,{journey:transitionJourney(session.journey,'ACCEPT')});
    case 'USE_DUNGEON':requireRoom(session);return patch(session,{journey:transitionJourney(session.journey,'USE_DUNGEON')});
    case 'CUSTOMIZE':requireRoom(session);return patch(session,{journey:transitionJourney(session.journey,'CUSTOMIZE')});
    case 'DONE':return patch(session,{journey:transitionJourney(session.journey,'DONE')});
    case 'RUN':requireRoom(session);return patch(session,{journey:transitionJourney(session.journey,'RUN'),lastResult:null,score:null,reward:null});
    case 'COMPLETE':{
      const result=clone(payload.result)||{},score=Number(payload.score);
      validateTerminalResult(result);
      if(!Number.isFinite(score))throw new Error('Authoritative terminal score is required');
      const reward=rewardSummary({result,score,senderName:session.senderName});
      return patch(session,{journey:transitionJourney(session.journey,'COMPLETE'),lastResult:freeze(result),score,reward});
    }
    case 'RUN_AGAIN':requireRoom(session);return patch(session,{journey:transitionJourney(session.journey,'RUN_AGAIN'),lastResult:null,score:null,reward:null});
    case 'EDIT_DUNGEON':requireRoom(session);return patch(session,{journey:transitionJourney(session.journey,'EDIT_DUNGEON')});
    case 'SAVE_GOAL':return patch(session,{journey:transitionJourney(session.journey,'SAVE_GOAL')});
    case 'BACK_TO_REWARDS':return patch(session,{journey:transitionJourney(session.journey,'BACK_TO_REWARDS')});
    default:throw new Error(`Unknown receiver event: ${event}`);
  }
}

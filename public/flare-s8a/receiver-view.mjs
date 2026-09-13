import {JOURNEY_STATES} from './journey.mjs';
import {screenShellState} from './screen-shell.mjs';
import {buildInvitationViewModel} from './invitation-view-model.mjs';
import {buildMissionViewModel} from './mission-view-model.mjs';
import {buildReadyViewModel} from './ready-view-model.mjs';
import {buildCustomizeViewModel} from './customize-view-model.mjs';
import {buildRuntimeHudViewModel} from './runtime-hud-view-model.mjs';
import {buildResultViewModel} from './result-view-model.mjs';
import {buildRegistrationHandoff} from './registration-handoff.mjs';
import {buildRegistrationViewModel} from './registration-view-model.mjs';

export function buildReceiverView({session,context={}}={}){
  if(!session)throw new Error('Receiver session is required');
  const shell=screenShellState(session.journey),invite=session.invite||{},sender=session.senderName||'Buddy';
  let model;
  switch(session.journey){
    case JOURNEY_STATES.INVITATION:model=buildInvitationViewModel({sender,runnerName:context.runnerName,runnerLevel:context.runnerLevel,targetHp:invite.targetHp});break;
    case JOURNEY_STATES.MISSION:model=buildMissionViewModel({targetHp:invite.targetHp,sender,roomName:context.roomName,roomIndex:context.roomIndex,roomCount:context.roomCount,estimatedHpPercent:context.estimatedHpPercent});break;
    case JOURNEY_STATES.READY:model=buildReadyViewModel({targetHp:invite.targetHp,roomName:context.roomName,usedBudget:context.usedBudget,totalBudget:context.totalBudget,estimatedHpPercent:context.estimatedHpPercent,monsters:context.monsters,traps:context.traps,supports:context.supports});break;
    case JOURNEY_STATES.CUSTOMIZE:model=buildCustomizeViewModel({activePanel:context.activePanel,usedBudget:context.usedBudget,totalBudget:context.totalBudget,monsters:context.monsters,traps:context.traps,supports:context.supports});break;
    case JOURNEY_STATES.RUNTIME:model=buildRuntimeHudViewModel({hp:context.hp,maxHp:context.maxHp,heroGold:context.heroGold,seconds:context.seconds,cameraMode:context.cameraMode,paused:context.paused});break;
    case JOURNEY_STATES.REWARDS:
      if(!session.lastResult||!Number.isFinite(Number(session.score)))throw new Error('Reward screen requires terminal result');
      model=buildResultViewModel({result:session.lastResult,score:session.score,targetHp:invite.targetHp,senderName:sender});break;
    case JOURNEY_STATES.REGISTRATION:{
      const handoff=context.registrationHandoff||buildRegistrationHandoff({senderName:sender,runnerId:invite.runnerId,runnerName:context.runnerName,runnerLevel:context.runnerLevel,targetHp:invite.targetHp,score:session.score,heroGold:session.reward?.heroGold,builderGold:session.reward?.builderGold,roomId:session.roomId,encounter:session.encounter,result:session.lastResult});
      model=buildRegistrationViewModel(handoff);break;
    }
    default:throw new Error(`Unsupported receiver journey: ${session.journey}`);
  }
  return Object.freeze({kind:session.journey,shell,model});
}

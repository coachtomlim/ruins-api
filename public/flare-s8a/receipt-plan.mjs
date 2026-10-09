import {buildResultReceipt} from './result-receipt.mjs';
import {receiptSupportsEncounter} from './level2-content.mjs';

// Decides, BEFORE any presentation work, what the receipt step will do for a finished run. It never
// throws: an unsupported encounter or an invalid payload becomes an explicit `block` the UI reports
// truthfully, so a payload problem can never abort run completion or interrupt receipt retry.
export function planResultReceipt({publicToken,roomId,encounter,rulesVersion='s8a-1',result,heroGold,attemptToken}={}){
  if(!publicToken)return Object.freeze({payload:null,block:null});
  if(!receiptSupportsEncounter(encounter,{roomId}))return Object.freeze({payload:null,block:'UNSUPPORTED_ENCOUNTER'});
  try{return Object.freeze({payload:buildResultReceipt({publicToken,roomId,encounter,rulesVersion,result,heroGold,attemptToken}),block:null});}
  catch(error){return Object.freeze({payload:null,block:'PAYLOAD_INVALID',error});}
}

export function receiptBlockMessage(block,senderName='your friend'){
  if(block==='UNSUPPORTED_ENCOUNTER')return `Result kept on this device · ${senderName} can't receive this run yet.`;
  if(block==='PAYLOAD_INVALID')return 'Result kept on this device · it could not be prepared for sending.';
  return '';
}

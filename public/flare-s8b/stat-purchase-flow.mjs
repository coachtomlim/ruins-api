import {progressionPurchaseMessage} from './account-ready-view.mjs';

export function createStatPurchaseFlow({purchase,refresh,randomUUID=()=>crypto.randomUUID()}={}){
  if(typeof purchase!=='function'||typeof refresh!=='function')throw new Error('PURCHASE_FLOW_DEPENDENCIES_REQUIRED');
  let intent=null,inFlight=false;
  return Object.freeze({
    get intent(){return intent},
    get inFlight(){return inFlight},
    begin(offer,playerRunnerId){
      if(!offer?.offerId||!playerRunnerId||offer?.action?.disabled)return null;
      intent=Object.freeze({offer,playerRunnerId,idempotencyKey:randomUUID()});
      return intent;
    },
    cancel(){if(!inFlight)intent=null;return intent},
    async confirm(){
      if(!intent||inFlight)return Object.freeze({status:'ignored'});
      inFlight=true;
      try{
        const result=await purchase({playerRunnerId:intent.playerRunnerId,offerId:intent.offer.offerId,idempotencyKey:intent.idempotencyKey});
        await refresh();
        intent=null;
        return Object.freeze({status:'success',result});
      }catch(error){
        const feedback=progressionPurchaseMessage(error);
        try{await refresh()}catch{}
        if(feedback.kind==='known')intent=null;
        return Object.freeze({status:'error',error,feedback});
      }finally{inFlight=false}
    }
  });
}

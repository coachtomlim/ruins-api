function clone(value){return value==null?value:structuredClone(value)}

export function createReplayContext({roomId='',encounter=null,runnerId='',targetHp=0,rulesVersion=''}={}){
  return Object.freeze({
    roomId:String(roomId||''),
    encounter:Object.freeze(clone(encounter)||{}),
    runnerId:String(runnerId||''),
    targetHp:Number(targetHp)||0,
    rulesVersion:String(rulesVersion||'')
  });
}

export function replayInputs(context){
  return createReplayContext(context||{});
}

export function editDungeonInputs(context){
  const c=createReplayContext(context||{});
  return Object.freeze({roomId:c.roomId,encounter:c.encounter});
}

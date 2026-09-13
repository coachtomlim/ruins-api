function sortValue(value){
  if(Array.isArray(value))return value.map(sortValue);
  if(value&&typeof value==='object'){
    const out={};for(const key of Object.keys(value).sort())out[key]=sortValue(value[key]);return out;
  }
  return value;
}

export function canonicalRunInput({runnerId,targetHp,roomId,encounter,rulesVersion}={}){
  return Object.freeze({
    runnerId:String(runnerId||''),
    targetHp:Number(targetHp)||0,
    roomId:String(roomId||''),
    encounter:sortValue(encounter||{}),
    rulesVersion:String(rulesVersion||'')
  });
}

export function canonicalRunInputJson(input){
  return JSON.stringify(sortValue(canonicalRunInput(input)));
}

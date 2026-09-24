const clean=value=>String(value??'').trim();

function governedInt(value,label){
  const n=Number(value);
  if(!Number.isInteger(n)||n<0)throw new Error(`INVALID_PROGRESSION_${label}`);
  return n;
}

export function progressionSummaryView(progression){
  if(!progression||typeof progression!=='object')throw new Error('AUTHORITATIVE_RUNNER_PROGRESSION_REQUIRED');
  const level=governedInt(progression.runner_level,'LEVEL');
  const totalXp=governedInt(progression.total_xp,'TOTAL_XP');
  const levelThreshold=governedInt(progression.level_threshold,'LEVEL_THRESHOLD');
  const nextLevelThreshold=governedInt(progression.next_level_threshold,'NEXT_LEVEL_THRESHOLD');
  const maxLevel=progression.max_level===true;
  const span=Math.max(1,nextLevelThreshold-levelThreshold);
  const intoLevel=Math.max(0,totalXp-levelThreshold);
  const progressPercent=maxLevel?100:Math.max(0,Math.min(100,Math.round((intoLevel/span)*100)));
  return Object.freeze({
    level,totalXp,levelThreshold,nextLevelThreshold,maxLevel,progressPercent,
    levelLabel:maxLevel?`LEVEL ${level} · MAX`:`LEVEL ${level}`,
    xpLabel:maxLevel?`${totalXp} XP`:`${totalXp} / ${nextLevelThreshold} XP`
  });
}

export function equipmentUnlockViews({progression,itemCatalog=[],itemOwnership=[],gear=[]}={}){
  if(!progression||typeof progression!=='object')throw new Error('AUTHORITATIVE_RUNNER_PROGRESSION_REQUIRED');
  const unlocks=Array.isArray(progression.unlocks)?progression.unlocks:[];
  const catalogById=new Map(itemCatalog.map(item=>[item.item_id,item]));
  const ownedByItemId=new Map(itemOwnership.map(row=>[row.item_id,row]));
  const equippedByItemId=new Map(gear.filter(g=>g.equipped).map(g=>[g.itemId,g]));
  return Object.freeze(unlocks.map(unlock=>{
    const itemId=clean(unlock.itemId),item=catalogById.get(itemId);
    if(!item)throw new Error(`AUTHORITATIVE_UNLOCK_ITEM_UNGOVERNED:${itemId||'missing'}`);
    const unlocked=unlock.unlocked===true;
    const ownership=ownedByItemId.get(itemId)||null;
    const owned=!!ownership;
    const equipped=equippedByItemId.has(itemId);
    const modifierParts=[];
    for(const [key,label] of [['hp_modifier','HP'],['attack_modifier','ATK'],['defense_modifier','DEF']]){
      const value=Number(item[key]);
      if(value)modifierParts.push(`+${value} ${label}`);
    }
    let state,label,disabled;
    if(equipped){state='equipped';label='EQUIPPED';disabled=true}
    else if(owned){state='owned';label='EQUIP';disabled=false}
    else if(!unlocked){state='locked';label=`LOCKED · LEVEL ${unlock.minLevel}`;disabled=true}
    else{state='available';label='ACQUIRE';disabled=false}
    const goldCost=governedInt(unlock.goldCost,'GOLD_COST');
    return Object.freeze({
      offerId:clean(unlock.offerId),itemId,name:clean(item.display_name)||itemId,
      slot:clean(item.slot),effectLabel:modifierParts.join(' · ')||'NO STAT BONUS',
      goldCost,priceLabel:`${goldCost} Gold`,
      minLevel:governedInt(unlock.minLevel,'MIN_LEVEL'),unlocked,owned,equipped,
      ownershipId:ownership?.id||null,
      action:Object.freeze({state,label,disabled})
    });
  }));
}

const HISTORY_LABELS={
  daily_trial:'DAILY TRIAL',stat_purchase:'TRAINING',equipment_purchase:'EQUIPMENT',
  equipment_equipped:'EQUIPPED',level_reached:'LEVEL UP'
};

export function historyViewRows(rows=[]){
  if(!Array.isArray(rows))throw new Error('AUTHORITATIVE_PROGRESSION_HISTORY_REQUIRED');
  return Object.freeze(rows.map(row=>{
    const kind=clean(row.kind),createdAt=clean(row.created_at);
    if(!kind||!createdAt)throw new Error('INVALID_PROGRESSION_HISTORY_ROW');
    return Object.freeze({
      kind,badge:HISTORY_LABELS[kind]||kind.toUpperCase(),label:clean(row.label),
      goldDelta:Number(row.gold_delta)||0,xpDelta:Number(row.xp_delta)||0,createdAt
    });
  }));
}

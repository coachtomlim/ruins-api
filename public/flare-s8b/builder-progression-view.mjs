const clean=value=>String(value??'').trim();

function int(value,label){
  const n=Number(value);
  if(!Number.isInteger(n)||n<0)throw new Error(`INVALID_BUILDER_${label}`);
  return n;
}

export const BUILDER_TARGET_OPTIONS=Object.freeze([40,50,60,70,80]);

export function builderProgressionView(row){
  if(!row||typeof row!=='object')throw new Error('AUTHORITATIVE_BUILDER_PROGRESSION_REQUIRED');
  const totalXp=int(row.total_builder_xp,'TOTAL_XP');
  const level=int(row.builder_level,'LEVEL');
  const levelThreshold=int(row.level_threshold,'LEVEL_THRESHOLD');
  const nextLevelThreshold=int(row.next_level_threshold,'NEXT_LEVEL_THRESHOLD');
  const publishedChallenges=int(row.published_challenges,'PUBLISHED');
  const maxLevel=row.max_level===true;
  const span=Math.max(1,nextLevelThreshold-levelThreshold);
  const into=Math.max(0,totalXp-levelThreshold);
  const progressPercent=maxLevel?100:Math.max(0,Math.min(100,Math.round((into/span)*100)));
  return Object.freeze({
    totalXp,level,levelThreshold,nextLevelThreshold,publishedChallenges,maxLevel,progressPercent,
    levelLabel:maxLevel?`BUILDER LEVEL ${level} · MAX`:`BUILDER LEVEL ${level}`,
    xpLabel:maxLevel?`${totalXp} BUILDER XP`:`${totalXp} / ${nextLevelThreshold} BUILDER XP`,
    publishedLabel:`${publishedChallenges} CHALLENGE${publishedChallenges===1?'':'S'} PUBLISHED`
  });
}

export function challengeJournalRows(rows=[]){
  if(!Array.isArray(rows))throw new Error('AUTHORITATIVE_BUILDER_CHALLENGES_REQUIRED');
  return Object.freeze(rows.map(raw=>{
    const challengeId=clean(raw?.challenge_id),runnerId=clean(raw?.runner_id),inviteCode=clean(raw?.invite_code);
    const senderName=clean(raw?.sender_name),createdAt=clean(raw?.created_at),targetHp=Number(raw?.target_hp);
    if(!challengeId||!runnerId||!/^[A-Za-z0-9_-]{4}$/.test(inviteCode)||!senderName||!createdAt)
      throw new Error('INVALID_BUILDER_CHALLENGE_ROW');
    if(!Number.isInteger(targetHp)||targetHp<5||targetHp>95||targetHp%5!==0)
      throw new Error('INVALID_BUILDER_CHALLENGE_TARGET');
    return Object.freeze({
      challengeId,runnerId,inviteCode,senderName,targetHp,createdAt,
      targetLabel:`TARGET ${targetHp}% HP`,
      dateLabel:new Date(createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})
    });
  }));
}

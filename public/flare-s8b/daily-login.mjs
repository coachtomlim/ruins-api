const clean=value=>String(value??'').trim();
const integer=(value,label,min,max)=>{
  const n=Number(value);
  if(!Number.isInteger(n)||n<min||n>max)throw new Error(`INVALID_DAILY_LOGIN_${label}`);
  return n;
};

export function normalizeDailyLoginStatus(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('AUTHORITATIVE_DAILY_LOGIN_STATUS_REQUIRED');
  const rewardDay=clean(raw.reward_day);
  const claimedToday=raw.claimed_today===true;
  const currentStreakDay=integer(raw.current_streak_day,'CURRENT_STREAK',0,7);
  const nextStreakDay=integer(raw.next_streak_day,'NEXT_STREAK',1,7);
  const claimableGold=integer(raw.claimable_gold,'CLAIMABLE_GOLD',0,15);
  const nextResetAt=clean(raw.next_reset_at);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(rewardDay))throw new Error('INVALID_DAILY_LOGIN_REWARD_DAY');
  if(!nextResetAt||Number.isNaN(Date.parse(nextResetAt)))throw new Error('INVALID_DAILY_LOGIN_RESET_AT');
  if(claimedToday&&claimableGold!==0)throw new Error('INVALID_DAILY_LOGIN_CLAIMED_VALUE');
  if(!claimedToday&&![5,15].includes(claimableGold))throw new Error('INVALID_DAILY_LOGIN_CLAIMABLE_VALUE');
  if(!claimedToday&&nextStreakDay===7&&claimableGold!==15)throw new Error('INVALID_DAILY_LOGIN_DAY7_VALUE');
  if(!claimedToday&&nextStreakDay!==7&&claimableGold!==5)throw new Error('INVALID_DAILY_LOGIN_BASE_VALUE');
  return Object.freeze({rewardDay,claimedToday,currentStreakDay,nextStreakDay,claimableGold,nextResetAt});
}

export function dailyLoginView(raw){
  const status=normalizeDailyLoginStatus(raw);
  const streakDay=status.claimedToday?status.currentStreakDay:status.nextStreakDay;
  return Object.freeze({
    ...status,
    headline:status.claimedToday?'DAILY BONUS CLAIMED':'DAILY BONUS',
    actionLabel:status.claimedToday?'CLAIMED TODAY':`CLAIM ${status.claimableGold} GOLD`,
    actionDisabled:status.claimedToday,
    streakLabel:`DAY ${streakDay} OF 7`,
    detail:streakDay===7&&!status.claimedToday?'Streak day: +10 bonus Gold today.':'Day 7 adds +10 bonus Gold.',
    resetLabel:status.claimedToday?'Next bonus after 00:00 UTC.':'Available now.'
  });
}

export function builderGoldForResult(result, score) {
  const status = typeof result === 'string' ? result : result?.status;
  const n = Number(score);
  if (status !== 'cleared' || !Number.isFinite(n) || n < 0 || n > 100) return 0;
  if (n === 100) return 25;
  if (n >= 75) return 20;
  if (n >= 50) return 15;
  if (n >= 25) return 10;
  return 5;
}

export function rewardSummary({ result, score, senderName = 'Buddy' } = {}) {
  const status = result?.status || 'invalid';
  const heroGold = Number.isFinite(Number(result?.gold)) ? Math.max(0, Number(result.gold)) : 0;
  const builderGold = builderGoldForResult(result, score);
  return Object.freeze({
    status,
    senderName: String(senderName || 'Buddy'),
    heroGold,
    builderGold,
    cleared: status === 'cleared',
  });
}

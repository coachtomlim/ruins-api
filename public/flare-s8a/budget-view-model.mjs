const finite=value=>Number.isFinite(Number(value))?Number(value):0;

export function buildBudgetViewModel({used=0,total=100}={}){
  const max=Math.max(0,finite(total));
  const spent=Math.max(0,finite(used));
  const remaining=Math.max(0,max-spent);
  const over=Math.max(0,spent-max);
  return Object.freeze({
    label:'DUNGEON BUDGET',
    used:spent,
    total:max,
    remaining,
    over,
    legal:over===0,
    primary:`DUNGEON BUDGET ${spent} / ${max}`,
    secondary:over?`OVER BUDGET BY ${over}`:`${remaining} BUILD GOLD LEFT`,
    clarification:'Build Gold is the 100-Gold dungeon budget. It is not reward Gold and is not added to your wallet.'
  });
}

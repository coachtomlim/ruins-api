const cleanName=value=>String(value||'Buddy').replace(/[<>]/g,'').trim().slice(0,32)||'Buddy';
const finite=value=>Number.isFinite(Number(value))?Number(value):0;

export function buildInvitationViewModel({sender='Buddy',runnerName='Hero-Runner',runnerLevel=0,targetHp=0}={}){
  const name=cleanName(sender),target=Math.max(0,Math.min(100,finite(targetHp))),level=Math.max(0,finite(runnerLevel));
  return Object.freeze({
    eyebrow:'GAME INVITATION',
    title:'DUNGEON RUNNER',
    challenge:`Your friend ${name} has challenged you to select a dungeon for his Hero-Runner.`,
    timePromise:'This takes only 30 seconds. Just accept the challenge and see his Hero run!',
    runnerLabel:`Level ${level} ${String(runnerName||'Hero-Runner')}`,
    targetLabel:`Target ${target}% HP`,
    heroAnimation:'stance',
    primaryAction:'ACCEPT CHALLENGE'
  });
}

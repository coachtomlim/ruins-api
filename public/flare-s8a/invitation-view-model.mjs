const cleanName=value=>String(value||'Buddy').replace(/[<>]/g,'').trim().slice(0,32)||'Buddy';
const finite=value=>Number.isFinite(Number(value))?Number(value):0;

export function buildInvitationViewModel({sender='Buddy',runnerName='Hero-Runner',runnerLevel=0,targetHp=0}={}){
  const name=cleanName(sender),target=Math.max(0,Math.min(100,finite(targetHp))),level=Math.max(0,finite(runnerLevel));
  return Object.freeze({
    eyebrow:'GAME INVITATION',
    title:`${name.toUpperCase()} HAS CHALLENGED YOU`,
    role:'YOU ARE THE DUNGEON BUILDER',
    challenge:`Choose or tune a dungeon for ${name}'s Runner.`,
    targetExplanation:`Get the Runner to the EXIT with about ${target}% health remaining.`,
    targetScale:Object.freeze({harsh:`Below ${target}% = too harsh`,target:`${target}% TARGET`,gentle:`Above ${target}% = too gentle`}),
    defeatRule:'If the Runner is defeated, Builder reward = 0',
    precisionRule:`Closer to ${target}% = higher score + more Builder Gold.`,
    runnerLabel:`Level ${level} ${String(runnerName||'Hero-Runner')}`,
    targetLabel:`TARGET: ${target}% HP`,
    heroAnimation:'stance',
    primaryAction:'CHOOSE A DUNGEON'
  });
}

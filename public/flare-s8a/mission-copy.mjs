const clampTarget=value=>Math.max(0,Math.min(100,Number(value)||0));
const cleanName=value=>String(value||'Buddy').replace(/[<>]/g,'').trim().slice(0,32)||'Buddy';

export function missionCopy({targetHp,sender='Buddy'}={}){
  const target=clampTarget(targetHp),name=cleanName(sender);
  return Object.freeze({
    title:`GET THE HERO TO THE EXIT AT ~${target}% HP`,
    incentive:'Closer to the target = higher score + more gold.',
    warning:'Do not kill the Hero. The Hero must clear the dungeon.',
    rewardCue:`CLEAR NEAR ${target}% HP · WIN UP TO 25 GOLD`,
    senderLine:`${name} challenged you to tune a dungeon for his Hero-Runner.`
  });
}

export function rewardCopy({sender='Buddy',heroGold=0,builderGold=0,cleared=false}={}){
  const name=cleanName(sender).toUpperCase();
  return Object.freeze({
    heroLabel:`${name}'S HERO EARNED`,
    heroValue:`${Math.max(0,Number(heroGold)||0)} GOLD`,
    builderLabel:'YOU EARNED',
    builderValue:`${Math.max(0,Number(builderGold)||0)} GOLD`,
    builderSublabel:'Dungeon Builder reward',
    outcome:cleared?'HERO CLEARED':'HERO DID NOT CLEAR'
  });
}

export function registrationCopy({targetHp,sender='Buddy'}={}){
  const target=clampTarget(targetHp),name=cleanName(sender);
  return Object.freeze({
    title:'CREATE YOUR DUNGEON RUNNER ACCOUNT',
    body:'Create an account to save this goal, keep your gold and store your game assets.',
    carriedGoal:`Save ${name}'s target: finish near ${target}% HP.`,
    notSaved:'Nothing has been saved yet.'
  });
}

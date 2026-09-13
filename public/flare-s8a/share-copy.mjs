const clean=value=>String(value||'Buddy').replace(/[<>]/g,'').trim().slice(0,32)||'Buddy';

export function challengeShareCopy({sender='Buddy',targetHp=50}={}){
  const name=clean(sender),target=Math.max(0,Math.min(100,Number(targetHp)||0));
  return Object.freeze({
    title:'Dungeon Runner',
    text:`${name} challenged you: choose a dungeon and get his Hero to the exit near ${target}% HP. It takes about 30 seconds.`,
    shortText:`Get ${name}'s Hero to the exit near ${target}% HP.`
  });
}

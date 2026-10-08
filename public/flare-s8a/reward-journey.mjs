import {newContentAtLevel,CATEGORIES,CATEGORY_LABELS} from './builder-level.mjs';

// 002E9 — the post-run reward journey, as pure data. Every number comes from the authoritative result
// view model (buildResultViewModel): target HP, actual finished HP, difference, Builder Gold and
// Friend/Hero Gold are separate values and are never assumed equal. There is deliberately NO
// percentile / ranking line: no authoritative population dataset exists yet.
export const JOURNEY_SCENE_IDS=Object.freeze(['success','performance','reward','friend','achievement','gizmos','momentum']);

const COPY=Object.freeze({
  monsters:'Choose what guards each room.',
  traps:'Add hazards to change the challenge.',
  supports:'Helpful items can unlock at other levels.',
  dungeons:'Choose the arena for your challenge.'
});
const plural=(n,word)=>`${n} ${word}${n===1?'':'S'}`;
const int=value=>Math.round(Number(value)||0);

export function performanceTitle(differenceFromTarget){
  const d=int(differenceFromTarget);
  if(d<=5)return 'PRECISION RUN';
  if(d<=15)return 'SOLID RUN';
  return 'RUN COMPLETE';
}
export function distanceLine(differenceFromTarget){
  const d=int(differenceFromTarget);
  if(d===0)return 'RIGHT ON TARGET';
  return d<=5?`ONLY ${plural(d,'POINT')} FROM TARGET`:`${plural(d,'POINT')} FROM TARGET`;
}

export function buildRewardJourney({result,senderName='Buddy',level=2,nameOf=id=>id}={}){
  if(!result||typeof result!=='object')throw new Error('Reward journey requires a result view model');
  const sender=String(senderName||'Buddy').replace(/[<>]/g,'').trim().slice(0,32)||'Buddy';
  const builderGold=int(result.builderReward?.gold),friendGold=int(result.heroReward?.gold);
  const target=int(result.targetHpPercent),finished=int(result.actualHpPercent),difference=int(result.differenceFromTarget);
  const cleared=Boolean(result.cleared);
  const fresh=newContentAtLevel(level);

  const categories=CATEGORIES.map(key=>{
    const ids=fresh[key]||[];
    const items=ids.map(id=>Object.freeze({id,name:nameOf(id,key),art:key==='dungeons'?'dungeon':id,kind:key==='dungeons'?'dungeon':'flare'}));
    return Object.freeze({key,label:CATEGORY_LABELS[key],copy:COPY[key],detailLabel:`NEW AT LEVEL ${level}`,items:Object.freeze(items),emptyCopy:items.length?'':`No new ${CATEGORY_LABELS[key][0]+CATEGORY_LABELS[key].slice(1).toLowerCase()} unlocked at Level ${level}.`});
  });

  const scenes=[
    Object.freeze({id:'success',title:cleared?'SUCCESS!':'RUN COMPLETE',subtitle:cleared?'YOU CLEARED THE DUNGEON':'THE HERO DID NOT CLEAR THIS TIME',celebrate:cleared,next:'CONTINUE →'}),
    Object.freeze({id:'performance',eyebrow:'HOW DID YOU DO?',title:performanceTitle(difference),rows:Object.freeze([Object.freeze({label:'TARGET',value:`${target}% HP`}),Object.freeze({label:'YOU FINISHED',value:`${finished}% HP`})]),distance:distanceLine(difference),next:'NEXT →'}),
    Object.freeze({id:'reward',eyebrow:'YOUR REWARD',gainedLabel:'YOU GAINED',gold:builderGold,goldLabel:`${builderGold} GOLD`,support:builderGold>0?'Use Gold to strengthen your own Runner.':'Clear the dungeon to earn Builder Gold.',next:'NEXT →'}),
    Object.freeze({id:'friend',eyebrow:friendGold>0?'YOUR FEAT HELPED YOUR FRIEND TOO':'YOUR FRIEND',title:'YOUR FRIEND GAINED',heroLabel:`${sender.toUpperCase()}'S HERO`,gold:friendGold,goldLabel:`${friendGold} GOLD`,support:friendGold>0?"Your run earned Gold for your friend's Runner.":'No Gold for your friend this time.',next:'NEXT →'}),
    Object.freeze({id:'achievement',eyebrow:'ACHIEVEMENT UNLOCKED!',levelLabel:'LEVEL',level,lines:Object.freeze(['YOU','LEVELED','UP!']),support:'NEW DUNGEON BUILDER TOOLS AVAILABLE',sessionNote:`Builder Level ${level} is active for this session.`,next:'SEE WHAT YOU UNLOCKED →'}),
    Object.freeze({id:'gizmos',eyebrow:'NEW BUILDER ASSETS',title:'Your kit just got bigger!',categories:Object.freeze(categories),try:'TRY OUT NEW GIZMOS',next:'CONTINUE JOURNEY →'}),
    Object.freeze({id:'momentum',eyebrow:'KEEP THE MOMENTUM',title:'READY TO BUILD YOUR OWN?',values:Object.freeze(['CONTINUE PROGRESSING','SPEND GOLD ON YOUR OWN RUNNER','BUILD WITH YOUR OWN RUNNER','UNLOCK MORE DUNGEON TOOLS']),truthNote:`Builder Level ${level} is active for this session only. Create an account to keep progressing.`,customize:'CUSTOMIZE THIS DUNGEON',create:'CREATE ACCOUNT',guest:'CONTINUE AS GUEST'})
  ];
  return Object.freeze({level,sender,builderGold,friendGold,scenes:Object.freeze(scenes)});
}

import {newContentAtLevel,CATEGORIES,CATEGORY_LABELS} from './builder-level.mjs';

// 002E9 / 002E9C — the post-run reward journey, as pure data. Every number comes from the authoritative
// result view model (buildResultViewModel): target HP, actual finished HP, difference, Builder Gold and
// Friend/Hero Gold are separate values and are never assumed equal. There is deliberately NO percentile /
// ranking line: no authoritative population dataset exists yet.
//
// 002E9C (Owner-approved V12): after the Level 2 achievement the player sees the four-category New Gizmos
// overview and then REVIEWS THEIR LOOT (monsters, traps, support, the new dungeon) — a browse-only sequence,
// not a build session: no editing, no Save/Reset, no guard placement. The loot review ends on a final page
// and then the keep-progressing scene.
export const JOURNEY_SCENE_IDS=Object.freeze(['success','performance','reward','friend','achievement','gizmos','loot-monsters','loot-traps','loot-support','loot-dungeon','loot-complete','momentum']);
// Progress dots track the seven stages; the five loot-review scenes share the New Gizmos stage.
export const JOURNEY_STAGE_BY_SCENE=Object.freeze({success:0,performance:1,reward:2,friend:3,achievement:4,gizmos:5,'loot-monsters':5,'loot-traps':5,'loot-support':5,'loot-dungeon':5,'loot-complete':5,momentum:6});
export const LOOT_REVIEW_SCENES=Object.freeze(['loot-monsters','loot-traps','loot-support','loot-dungeon']);

const plural=(n,word)=>`${n} ${word}${n===1?'':'S'}`;
const int=value=>Math.round(Number(value)||0);
// Level 2 monster roles are locked content authority.
const MONSTER_ROLE=Object.freeze({zombie:'Bruiser','skeleton-archer':'Ranged Guard'});

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

  const item=(id,key)=>Object.freeze({id,name:nameOf(id,key),asset:key==='dungeons'?'broken-gallery':id,kind:key==='dungeons'?'dungeon':'loot'});
  const categories=CATEGORIES.map(key=>{
    const items=(fresh[key]||[]).map(id=>item(id,key));
    return Object.freeze({key,label:CATEGORY_LABELS[key],count:items.length?`${items.length} new`:'no new item',items:Object.freeze(items),
      emptyCopy:items.length?'':`No new ${CATEGORY_LABELS[key][0]+CATEGORY_LABELS[key].slice(1).toLowerCase()} unlocked at Level ${level}.`,
      scene:`loot-${key==='supports'?'support':key==='dungeons'?'dungeon':key}`});
  });
  const by=Object.fromEntries(categories.map(c=>[c.key,c]));
  const lootItem=(it,copy)=>Object.freeze({...it,copy});

  const scenes=[
    Object.freeze({id:'success',title:cleared?'SUCCESS!':'RUN COMPLETE',subtitle:cleared?'YOU CLEARED THE DUNGEON':'THE HERO DID NOT CLEAR THIS TIME',celebrate:cleared,next:'CONTINUE →'}),
    Object.freeze({id:'performance',eyebrow:'HOW DID YOU DO?',title:performanceTitle(difference),rows:Object.freeze([Object.freeze({label:'TARGET',value:`${target}% HP`}),Object.freeze({label:'YOU FINISHED',value:`${finished}% HP`})]),distance:distanceLine(difference),next:'NEXT →'}),
    Object.freeze({id:'reward',eyebrow:'YOUR REWARD',gainedLabel:'YOU GAINED',gold:builderGold,goldLabel:`${builderGold} GOLD`,support:builderGold>0?'Use Gold to strengthen your own Runner.':'Clear the dungeon to earn Builder Gold.',next:'NEXT →'}),
    Object.freeze({id:'friend',eyebrow:friendGold>0?'YOUR FEAT HELPED YOUR FRIEND TOO':'YOUR FRIEND',title:'YOUR FRIEND GAINED',heroLabel:`${sender.toUpperCase()}'S HERO`,gold:friendGold,goldLabel:`${friendGold} GOLD`,support:friendGold>0?"Your run earned Gold for your friend's Runner.":'No Gold for your friend this time.',next:'NEXT →'}),
    Object.freeze({id:'achievement',eyebrow:'ACHIEVEMENT UNLOCKED!',levelLabel:'LEVEL',level,lines:Object.freeze(['YOU','LEVELED','UP!']),support:'NEW DUNGEON BUILDER TOOLS AVAILABLE',sessionNote:`Builder Level ${level} is active for this session.`,next:'SEE WHAT YOU UNLOCKED →'}),
    // New Gizmos overview: four selectable category cards. The CTA starts the loot review (it never opens the editor).
    Object.freeze({id:'gizmos',eyebrow:'NEW BUILDER ASSETS',title:'Your kit just got bigger!',categories:Object.freeze(categories),try:'Check out your new gizmos',next:'loot-monsters'}),
    Object.freeze({id:'loot-monsters',kind:'monsters',eyebrow:`${by.monsters.items.length} NEW MONSTERS`,title:'Monsters unlocked',items:Object.freeze(by.monsters.items.map(it=>lootItem(it,`${MONSTER_ROLE[it.id]||'Monster'} · Level ${level}`))),back:'‹ BACK TO GIZMOS',next:'NEXT →',nextScene:'loot-traps'}),
    Object.freeze({id:'loot-traps',kind:'traps',eyebrow:`${by.traps.items.length} NEW TRAPS`,title:'Traps unlocked',items:Object.freeze(by.traps.items.map(it=>lootItem(it,`New Level ${level} hazard`))),back:'‹ BACK TO GIZMOS',next:'NEXT →',nextScene:'loot-support'}),
    Object.freeze({id:'loot-support',kind:'supports',eyebrow:'SUPPORT',title:'Support',body:by.supports.emptyCopy,back:'‹ BACK TO GIZMOS',next:'NEXT →',nextScene:'loot-dungeon'}),
    Object.freeze({id:'loot-dungeon',kind:'dungeons',badge:'NEW DUNGEON',title:by.dungeons.items[0]?.name||'New dungeon',item:by.dungeons.items[0]||null,subtitle:`Unlocked at Builder Level ${level}`,back:'‹ BACK TO GIZMOS',next:'NEXT →',nextScene:'loot-complete'}),
    Object.freeze({id:'loot-complete',eyebrow:'LOOT REVIEW COMPLETE',title:'Your new gizmos are ready!',headline:'You may use them to create more challenging dungeons',body:"I am sure your friend can't wait to see what you can come up with next!",next:'CONTINUE JOURNEY →'}),
    Object.freeze({id:'momentum',eyebrow:'KEEP THE MOMENTUM',title:'READY TO BUILD YOUR OWN?',values:Object.freeze(['CONTINUE PROGRESSING','SPEND GOLD ON YOUR OWN RUNNER','BUILD WITH YOUR OWN RUNNER','UNLOCK MORE DUNGEON TOOLS']),truthNote:`Builder Level ${level} is active for this session only. Create an account to keep progressing.`,customize:'CUSTOMIZE THIS DUNGEON',create:'CREATE ACCOUNT',guest:'CONTINUE AS GUEST'})
  ];
  return Object.freeze({level,sender,builderGold,friendGold,scenes:Object.freeze(scenes)});
}

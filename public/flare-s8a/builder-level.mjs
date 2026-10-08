// 002E9 Stage B — BUILDER progression (not Runner progression).
//
// Authority for this work order: the first completed Friend run grants Builder Level 2 for the
// CURRENT browser session only. The level lives in sessionStorage, so a reload of the same tab keeps
// it, while a fresh tab/device/session starts at Level 1 again. Nothing here talks to an account,
// Supabase or any other durable store — see docs/WEB_FLARE_002E9_BUILDER_PROGRESSION_PROPOSAL.md for
// the bounded proposal to make it durable.
//
// The interface (MONSTERS / TRAPS / SUPPORT / DUNGEONS) is the same at every level; only the content
// of each category — and therefore the content of a level-up — changes. A category can have zero new
// unlocks at a level (Level 2 has no new Support).
export const BUILDER_LEVEL_KEY='s8aBuilderLevel';
// 002E7/002E8 stored a boolean under this key. Reading it keeps an in-flight session honest after
// the upgrade; it is never written again.
export const LEGACY_UNLOCK_KEY='s8aCustomizationUnlocked';
export const MAX_BUILDER_LEVEL=2;
export const CATEGORIES=Object.freeze(['monsters','traps','supports','dungeons']);
export const CATEGORY_LABELS=Object.freeze({monsters:'MONSTERS',traps:'TRAPS',supports:'SUPPORT',dungeons:'DUNGEONS'});

// Starter shells available before Level 2. Broken Gallery (iron-labyrinth-07) is reserved for the
// Level 2 unlock; Vaulted Crossing (-15) and Twin Lanes (-18) stay untouched for later progression.
export const STARTER_DUNGEON_IDS=Object.freeze(['iron-labyrinth-01','iron-labyrinth-03','iron-labyrinth-08']);
export const BROKEN_GALLERY_ID='iron-labyrinth-07';

const NEW_AT_LEVEL=Object.freeze({
  1:Object.freeze({monsters:Object.freeze(['goblin','skeleton']),traps:Object.freeze([]),supports:Object.freeze(['small-potion','battle-tonic','iron-tonic']),dungeons:STARTER_DUNGEON_IDS}),
  2:Object.freeze({monsters:Object.freeze(['zombie','skeleton-archer']),traps:Object.freeze(['spike-trap','dart-trap']),supports:Object.freeze([]),dungeons:Object.freeze([BROKEN_GALLERY_ID])})
});

export function clampBuilderLevel(level){const n=Number(level);return Number.isInteger(n)&&n>=2?MAX_BUILDER_LEVEL:1;}

// Cumulative access at a level (everything unlocked at that level or earlier).
export function contentForLevel(level){
  const upTo=clampBuilderLevel(level),out={};
  for(const category of CATEGORIES){
    const ids=[];for(let l=1;l<=upTo;l++)ids.push(...NEW_AT_LEVEL[l][category]);
    out[category]=Object.freeze(ids);
  }
  return Object.freeze(out);
}

// Only what is newly unlocked BY reaching this level (drives the level-up reveal).
export function newContentAtLevel(level){return NEW_AT_LEVEL[clampBuilderLevel(level)];}

export function customizationUnlockedAt(level){return clampBuilderLevel(level)>=2;}

export function readBuilderLevel(storage){
  try{
    if(String(storage?.getItem(BUILDER_LEVEL_KEY))==='2')return 2;
    if(String(storage?.getItem(LEGACY_UNLOCK_KEY))==='1')return 2;
  }catch{}
  return 1;
}

// First completed run: Level 1 -> Level 2 for this session. Returns whether THIS call levelled up so
// the reward journey can show the achievement exactly once.
export function grantFirstRunLevel(storage,currentLevel){
  const current=clampBuilderLevel(currentLevel);
  if(current>=2)return Object.freeze({level:current,leveledUp:false,persistedForSession:true});
  let persisted=true;
  try{storage.setItem(BUILDER_LEVEL_KEY,'2');}catch{persisted=false;}
  return Object.freeze({level:2,leveledUp:true,persistedForSession:persisted});
}

// The editor must keep an input for every id a governed dungeon preset can reference, even before
// those ids are unlocked, because encounter state is read back from those inputs (the editor itself
// stays locked and hidden until Level 2).
export function editorContentIds(level,presetEncounters=[]){
  const access=contentForLevel(level),referenced=field=>presetEncounters.flatMap(e=>e?.[field]||[]).filter(id=>id&&id!=='none');
  const merge=(base,extra)=>Object.freeze([...new Set([...base,...extra])]);
  return Object.freeze({
    monsters:merge(access.monsters,referenced('enemyTypes')),
    traps:merge(access.traps,referenced('trapTypes')),
    supports:merge(access.supports,referenced('supportTypes')),
    dungeons:access.dungeons
  });
}

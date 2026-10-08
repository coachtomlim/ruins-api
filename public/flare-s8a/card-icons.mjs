import {FLARE_ART,flareArtCanvas} from './flare-art.mjs';

// public/flare-s7 is a frozen tree (verified byte-for-byte by tests/flare-s71-onboarding.test.mjs)
// and cannot be edited to export its private `presentation` map, so the exact governed
// {label,color} pairs are reproduced here verbatim from public/flare-s7/renderer.mjs lines 3-6 —
// the SAME values the live dungeon renderer draws, not independently invented ones.
const ENCOUNTER_ITEM_PRESENTATION=Object.freeze({
  'small-potion':{label:'+10 HP',color:'#df8999'},'battle-tonic':{label:'+2 ATK',color:'#efc76e'},'iron-tonic':{label:'+2 DEF',color:'#8fd4c6'},
  'spike-trap':{label:'SPIKES',color:'#efc76e'},'dart-trap':{label:'DARTS',color:'#e79a75'}
});

// Friend Feedback 002D asset inventory (bounded, in-repo only — see commit message for the full
// table): no sprite/image files exist anywhere under public/ for monsters, traps, or support
// items. Monsters are full Flare stock actor ANIMATION packs loaded by id (flare-s2/stock.mjs,
// flare-s3/actors.mjs) — not a static image a card can show. Traps and support items already have
// a governed visual: the exact color+label pair the real runtime renderer draws as an in-dungeon
// marker (flare-s7/renderer.mjs's `presentation` map, now exported and reused here verbatim, not
// re-derived). Equipment slots reuse the Runner Hub's existing per-slot SVG icon set (see
// gear-slot-icon.mjs). Monsters have no equivalent asset, so every monster card uses ONE generic,
// consistently-styled category icon — honestly a fallback, not a per-monster sprite.

export function monsterCardIcon(){
  const wrap=document.createElement('span');
  wrap.className='card-icon card-icon--monster';
  wrap.setAttribute('aria-hidden','true');
  wrap.innerHTML='<svg viewBox="0 0 48 48"><path d="M24 6c-9 0-15 7-15 15 0 6 3 10 6 13l1 8 4-5 4 5 4-5 4 5 1-8c3-3 6-7 6-13 0-8-6-15-15-15z"/><circle cx="18" cy="22" r="2.2"/><circle cx="30" cy="22" r="2.2"/></svg>';
  return wrap;
}

export function emptySlotCardIcon(){
  const wrap=document.createElement('span');
  wrap.className='card-icon card-icon--empty';
  wrap.setAttribute('aria-hidden','true');
  wrap.innerHTML='<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="16" fill="none" stroke-dasharray="4 4"/></svg>';
  return wrap;
}

// Reuses the exact governed {label,color} pair the live dungeon renderer already draws for this
// item type. No invented colors or labels.
export function encounterItemBadge(itemId){
  const entry=ENCOUNTER_ITEM_PRESENTATION[itemId];
  const wrap=document.createElement('span');
  wrap.className='card-icon card-icon--badge';
  wrap.setAttribute('aria-hidden','true');
  wrap.style.setProperty('--badge-color',entry?.color||'#df8999');
  wrap.innerHTML='<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18"/></svg>';
  wrap.title=entry?.label||'';
  return wrap;
}

export function encounterItemEffectLabel(itemId){
  return ENCOUNTER_ITEM_PRESENTATION[itemId]?.label||'';
}

// 002E9: real Flare art (monster stance frames, spike/arrow traps, health potion) for the editor option
// cards. Returns null when no governed Flare art exists for the id so callers keep their badge.
export function flareArtIcon(id){
  if(!FLARE_ART[id])return null;
  const wrap=document.createElement('span');
  wrap.className='card-icon card-icon--art';
  wrap.setAttribute('aria-hidden','true');
  wrap.append(flareArtCanvas(id,{width:88,height:88,className:'card-art'}));
  return wrap;
}

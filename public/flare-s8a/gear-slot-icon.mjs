// The exact 7 governed per-slot icons already shipped in the Runner Hub (public/flare-s8b/
// account-app.mjs's gearSlotIcon), reused here so the Runner Inspector's equipment list draws the
// same icon set rather than a second invented one. account-app.mjs keeps its own copy inline
// (not refactored to import this) to avoid touching a working, already-tested render path.
const ICONS=Object.freeze({
  weapon:'<svg viewBox="0 0 48 48"><path d="M33 5l10 10-20 20-7 2 2-7L38 10zM14 34l-9 9m4-14l10 10"/></svg>',
  shield:'<svg viewBox="0 0 48 48"><path d="M24 5l15 6v11c0 10-6 17-15 21-9-4-15-11-15-21V11z"/></svg>',
  head:'<svg viewBox="0 0 48 48"><path d="M10 27c0-12 6-20 14-20s14 8 14 20v11H10zM15 28h18M24 7v8"/></svg>',
  chest:'<svg viewBox="0 0 48 48"><path d="M15 8l9 5 9-5 8 9-6 7v17H13V24l-6-7z"/></svg>',
  hands:'<svg viewBox="0 0 48 48"><path d="M12 10v17l5 10h9V22l-3-12h-4v12h-3V10zM29 13v20l4 6h7V19l-3-6z"/></svg>',
  legs:'<svg viewBox="0 0 48 48"><path d="M14 7h20l-2 15-3 20h-8l-1-17-1 17h-8l3-20z"/></svg>',
  feet:'<svg viewBox="0 0 48 48"><path d="M12 10h10v19l-4 9H5v-7l7-5zM27 10h9v16l7 5v7H30l-3-9z"/></svg>'
});

export function gearSlotIcon(slot){
  const wrap=document.createElement('span');
  wrap.className='gear-slot-visual';
  wrap.setAttribute('aria-hidden','true');
  wrap.innerHTML=ICONS[slot]||ICONS.chest;
  return wrap;
}

// 002E9C: packaged, locally served thumbnails for the New Gizmos overview and loot review, so the journey
// never depends on a remote spritesheet loading (no blank cards). Each PNG is a transparent crop of the
// governed Flare art at the pinned Flare commit (same frames as flare-art.mjs), except broken-gallery.png,
// the Owner-approved V12 render of the real Flare Broken Gallery room (room7). Referenced through
// new URL(..., import.meta.url) so the release manifest traces and packages every file.
export const LOOT_ASSETS=Object.freeze({
  goblin:new URL('./assets/loot/goblin.png',import.meta.url).href,
  skeleton:new URL('./assets/loot/skeleton.png',import.meta.url).href,
  zombie:new URL('./assets/loot/zombie.png',import.meta.url).href,
  'skeleton-archer':new URL('./assets/loot/skeleton-archer.png',import.meta.url).href,
  'spike-trap':new URL('./assets/loot/spike.png',import.meta.url).href,
  'dart-trap':new URL('./assets/loot/dart.png',import.meta.url).href,
  'broken-gallery':new URL('./assets/loot/broken-gallery.png',import.meta.url).href
});
// Category cards: Monsters/Traps/Dungeons show real art; Support is the muted CSS support icon (V12).
export const CATEGORY_ASSET=Object.freeze({monsters:'zombie',traps:'spike-trap',supports:null,dungeons:'broken-gallery'});

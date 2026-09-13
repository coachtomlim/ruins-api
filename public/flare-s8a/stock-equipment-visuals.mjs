export const FLARE_STOCK_PIN='2ef474f5f5f368628bc526f9e56f936dac743e49';

export const STOCK_EQUIPMENT_VISUALS=Object.freeze({
  'wooden-club':Object.freeze({slot:'weapon',gfx:'club',sourcePath:'mods/fantasycore/items/base/weapons/melee/club.txt'}),
  'wooden-shield':Object.freeze({slot:'shield',gfx:'buckler',sourcePath:'mods/fantasycore/items/base/shields/wood.txt'}),
  'reinforced-club':Object.freeze({slot:'weapon',gfx:'reinforced_club',sourcePath:'mods/fantasycore/items/base/weapons/melee/reinforced_club.txt'}),
  'mace':Object.freeze({slot:'weapon',gfx:'mace',sourcePath:'mods/fantasycore/items/base/weapons/melee/mace.txt'}),
  'longsword':Object.freeze({slot:'weapon',gfx:'longsword',sourcePath:'mods/fantasycore/items/base/weapons/melee/longsword.txt'}),
  'battle-axe':Object.freeze({slot:'weapon',gfx:'battle_axe',sourcePath:'mods/fantasycore/items/base/weapons/melee/battle_axe.txt'}),
  'leather-hood':Object.freeze({slot:'head',gfx:'leather_hood',sourcePath:'mods/fantasycore/items/base/armor/leather/head.txt'}),
  'leather-chest':Object.freeze({slot:'chest',gfx:'leather_chest',sourcePath:'mods/fantasycore/items/base/armor/leather/chest.txt'}),
  'leather-gloves':Object.freeze({slot:'hands',gfx:'leather_gloves',sourcePath:'mods/fantasycore/items/base/armor/leather/hands.txt'}),
  'leather-pants':Object.freeze({slot:'legs',gfx:'leather_pants',sourcePath:'mods/fantasycore/items/base/armor/leather/legs.txt'}),
  'leather-boots':Object.freeze({slot:'feet',gfx:'leather_boots',sourcePath:'mods/fantasycore/items/base/armor/leather/feet.txt'})
});

export function stockEquipmentVisual(itemId){
  const item=STOCK_EQUIPMENT_VISUALS[String(itemId||'').trim()];if(!item)throw new Error(`Unknown stock equipment visual: ${itemId}`);return item;
}

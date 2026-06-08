export const VISUAL_ASSETS = {
  maps: {
    grasslands: "./public/assets/recovered/maps/grasslands.png",
    deadForest: "./public/assets/recovered/maps/deadforesttile.png",
    castleBrown: "./public/assets/recovered/maps/mapcastlebrown.png",
    castleWhite: "./public/assets/recovered/maps/mapcastlewhite.png",
  },
  party: "./public/assets/recovered/characters/party-characters-v2.png",
  battleBackground: "./public/assets/recovered/battle/battle-field-background.png",
  forgon: "./public/assets/recovered/enemies/forgon-idle.gif",
  forgonSheet: "./public/assets/recovered/enemies/forgon.png",
};

export const LEVEL1_VISUAL_LAYOUT = {
  "area-001": {
    background: VISUAL_ASSETS.maps.grasslands,
    label: "Camelot Road",
    player: { x: 18, y: 62 },
    actors: [
      { id: "party", label: "Mystery's party", type: "party", x: 18, y: 62 },
      { id: "warning", label: "Warning", type: "hotspot", x: 58, y: 42 },
    ],
  },
  "area-002": {
    background: VISUAL_ASSETS.maps.grasslands,
    label: "Road Cache",
    player: { x: 30, y: 58 },
    actors: [
      { id: "party", label: "Mystery's party", type: "party", x: 30, y: 58 },
      { id: "cache", label: "Road cache", type: "item", x: 66, y: 48 },
    ],
  },
  "area-003": {
    background: VISUAL_ASSETS.maps.deadForest,
    label: "Among the Ashes",
    player: { x: 32, y: 60 },
    actors: [
      { id: "party", label: "Mystery's party", type: "party", x: 32, y: 60 },
      { id: "armor", label: "Lithic Armor", type: "item", x: 62, y: 56 },
      { id: "survivor", label: "Castle Survivor", type: "npc", x: 74, y: 40 },
    ],
  },
  "area-004": {
    background: VISUAL_ASSETS.maps.castleBrown,
    label: "Castle Approach",
    player: { x: 36, y: 62 },
    actors: [
      { id: "party", label: "Mystery's party", type: "party", x: 36, y: 62 },
      { id: "scout-shadow", label: "Movement near the road", type: "enemy", x: 74, y: 40 },
      { id: "cover", label: "Broken cover", type: "hotspot", x: 54, y: 48 },
    ],
  },
  "area-005": {
    background: VISUAL_ASSETS.maps.castleWhite,
    label: "Storm the Castle",
    player: { x: 30, y: 62 },
    actors: [
      { id: "party", label: "Mystery's party", type: "party", x: 30, y: 62 },
      { id: "forgon-presence", label: "Forgon Scout", type: "enemy", x: 72, y: 40 },
    ],
  },
};

export function visualLayoutForArea(areaId) {
  return LEVEL1_VISUAL_LAYOUT[areaId] || LEVEL1_VISUAL_LAYOUT["area-001"];
}

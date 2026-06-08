export const FIRST_LEVEL = {
  id: "level-001",
  title: "The Start of Legends",
  subtitle: "A five-minute reconstruction slice from recovered episode records 1-5.",
  route: ["area-001", "area-002", "area-003", "area-004", "area-005"],
  dialogueIds: [
    "dialogue-text-006",
    "dialogue-text-057",
    "dialogue-text-063",
    "dialogue-text-064",
    "dialogue-text-065",
    "dialogue-text-066",
  ],
  pickupId: "amethystr",
  armorId: "armor-t1-5",
  potionId: "hp-item-1",
  skillIds: [
    "skill-cra-air-2-name",
    "skill-cra-air-2-description-level-1",
    "skill-panda-fire-2-name",
  ],
  objectives: [
    { id: "hear-warning", label: "Hear Mystery's warning", areaId: "area-001" },
    { id: "recover-amethyst", label: "Search the road and recover the Amethyst", areaId: "area-002" },
    { id: "recover-armor", label: "Recover and equip Lithic Armor", areaId: "area-003" },
    { id: "reach-castle-road", label: "Push toward Castle Camelot", areaId: "area-004" },
    { id: "defeat-raider", label: "Defeat the raider before the castle", areaId: "area-005" },
  ],
  battle: {
    enemy: {
      id: "forgon-scout",
      recoveredId: "forgon",
      name: "Forgon Scout",
      hp: 68,
      attack: 8,
      defense: 1,
    },
    intents: [
      { id: "probe", label: "The scout tests Mystery's guard.", type: "attack", power: 7 },
      { id: "heavy", label: "The scout winds up a heavy cut.", type: "attack", power: 11 },
      { id: "brace", label: "The scout braces behind a cracked shield.", type: "guard", guard: 5 },
    ],
    rewards: {
      gold: 25,
      xp: 35,
      items: ["hp-item-1"],
    },
  },
};

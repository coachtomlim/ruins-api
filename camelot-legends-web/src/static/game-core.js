export const SAVE_VERSION = 2;

export const DEMO_ROUTE = ["area-001", "area-002", "area-003", "area-004", "area-005"];

export const DEMO_DIALOGUE_IDS = [
  "dialogue-text-006",
  "dialogue-text-057",
  "dialogue-text-063",
  "dialogue-text-064",
  "dialogue-text-065",
  "dialogue-text-066",
];

export const DEMO_PICKUP_ID = "amethystr";
export const DEMO_EQUIPMENT_ID = "armor-t1-5";
export const DEMO_SKILL_IDS = [
  "skill-cra-air-2-name",
  "skill-cra-air-2-description-level-1",
  "skill-panda-fire-2-name",
];

export const DEMO_OBJECTIVES = [
  { id: "hear-warning", label: "Hear Mystery's warning", areaId: "area-001" },
  { id: "recover-amethyst", label: "Search the road and recover the Amethyst", areaId: "area-002" },
  { id: "recover-armor", label: "Recover and equip Lithic Armor", areaId: "area-003" },
  { id: "reach-castle-road", label: "Push toward Castle Camelot", areaId: "area-004" },
  { id: "defeat-raider", label: "Defeat the raider before the castle", areaId: "area-005" },
];

export function createNewGame(now = new Date().toISOString()) {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    mode: "scene",
    currentAreaId: DEMO_ROUTE[0],
    routeIndex: 0,
    player: {
      name: "Mystery",
      hp: 32,
      maxHp: 32,
      attack: 7,
      defense: 2,
      gold: 0,
      xp: 0,
    },
    enemy: null,
    inventory: [],
    equipment: {
      armor: null,
    },
    flags: {
      introDialogue: false,
      foundItem: false,
      battleWon: false,
      demoComplete: false,
      reachedCastleRoad: false,
    },
    log: ["A new legend begins."],
  };
}

export function normalizeState(state) {
  if (!state) return state;
  const fresh = createNewGame(state.createdAt);
  return {
    ...fresh,
    ...state,
    version: SAVE_VERSION,
    routeIndex: currentRouteIndex(state),
    player: {
      ...fresh.player,
      ...state.player,
    },
    equipment: {
      ...fresh.equipment,
      ...state.equipment,
    },
    flags: {
      ...fresh.flags,
      ...state.flags,
    },
    log: Array.isArray(state.log) ? state.log : ["Save migrated."],
  };
}

export function currentRouteIndex(state) {
  return Math.max(0, DEMO_ROUTE.indexOf(state.currentAreaId));
}

export function canGoNext(state) {
  return currentRouteIndex(state) < DEMO_ROUTE.length - 1;
}

export function canGoBack(state) {
  return currentRouteIndex(state) > 0;
}

export function goNext(state) {
  if (!canGoNext(state)) return state;
  const nextIndex = currentRouteIndex(state) + 1;
  const nextAreaId = DEMO_ROUTE[nextIndex];
  return {
    ...state,
    currentAreaId: nextAreaId,
    routeIndex: nextIndex,
    mode: "scene",
    flags: {
      ...state.flags,
      reachedCastleRoad: nextAreaId === "area-004" ? true : state.flags.reachedCastleRoad,
    },
    log: [`Moved to ${nextAreaId}.`, ...state.log].slice(0, 8),
  };
}

export function goBack(state) {
  if (!canGoBack(state)) return state;
  const nextIndex = currentRouteIndex(state) - 1;
  return {
    ...state,
    currentAreaId: DEMO_ROUTE[nextIndex],
    routeIndex: nextIndex,
    mode: "scene",
    log: [`Returned to ${DEMO_ROUTE[nextIndex]}.`, ...state.log].slice(0, 8),
  };
}

export function addInventoryItem(state, itemId) {
  if (state.inventory.includes(itemId)) return state;
  return {
    ...state,
    inventory: [...state.inventory, itemId],
    flags: {
      ...state.flags,
      foundItem: itemId === DEMO_PICKUP_ID ? true : state.flags.foundItem,
    },
    log: [`Recovered item: ${itemId}.`, ...state.log].slice(0, 8),
  };
}

export function removeInventoryItem(state, itemId) {
  return {
    ...state,
    inventory: state.inventory.filter((id) => id !== itemId),
    log: [`Removed item: ${itemId}.`, ...state.log].slice(0, 8),
  };
}

export function equipArmor(state, equipmentId) {
  return {
    ...state,
    equipment: {
      ...state.equipment,
      armor: equipmentId,
    },
    player: {
      ...state.player,
      defense: 4,
    },
    log: [`Equipped ${equipmentId}.`, ...state.log].slice(0, 8),
  };
}

export function startBattle(state) {
  if (state.flags.battleWon) return state;
  return {
    ...state,
    mode: "battle",
    enemy: {
      id: "bandit-scout",
      name: "Roadside Raider",
      hp: 34,
      maxHp: 34,
      attack: 6,
    },
    log: ["A roadside raider blocks the path.", ...state.log].slice(0, 8),
  };
}

export function playerAttack(state, skillId = "basic-attack") {
  if (!state.enemy || state.mode !== "battle") return state;
  const skillBonus = skillId.includes("air-2") ? 5 : skillId.includes("panda") ? 3 : 0;
  const damage = Math.max(1, state.player.attack + skillBonus);
  const enemyHp = Math.max(0, state.enemy.hp - damage);
  const playerMessage =
    skillId === "basic-attack"
      ? `Mystery strikes for ${damage}.`
      : `Mystery uses ${skillId} for ${damage}.`;

  if (enemyHp <= 0) {
    return {
      ...state,
      mode: "scene",
      enemy: null,
      player: {
        ...state.player,
        gold: state.player.gold + 15,
        xp: state.player.xp + 20,
      },
      inventory: state.inventory.includes("potion")
        ? state.inventory
        : [...state.inventory, "potion"],
      flags: {
        ...state.flags,
        battleWon: true,
        demoComplete: state.currentAreaId === DEMO_ROUTE[DEMO_ROUTE.length - 1],
      },
      log: [`${playerMessage} Victory is secured. Reward: 15 gold, 20 XP, Potion.`, ...state.log].slice(0, 8),
    };
  }

  const retaliation = Math.max(1, state.enemy.attack - state.player.defense);
  const playerHp = Math.max(0, state.player.hp - retaliation);
  const defeated = playerHp <= 0;
  return {
    ...state,
    mode: defeated ? "defeat" : "battle",
    enemy: {
      ...state.enemy,
      hp: enemyHp,
    },
    player: {
      ...state.player,
      hp: playerHp,
    },
    log: [
      `${playerMessage} ${state.enemy.name} answers for ${retaliation}.`,
      ...state.log,
    ].slice(0, 8),
  };
}

export function restAtCamp(state) {
  return {
    ...state,
    player: {
      ...state.player,
      hp: state.player.maxHp,
    },
    log: ["The party catches its breath and recovers.", ...state.log].slice(0, 8),
  };
}

export function markDialogueSeen(state) {
  return {
    ...state,
    flags: {
      ...state.flags,
      introDialogue: true,
    },
    log: ["Mystery's warning has been heard.", ...state.log].slice(0, 8),
  };
}

export function objectiveStatus(state) {
  return DEMO_OBJECTIVES.map((objective) => {
    let complete = false;
    if (objective.id === "hear-warning") complete = state.flags.introDialogue;
    if (objective.id === "recover-amethyst") complete = state.flags.foundItem;
    if (objective.id === "recover-armor") complete = state.equipment.armor === DEMO_EQUIPMENT_ID;
    if (objective.id === "reach-castle-road") complete = state.flags.reachedCastleRoad;
    if (objective.id === "defeat-raider") complete = state.flags.battleWon;
    return {
      ...objective,
      complete,
      active: state.currentAreaId === objective.areaId && !complete,
    };
  });
}

export function serializableState(state) {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
  };
}

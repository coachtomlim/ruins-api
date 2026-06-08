export const SAVE_VERSION = 1;

export const DEMO_ROUTE = ["area-001", "area-002", "area-003"];

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
    },
    log: ["A new legend begins."],
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
  return {
    ...state,
    currentAreaId: DEMO_ROUTE[nextIndex],
    routeIndex: nextIndex,
    mode: "scene",
    log: [`Moved to ${DEMO_ROUTE[nextIndex]}.`, ...state.log].slice(0, 8),
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
      hp: 24,
      maxHp: 24,
      attack: 5,
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
      flags: {
        ...state.flags,
        battleWon: true,
        demoComplete: state.currentAreaId === DEMO_ROUTE[2],
      },
      log: [`${playerMessage} Victory is secured.`, ...state.log].slice(0, 8),
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

export function serializableState(state) {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
  };
}

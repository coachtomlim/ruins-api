import { FIRST_LEVEL } from "./level-data.js";

export const SAVE_VERSION = 3;

export const DEMO_ROUTE = FIRST_LEVEL.route;
export const DEMO_DIALOGUE_IDS = FIRST_LEVEL.dialogueIds;
export const DEMO_PICKUP_ID = FIRST_LEVEL.pickupId;
export const DEMO_EQUIPMENT_ID = FIRST_LEVEL.armorId;
export const DEMO_POTION_ID = FIRST_LEVEL.potionId;
export const DEMO_SKILL_IDS = FIRST_LEVEL.skillIds;
export const DEMO_OBJECTIVES = FIRST_LEVEL.objectives;
export const LEVEL_INTERACTIONS = FIRST_LEVEL.interactions;

export const BATTLE_ACTIONS = [
  {
    id: "strike",
    label: "Strike",
    description: "Reliable weapon attack. Restores 2 MP.",
    mpCost: 0,
  },
  {
    id: "lightning-shot",
    label: "Lightning Shot",
    description: "High damage recovered air skill. Costs 5 MP.",
    mpCost: 5,
  },
  {
    id: "battle-cry",
    label: "Battle Cry",
    description: "Light damage and guard for the next enemy turn. Costs 3 MP.",
    mpCost: 3,
  },
  {
    id: "guard",
    label: "Guard",
    description: "Brace for impact and recover 4 MP.",
    mpCost: 0,
  },
  {
    id: "potion",
    label: "Potion",
    description: "Use a recovered Potion to heal 40 HP.",
    mpCost: 0,
  },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function addLog(state, lines) {
  const nextLines = Array.isArray(lines) ? lines : [lines];
  return [...nextLines, ...(state.log || [])].slice(0, 10);
}

function addUniqueItems(inventory, itemIds) {
  const next = [...inventory];
  for (const itemId of itemIds) {
    if (!next.includes(itemId)) next.push(itemId);
  }
  return next;
}

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
      hp: 42,
      maxHp: 42,
      mp: 14,
      maxMp: 14,
      attack: 8,
      defense: 2,
      guard: 0,
      gold: 0,
      xp: 0,
    },
    enemy: null,
    activeInteractionId: null,
    lastInteractionResult: null,
    battlePlan: {
      guardBonus: 0,
      enemyIntentIndex: 0,
      note: "",
    },
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
      survivorEncounterResolved: false,
      ralliedSurvivors: false,
      foundSurvivorSupplies: false,
      movedOnCautiously: false,
      scoutedApproach: false,
      approachedOpenly: false,
      tookCover: false,
      preparedEquipment: false,
      usedSurvivorInfo: false,
      victoryClaimed: false,
    },
    log: ["A new legend begins."],
  };
}

export function normalizeState(state) {
  if (!state) return state;
  const fresh = createNewGame(state.createdAt);
  const routeIndex = currentRouteIndex(state);
  return {
    ...fresh,
    ...state,
    version: SAVE_VERSION,
    currentAreaId: DEMO_ROUTE[routeIndex] || DEMO_ROUTE[0],
    routeIndex,
    player: {
      ...fresh.player,
      ...state.player,
      hp: clamp(state.player?.hp ?? fresh.player.hp, 0, state.player?.maxHp ?? fresh.player.maxHp),
      mp: clamp(state.player?.mp ?? fresh.player.mp, 0, state.player?.maxMp ?? fresh.player.maxMp),
      guard: state.player?.guard ?? 0,
    },
    equipment: {
      ...fresh.equipment,
      ...state.equipment,
    },
    battlePlan: {
      ...fresh.battlePlan,
      ...state.battlePlan,
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
    log: addLog(state, `Moved to ${nextAreaId}.`),
  };
}

export function availableLevelInteractions(state) {
  return LEVEL_INTERACTIONS.filter(
    (interaction) =>
      interaction.areaId === state.currentAreaId && !state.flags[interaction.resolvedFlag],
  );
}

export function levelInteractionById(interactionId) {
  return LEVEL_INTERACTIONS.find((entry) => entry.id === interactionId) || null;
}

export function openLevelInteraction(state, interactionId) {
  const interaction = LEVEL_INTERACTIONS.find((entry) => entry.id === interactionId);
  if (!interaction || interaction.areaId !== state.currentAreaId || state.flags[interaction.resolvedFlag]) {
    return state;
  }
  return {
    ...state,
    mode: "interaction",
    activeInteractionId: interaction.id,
    lastInteractionResult: null,
    log: addLog(state, `${interaction.label} begins.`),
  };
}

export function choiceIsAvailable(state, choice) {
  if (!choice.requiresAnyFlag) return true;
  return choice.requiresAnyFlag.some((flag) => state.flags[flag]);
}

export function completeLevelInteraction(state, interactionId, choiceId) {
  const interaction = LEVEL_INTERACTIONS.find((entry) => entry.id === interactionId);
  const choice = interaction?.choices?.find((entry) => entry.id === choiceId);
  if (
    !interaction ||
    !choice ||
    interaction.areaId !== state.currentAreaId ||
    state.flags[interaction.resolvedFlag] ||
    !choiceIsAvailable(state, choice)
  ) {
    return state;
  }
  const rewards = choice.rewards || {};
  const nextMaxHp = state.player.maxHp + (rewards.maxHp || 0);
  const nextMaxMp = state.player.maxMp + (rewards.maxMp || 0);
  const nextBattlePlan = {
    ...state.battlePlan,
    ...(choice.battlePlan || {}),
    note: choice.result || "",
  };
  return {
    ...state,
    mode: "scene",
    activeInteractionId: null,
    lastInteractionResult: {
      interactionId: interaction.id,
      choiceId: choice.id,
      label: choice.label,
      result: choice.result,
      rewardText: choice.rewardText,
    },
    battlePlan: nextBattlePlan,
    player: {
      ...state.player,
      maxHp: nextMaxHp,
      hp: clamp(state.player.hp + (rewards.hp || 0), 0, nextMaxHp),
      maxMp: nextMaxMp,
      mp: clamp(state.player.mp + (rewards.mp || 0), 0, nextMaxMp),
      guard: Math.max(state.player.guard || 0, rewards.guard || 0),
      gold: state.player.gold + (rewards.gold || 0),
      xp: state.player.xp + (rewards.xp || 0),
    },
    inventory: rewards.items ? addUniqueItems(state.inventory, rewards.items) : state.inventory,
    flags: {
      ...state.flags,
      ...choice.flags,
    },
    log: addLog(state, [`${choice.label}: ${choice.result}`, `Reward: ${choice.rewardText}.`]),
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
    log: addLog(state, `Returned to ${DEMO_ROUTE[nextIndex]}.`),
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
    log: addLog(state, `Recovered item: ${itemId}.`),
  };
}

export function searchRoadCache(state) {
  const inventory = addUniqueItems(state.inventory, [DEMO_PICKUP_ID, DEMO_POTION_ID]);
  return {
    ...state,
    inventory,
    flags: {
      ...state.flags,
      foundItem: true,
    },
    log: addLog(state, "Recovered the Amethyst and a Potion from the road cache."),
  };
}

export function recoverArmor(state) {
  return {
    ...state,
    inventory: addUniqueItems(state.inventory, [DEMO_EQUIPMENT_ID]),
    log: addLog(state, "Recovered Lithic Armor from the ashes."),
  };
}

export function removeInventoryItem(state, itemId) {
  if (itemId === state.equipment.armor) return state;
  return {
    ...state,
    inventory: state.inventory.filter((id) => id !== itemId),
    log: addLog(state, `Removed item: ${itemId}.`),
  };
}

export function equipArmor(state, equipmentId) {
  const wasEquipped = state.equipment.armor === equipmentId;
  const maxHp = wasEquipped ? state.player.maxHp : state.player.maxHp + 4;
  const maxMp = wasEquipped ? state.player.maxMp : state.player.maxMp + 6;
  return {
    ...state,
    equipment: {
      ...state.equipment,
      armor: equipmentId,
    },
    player: {
      ...state.player,
      maxHp,
      hp: clamp(state.player.hp + (wasEquipped ? 0 : 4), 0, maxHp),
      maxMp,
      mp: clamp(state.player.mp + (wasEquipped ? 0 : 6), 0, maxMp),
      defense: 4,
    },
    log: addLog(state, `Equipped ${equipmentId}.`),
  };
}

function createBattleEnemy(state) {
  const enemy = FIRST_LEVEL.battle.enemy;
  return {
    id: enemy.id,
    recoveredId: enemy.recoveredId,
    name: enemy.name,
    hp: enemy.hp,
    maxHp: enemy.hp,
    attack: enemy.attack,
    defense: enemy.defense,
    guard: 0,
    intentIndex: state.battlePlan?.enemyIntentIndex || 0,
    turn: 1,
  };
}

export function currentEnemyIntent(enemy) {
  if (!enemy) return null;
  return FIRST_LEVEL.battle.intents[enemy.intentIndex % FIRST_LEVEL.battle.intents.length];
}

export function startBattle(state) {
  if (state.flags.battleWon) return state;
  const startingGuard = state.flags.scoutedApproach
    ? Math.max(state.player.guard || 0, state.battlePlan?.guardBonus || 0)
    : 0;
  return {
    ...state,
    mode: "battle",
    enemy: createBattleEnemy(state),
    activeInteractionId: null,
    player: {
      ...state.player,
      guard: startingGuard,
    },
    log: addLog(
      state,
      startingGuard > 0
        ? `A Forgon scout blocks the castle road. ${state.battlePlan?.note || "Mystery is ready for the ambush."}`
        : "A Forgon scout blocks the castle road.",
    ),
  };
}

export function retryBattle(state) {
  return {
    ...state,
    mode: "battle",
    enemy: createBattleEnemy(state),
    activeInteractionId: null,
    player: {
      ...state.player,
      hp: state.player.maxHp,
      mp: state.player.maxMp,
      guard: 0,
    },
    log: addLog(state, "Mystery regroups and faces the scout again."),
  };
}

function actionDamage(state, actionId) {
  const amethystBonus = state.inventory.includes(DEMO_PICKUP_ID) ? 3 : 0;
  if (actionId === "strike") return state.player.attack + 2;
  if (actionId === "lightning-shot") return state.player.attack + 10 + amethystBonus;
  if (actionId === "battle-cry") return state.player.attack + 4;
  return 0;
}

function enemyTurn(state, enemyAfterPlayer) {
  const intent = currentEnemyIntent(enemyAfterPlayer);
  if (!intent) return state;

  if (intent.type === "guard") {
    return {
      ...state,
      enemy: {
        ...enemyAfterPlayer,
        guard: intent.guard,
        intentIndex: enemyAfterPlayer.intentIndex + 1,
        turn: enemyAfterPlayer.turn + 1,
      },
      log: addLog(state, `${enemyAfterPlayer.name} braces behind its shield.`),
    };
  }

  const rawDamage = Math.max(1, intent.power + enemyAfterPlayer.attack - state.player.defense);
  const reducedDamage = Math.max(1, rawDamage - (state.player.guard || 0));
  const playerHp = clamp(state.player.hp - reducedDamage, 0, state.player.maxHp);
  const defeated = playerHp <= 0;
  return {
    ...state,
    mode: defeated ? "defeat" : "battle",
    enemy: {
      ...enemyAfterPlayer,
      intentIndex: enemyAfterPlayer.intentIndex + 1,
      turn: enemyAfterPlayer.turn + 1,
    },
    player: {
      ...state.player,
      hp: playerHp,
      guard: 0,
    },
    log: addLog(
      state,
      defeated
        ? `${enemyAfterPlayer.name} lands a decisive blow for ${reducedDamage}.`
        : `${enemyAfterPlayer.name} hits for ${reducedDamage}.`,
    ),
  };
}

function applyVictory(state, enemyName, playerMessage) {
  const rewards = FIRST_LEVEL.battle.rewards;
  return {
    ...state,
    mode: "victory",
    enemy: null,
    player: {
      ...state.player,
      guard: 0,
      gold: state.player.gold + rewards.gold,
      xp: state.player.xp + rewards.xp,
    },
    inventory: addUniqueItems(state.inventory, rewards.items),
    flags: {
      ...state.flags,
      battleWon: true,
      demoComplete: state.currentAreaId === DEMO_ROUTE[DEMO_ROUTE.length - 1],
      victoryClaimed: true,
    },
    log: addLog(
      state,
      `${playerMessage} ${enemyName} falls. Reward: ${rewards.gold} gold, ${rewards.xp} XP, Potion.`,
    ),
  };
}

export function performBattleAction(state, actionId = "strike") {
  if (!state.enemy || state.mode !== "battle") return state;
  const action = BATTLE_ACTIONS.find((entry) => entry.id === actionId) || BATTLE_ACTIONS[0];
  if (state.player.mp < action.mpCost) {
    return {
      ...state,
      log: addLog(state, `${action.label} needs ${action.mpCost} MP.`),
    };
  }

  if (actionId === "potion") {
    if (!state.inventory.includes(DEMO_POTION_ID)) {
      return {
        ...state,
        log: addLog(state, "No Potion is available."),
      };
    }
    const healed = clamp(state.player.hp + 40, 0, state.player.maxHp);
    const nextState = {
      ...state,
      inventory: state.inventory.filter((id, index) => id !== DEMO_POTION_ID || index !== state.inventory.indexOf(DEMO_POTION_ID)),
      player: {
        ...state.player,
        hp: healed,
      },
      log: addLog(state, "Potion restores 40 HP."),
    };
    return enemyTurn(nextState, nextState.enemy);
  }

  if (actionId === "guard") {
    const nextState = {
      ...state,
      player: {
        ...state.player,
        mp: clamp(state.player.mp + 4, 0, state.player.maxMp),
        guard: 7,
      },
      log: addLog(state, "Mystery guards and recovers 4 MP."),
    };
    return enemyTurn(nextState, nextState.enemy);
  }

  const damageBeforeGuard = Math.max(1, actionDamage(state, actionId) - state.enemy.defense);
  const damage = Math.max(1, damageBeforeGuard - (state.enemy.guard || 0));
  const enemyHp = clamp(state.enemy.hp - damage, 0, state.enemy.maxHp);
  const mpGain = actionId === "strike" ? 2 : 0;
  const guardGain = actionId === "battle-cry" ? 5 : 0;
  const playerMessage = `${action.label} deals ${damage}.`;
  const afterPlayer = {
    ...state,
    enemy: {
      ...state.enemy,
      hp: enemyHp,
      guard: 0,
    },
    player: {
      ...state.player,
      mp: clamp(state.player.mp - action.mpCost + mpGain, 0, state.player.maxMp),
      guard: guardGain,
    },
    log: addLog(state, playerMessage),
  };

  if (enemyHp <= 0) {
    return applyVictory(afterPlayer, state.enemy.name, playerMessage);
  }

  return enemyTurn(afterPlayer, afterPlayer.enemy);
}

export function playerAttack(state, skillId = "strike") {
  const mappedAction =
    skillId.includes("air-2") ? "lightning-shot" : skillId.includes("panda") ? "battle-cry" : skillId;
  return performBattleAction(state, mappedAction);
}

export function restAtCamp(state) {
  return {
    ...state,
    player: {
      ...state.player,
      hp: state.player.maxHp,
      mp: state.player.maxMp,
      guard: 0,
    },
    log: addLog(state, "The party catches its breath and recovers."),
  };
}

export function markDialogueSeen(state) {
  return {
    ...state,
    flags: {
      ...state.flags,
      introDialogue: true,
    },
    log: addLog(state, "Mystery's warning has been heard."),
  };
}

export function objectiveStatus(state) {
  return DEMO_OBJECTIVES.map((objective) => {
    let complete = false;
    if (objective.id === "hear-warning") complete = state.flags.introDialogue;
    if (objective.id === "recover-amethyst") complete = state.flags.foundItem;
    if (objective.id === "recover-armor") complete = state.equipment.armor === DEMO_EQUIPMENT_ID;
    if (objective.id === "scout-approach") complete = state.flags.scoutedApproach;
    if (objective.id === "defeat-raider") complete = state.flags.battleWon;
    return {
      ...objective,
      complete,
      active: state.currentAreaId === objective.areaId && !complete,
    };
  });
}

export function returnToTitleState() {
  return null;
}

export function serializableState(state) {
  return {
    ...state,
    updatedAt: new Date().toISOString(),
  };
}

const { loadContent } = require("./content");
const { cloneJson, deepFreeze } = require("./utils");

const INITIAL_ITEMS = ["item.prism_fragment_a", "item.adventurers_journal"];
const INITIAL_JOURNAL_ENTRIES = ["journal.quest.objective"];

function createFlagState(content) {
  const flags = {};

  for (const flag of content.flags) {
    flags[flag.id] = flag.defaultValue;
  }

  return flags;
}

function createRoomState(content) {
  const rooms = {};

  for (const room of content.rooms) {
    rooms[room.id] = {
      visited: room.id === "room.01",
      cleared: false,
      visibleItems: [],
      pickedUpItems: [],
      defeatedMonsters: [],
      examinedTargets: [],
      localFlags: {}
    };
  }

  return rooms;
}

function createInitialState(options = {}) {
  const content = options.content || loadContent();
  const startingStats = cloneJson(content.config.startingStats.value);
  const seed = options.seed || "ruins-default-seed";

  return deepFreeze({
    schemaVersion: 1,
    engineVersion: "0.1.0-scaffold",
    canonVariant: content.canonVariant,
    phase: "exploration",
    session: {
      id: options.sessionId || "local-session",
      createdAt: options.createdAt || null
    },
    location: {
      currentRoomId: "room.01",
      previousRoomId: null,
      enteredVia: null
    },
    player: {
      baseStats: cloneJson(startingStats),
      currentStats: cloneJson(startingStats),
      equipmentModifiers: {},
      statusEffects: [],
      gold: 0
    },
    inventory: {
      items: INITIAL_ITEMS.map((itemId) => ({
        itemId,
        quantity: 1
      })),
      equipped: {}
    },
    journal: {
      unlockedEntryIds: [...INITIAL_JOURNAL_ENTRIES]
    },
    flags: createFlagState(content),
    rooms: createRoomState(content),
    combat: null,
    rng: {
      seed,
      drawIndex: 0
    },
    metadata: {
      contentSchemaVersion: content.schemaVersion,
      runtimeConnected: false
    }
  });
}

function getCurrentRoom(state, content = loadContent()) {
  return content.indexes.roomsById.get(state.location.currentRoomId) || null;
}

function hasItem(state, itemId) {
  return state.inventory.items.some((item) => item.itemId === itemId && item.quantity > 0);
}

function isFlagSet(state, flagId) {
  return Boolean(state.flags[flagId]);
}

function getPlayerStats(state) {
  return cloneJson(state.player.currentStats);
}

function listUnlockedJournalEntries(state, content = loadContent()) {
  return state.journal.unlockedEntryIds.map((entryId) => content.indexes.journalEntriesById.get(entryId)).filter(Boolean);
}

function withStatePatch(state, patch) {
  return deepFreeze({
    ...cloneJson(state),
    ...cloneJson(patch)
  });
}

module.exports = {
  createInitialState,
  getCurrentRoom,
  getPlayerStats,
  hasItem,
  isFlagSet,
  listUnlockedJournalEntries,
  withStatePatch
};

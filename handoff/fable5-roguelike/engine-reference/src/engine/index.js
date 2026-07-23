const { loadContent } = require("./content");
const { createCommandRegistry } = require("./commands");
const { createCombatPlaceholder } = require("./combat");
const { createEventsPlaceholder } = require("./events");
const { createInventoryPlaceholder } = require("./inventory");
const { createJournalPlaceholder } = require("./journal");
const { createTransitionRegistry } = require("./movement");
const { createRng, hashSeed } = require("./rng");
const { createSessionMetadata } = require("./session");
const {
  createInitialState,
  getCurrentRoom,
  getPlayerStats,
  hasItem,
  isFlagSet,
  listUnlockedJournalEntries,
  withStatePatch
} = require("./state");

module.exports = {
  createCommandRegistry,
  createCombatPlaceholder,
  createEventsPlaceholder,
  createInitialState,
  createInventoryPlaceholder,
  createJournalPlaceholder,
  createRng,
  createSessionMetadata,
  createTransitionRegistry,
  getCurrentRoom,
  getPlayerStats,
  hashSeed,
  hasItem,
  isFlagSet,
  listUnlockedJournalEntries,
  loadContent,
  withStatePatch
};

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createInitialState,
  getCurrentRoom,
  getPlayerStats,
  hasItem,
  isFlagSet,
  listUnlockedJournalEntries,
  loadContent,
  withStatePatch
} = require("../src/engine");

test("createInitialState builds immutable game state from content", () => {
  const content = loadContent();
  const state = createInitialState({
    content,
    seed: "state-seed",
    sessionId: "session-1",
    createdAt: "2026-05-22T00:00:00.000Z"
  });

  assert.equal(state.phase, "exploration");
  assert.equal(state.session.id, "session-1");
  assert.equal(state.location.currentRoomId, "room.01");
  assert.deepEqual(state.player.currentStats, { ATF: 6, DEF: 6, EVA: 6, HP: 20 });
  assert.equal(hasItem(state, "item.prism_fragment_a"), true);
  assert.equal(hasItem(state, "item.adventurers_journal"), true);
  assert.equal(state.journal.unlockedEntryIds[0], "journal.quest.objective");
  assert.equal(state.rng.seed, "state-seed");
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.player.currentStats), true);
});

test("read-only query helpers return cloned or content-backed values", () => {
  const content = loadContent();
  const state = createInitialState({ content });

  assert.equal(getCurrentRoom(state, content).id, "room.01");
  assert.equal(isFlagSet(state, "flag.prism.assembled"), false);
  assert.equal(listUnlockedJournalEntries(state, content)[0].id, "journal.quest.objective");

  const stats = getPlayerStats(state);
  stats.ATF = 999;

  assert.equal(state.player.currentStats.ATF, 6);
});

test("withStatePatch returns a new frozen object without mutating the original", () => {
  const state = createInitialState();
  const next = withStatePatch(state, {
    phase: "combat"
  });

  assert.equal(state.phase, "exploration");
  assert.equal(next.phase, "combat");
  assert.notEqual(next, state);
  assert.equal(Object.isFrozen(next), true);
});

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEMO_EQUIPMENT_ID,
  DEMO_PICKUP_ID,
  DEMO_POTION_ID,
  completeLevelInteraction,
  createNewGame,
  equipArmor,
  goNext,
  markDialogueSeen,
  normalizeState,
  openLevelInteraction,
  performBattleAction,
  recoverArmor,
  retryBattle,
  searchRoadCache,
  startBattle,
} from "../src/static/game-core.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const areas = await readJson(join(root, "public", "content", "areas.json"));
const dialogue = await readJson(join(root, "public", "content", "dialogue.json"));
const skills = await readJson(join(root, "public", "content", "skills.json"));

assert(areas.some((area) => area.id === "area-001"), "area-001 must exist");
assert(dialogue.some((line) => line.id === "dialogue-text-006"), "demo dialogue must exist");
assert(skills.some((skill) => skill.id === "skill-cra-air-2-name"), "demo skill must exist");

let state = createNewGame("2026-06-08T00:00:00.000Z");
assert(state.currentAreaId === "area-001", "new game starts at area-001");
state = markDialogueSeen(state);
state = goNext(state);
assert(state.currentAreaId === "area-002", "navigation reaches area-002 after dialogue");
state = searchRoadCache(state);
assert(state.inventory.includes(DEMO_PICKUP_ID), "pickup adds item");
assert(state.inventory.includes(DEMO_POTION_ID), "road cache adds potion");
state = goNext(state);
assert(state.currentAreaId === "area-003", "navigation reaches area-003 after pickup");
state = recoverArmor(state);
state = equipArmor(state, DEMO_EQUIPMENT_ID);
assert(state.player.defense === 4, "equipment updates defense");
assert(state.player.maxMp === 20, "equipment updates max MP");
state = openLevelInteraction(state, "rally-survivors");
assert(state.mode === "interaction", "survivor interaction opens");
state = completeLevelInteraction(state, "rally-survivors", "rally");
assert(state.flags.ralliedSurvivors, "survivors can be rallied");
assert(state.flags.survivorEncounterResolved, "survivor encounter resolves");
assert(state.player.xp === 10, "survivor rally grants xp");
state = goNext(state);
assert(state.currentAreaId === "area-004", "navigation reaches castle approach");
state = openLevelInteraction(state, "scout-approach");
state = completeLevelInteraction(state, "scout-approach", "use-survivor-info");
assert(state.flags.scoutedApproach, "castle approach can be scouted");
assert(state.flags.usedSurvivorInfo, "survivor information affects scout choice");
assert(state.battlePlan.guardBonus === 6, "survivor information improves battle guard");
const restoredBeforeCombat = normalizeState(JSON.parse(JSON.stringify(state)));
assert(restoredBeforeCombat.flags.scoutedApproach, "pre-combat save can restore scout progress");
state = goNext(state);
assert(state.currentAreaId === "area-005", "navigation reaches final demo area");
state = startBattle(state);
assert(state.mode === "battle", "battle starts");
assert(state.player.guard === 6, "battle starts with scouting guard");
assert(state.enemy.intentIndex === 2, "survivor information changes enemy opening intent");
state = performBattleAction(state, "lightning-shot");
assert(state.enemy.hp === 48, "lightning shot uses amethyst bonus");
state = performBattleAction(state, "lightning-shot");
state = performBattleAction(state, "battle-cry");
state = performBattleAction(state, "lightning-shot");
state = performBattleAction(state, "strike");
assert(state.flags.battleWon, "battle can be won");
assert(state.flags.demoComplete, "demo completes after final battle");
assert(state.mode === "victory", "victory screen is reached");
assert(state.player.gold === 25, "victory grants gold");
assert(state.player.xp === 45, "victory and survivor rally grant xp");
assert(state.inventory.includes(DEMO_POTION_ID), "victory grants potion");

let defeatState = createNewGame("2026-06-08T00:00:00.000Z");
defeatState = {
  ...defeatState,
  currentAreaId: "area-005",
  player: {
    ...defeatState.player,
    hp: 1,
  },
};
defeatState = startBattle(defeatState);
defeatState = performBattleAction(defeatState, "strike");
assert(defeatState.mode === "defeat", "defeat state can be reached");
defeatState = retryBattle(defeatState);
assert(defeatState.mode === "battle", "retry returns to battle");
assert(defeatState.player.hp === defeatState.player.maxHp, "retry restores HP");

console.log("Demo tests passed");

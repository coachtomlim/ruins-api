import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEMO_EQUIPMENT_ID,
  DEMO_PICKUP_ID,
  addInventoryItem,
  createNewGame,
  equipArmor,
  goNext,
  playerAttack,
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
state = addInventoryItem(state, DEMO_PICKUP_ID);
assert(state.inventory.includes(DEMO_PICKUP_ID), "pickup adds item");
state = addInventoryItem(state, DEMO_EQUIPMENT_ID);
state = equipArmor(state, DEMO_EQUIPMENT_ID);
assert(state.player.defense === 4, "equipment updates defense");
state = goNext(goNext(state));
assert(state.currentAreaId === "area-003", "navigation reaches area-003");
state = startBattle(state);
assert(state.mode === "battle", "battle starts");
for (let i = 0; i < 4 && state.mode === "battle"; i += 1) {
  state = playerAttack(state, "skill-cra-air-2-name");
}
assert(state.flags.battleWon, "battle can be won");
assert(state.flags.demoComplete, "demo completes after final battle");

console.log("Demo tests passed");

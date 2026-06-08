import {
  DEMO_DIALOGUE_IDS,
  DEMO_EQUIPMENT_ID,
  DEMO_PICKUP_ID,
  DEMO_ROUTE,
  DEMO_SKILL_IDS,
  addInventoryItem,
  canGoBack,
  canGoNext,
  createNewGame,
  equipArmor,
  goBack,
  goNext,
  markDialogueSeen,
  normalizeState,
  objectiveStatus,
  playerAttack,
  removeInventoryItem,
  restAtCamp,
  serializableState,
  startBattle,
} from "./game-core.js";
import { byId, loadContent, usableSkills } from "./content-loader.js";
import { loadGame, resetSave, saveGame } from "./save-load.js";

const root = document.querySelector("#root");

let content = null;
let maps = {};
let state = null;
let activePanel = "scene";
let status = "Loading recovered Camelot Legends content...";

function lookup(collectionName, id) {
  return maps[collectionName]?.get(id) || null;
}

function currentArea() {
  return lookup("areas", state?.currentAreaId) || lookup("scenes", state?.currentAreaId);
}

function cleanText(value) {
  if (!value) return "";
  return value
    .replaceAll("â€™", "'")
    .replaceAll("â€œ", '"')
    .replaceAll("â€�", '"')
    .replaceAll("â€“", "-")
    .replaceAll("Ã¢â‚¬â„¢", "'")
    .replaceAll("Ã¢â‚¬Å“", '"')
    .replaceAll("Ã¢â‚¬ï¿½", '"')
    .replaceAll("Ã¢â‚¬â€œ", "-");
}

function recordLabel(record, fallback) {
  if (!record) return fallback;
  if (record.displayName && !record.displayName.includes("_")) return cleanText(record.displayName);
  return fallback;
}

function recordDescription(record, fallback = "") {
  if (!record) return fallback;
  if (record.description && !record.description.includes("_")) {
    return cleanText(record.description);
  }
  return fallback;
}

function setState(nextState, message = "") {
  state = normalizeState(nextState);
  if (message) status = message;
  render();
}

async function persist() {
  const result = await saveGame(serializableState(state));
  status = result;
  render();
}

async function restore() {
  const saved = await loadGame();
  if (!saved) {
    status = "No saved game was found.";
    render();
    return;
  }
  state = normalizeState(saved);
  activePanel = "scene";
  status = "Save loaded.";
  render();
}

async function clearSave() {
  await resetSave();
  status = "Saved game reset.";
  render();
}

function startNewGame() {
  state = createNewGame();
  activePanel = "scene";
  status = "New game started.";
  render();
}

function renderMenu() {
  return `
    <main class="menu-screen">
      <section class="hero-panel">
        <p class="eyebrow">Recovered Browser Demo</p>
        <h1>Camelot Legends</h1>
        <p class="lead">A single-player reconstruction prototype using recovered story, mission, item, skill, and dialogue records.</p>
        <div class="menu-actions">
          <button class="primary" data-action="new">Start New Game</button>
          <button data-action="load">Load Game</button>
        </div>
        <p class="status">${status}</p>
      </section>
    </main>
  `;
}

function activeObjective() {
  return objectiveStatus(state).find((objective) => objective.active);
}

function canAdvanceCurrentArea() {
  const objective = activeObjective();
  if (!objective) return true;
  return objective.id === "reach-castle-road" || objective.id === "defeat-raider";
}

function sceneVisualPath() {
  if (state.currentAreaId === "area-005") {
    return "./public/assets/recovered/characters-v2.png";
  }
  return "./public/assets/recovered/level-design-example.png";
}

function renderScenePanel() {
  const area = currentArea();
  const mission = lookup("missions", state.currentAreaId.replace("area", "mission"));
  const foundItem = state.inventory.includes(DEMO_PICKUP_ID);
  const hasArmor = state.inventory.includes(DEMO_EQUIPMENT_ID);
  const objective = activeObjective();
  const canBattle =
    state.currentAreaId === DEMO_ROUTE[DEMO_ROUTE.length - 1] && !state.flags.battleWon;

  return `
    <section class="scene-card">
      <div class="visual-band">
        <img src="${sceneVisualPath()}" alt="" />
        <span>${state.currentAreaId}</span>
      </div>
      <div class="scene-copy">
        <p class="eyebrow">${recordLabel(mission, "Mission")}</p>
        <h2>${recordLabel(area, "Recovered Scene")}</h2>
        <p>${recordDescription(area, "Recovered scene text is unavailable for this record.")}</p>
        <div class="objective-callout">
          <strong>Current objective</strong>
          <span>${objective ? objective.label : "Continue the route."}</span>
        </div>
      </div>
      <div class="action-grid">
        <button data-action="dialogue">Speak With Mystery</button>
        <button data-action="pickup" ${foundItem || state.currentAreaId !== "area-002" ? "disabled" : ""}>Search the Road</button>
        <button data-action="take-armor" ${hasArmor || state.currentAreaId !== "area-003" ? "disabled" : ""}>Recover Armor</button>
        <button data-action="rest">Rest</button>
        <button data-action="back" ${canGoBack(state) ? "" : "disabled"}>Previous Area</button>
        <button data-action="next" ${canGoNext(state) && canAdvanceCurrentArea() ? "" : "disabled"}>Next Area</button>
        <button class="danger" data-action="battle" ${canBattle ? "" : "disabled"}>Face Raider</button>
      </div>
    </section>
  `;
}

function renderDialoguePanel() {
  const lines = DEMO_DIALOGUE_IDS.map((id) => lookup("dialogue", id))
    .filter(Boolean)
    .map((line) => `<p>${recordDescription(line, line.displayName)}</p>`)
    .join("");
  return `
    <section class="panel-card">
      <p class="eyebrow">Dialogue Reconstruction</p>
      <h2>Mystery's Warning</h2>
      <div class="dialogue-lines">${lines}</div>
      <button class="primary" data-action="mark-dialogue">Continue</button>
    </section>
  `;
}

function renderInventoryPanel() {
  const rows = state.inventory
    .map((id) => {
      const item = lookup("items", id) || lookup("equipment", id);
      const equipped = state.equipment.armor === id ? " equipped" : "";
      return `
        <li class="item-row${equipped}">
          <div>
            <strong>${recordLabel(item, id)}</strong>
            <span>${recordDescription(item, "Recovered item; mechanics are still provisional.")}</span>
          </div>
          <div class="row-actions">
            ${id === DEMO_EQUIPMENT_ID ? `<button data-action="equip" data-id="${id}">Equip</button>` : ""}
            <button data-action="remove-item" data-id="${id}">Remove</button>
          </div>
        </li>
      `;
    })
    .join("");
  return `
    <section class="panel-card">
      <p class="eyebrow">Inventory</p>
      <h2>Recovered Goods</h2>
      <ul class="item-list">${rows || "<li>No items recovered yet.</li>"}</ul>
    </section>
  `;
}

function renderCharacterPanel() {
  const characters = ["mystery", "geoffrey", "baldwine", "elisabeth"]
    .map((id) => lookup("characters", id))
    .filter(Boolean)
    .map(
      (character) => `
        <li>
          <strong>${recordLabel(character, character.id)}</strong>
          <span>${recordDescription(character, character.description)}</span>
        </li>
      `,
    )
    .join("");
  return `
    <section class="panel-card">
      <p class="eyebrow">Party</p>
      <h2>${state.player.name}</h2>
      <div class="stat-row">
        <span>HP ${state.player.hp}/${state.player.maxHp}</span>
        <span>ATK ${state.player.attack}</span>
        <span>DEF ${state.player.defense}</span>
        <span>XP ${state.player.xp}</span>
        <span>Gold ${state.player.gold}</span>
      </div>
      <ul class="item-list">${characters}</ul>
    </section>
  `;
}

function renderSkillsPanel() {
  const skills = usableSkills(content.skills, DEMO_SKILL_IDS)
    .map((skill) => {
      const fallback = skill.id.includes("description") ? "Recovered skill effect" : "Recovered skill";
      return `
        <li>
          <strong>${recordLabel(skill, skill.id)}</strong>
          <span>${recordDescription(skill, fallback)}</span>
        </li>
      `;
    })
    .join("");
  return `
    <section class="panel-card">
      <p class="eyebrow">Skills</p>
      <h2>Usable Demo Skills</h2>
      <ul class="item-list">${skills}</ul>
    </section>
  `;
}

function renderJournalPanel() {
  const objectives = objectiveStatus(state)
    .map((objective) => {
      const stateClass = objective.complete ? "complete" : objective.active ? "active" : "";
      const marker = objective.complete ? "Done" : objective.active ? "Now" : "Soon";
      const area = lookup("areas", objective.areaId);
      return `
        <li class="objective-row ${stateClass}">
          <div>
            <strong>${objective.label}</strong>
            <span>${recordLabel(area, objective.areaId)}</span>
          </div>
          <em>${marker}</em>
        </li>
      `;
    })
    .join("");
  return `
    <section class="panel-card">
      <p class="eyebrow">Mission Journal</p>
      <h2>The Start of Legends</h2>
      <p>Temporary Beta route assembled from recovered episode records 1-5.</p>
      <ul class="item-list">${objectives}</ul>
    </section>
  `;
}

function renderMapPanel() {
  const rows = DEMO_ROUTE.map((id) => {
    const area = lookup("areas", id);
    const active = id === state.currentAreaId ? " active" : "";
    return `<li class="route-row${active}"><strong>${id}</strong><span>${recordLabel(area, id)}</span></li>`;
  }).join("");
  return `
    <section class="panel-card">
      <p class="eyebrow">Route</p>
      <h2>First Demo Path</h2>
      <ul class="item-list">${rows}</ul>
    </section>
  `;
}

function renderBattlePanel() {
  const enemy = state.enemy;
  if (!enemy) return renderScenePanel();
  return `
    <section class="battle-card">
      <p class="eyebrow">Battle Prototype</p>
      <h2>${enemy.name}</h2>
      <div class="combatants">
        <div>
          <strong>${state.player.name}</strong>
          <meter min="0" max="${state.player.maxHp}" value="${state.player.hp}"></meter>
          <span>HP ${state.player.hp}/${state.player.maxHp}</span>
        </div>
        <div>
          <strong>${enemy.name}</strong>
          <meter min="0" max="${enemy.maxHp}" value="${enemy.hp}"></meter>
          <span>HP ${enemy.hp}/${enemy.maxHp}</span>
        </div>
      </div>
      <div class="action-grid">
        <button data-action="attack" data-skill="basic-attack">Basic Attack</button>
        <button data-action="attack" data-skill="skill-cra-air-2-name">Lightning Shot</button>
        <button data-action="attack" data-skill="skill-panda-fire-2-name">Battle Cry</button>
      </div>
    </section>
  `;
}

function renderActivePanel() {
  if (state.mode === "battle") return renderBattlePanel();
  if (state.mode === "defeat") {
    return `
      <section class="panel-card">
        <p class="eyebrow">Defeat</p>
        <h2>The road falls silent.</h2>
        <p>Restoring a save or starting a new game will return the demo to a playable state.</p>
        <button data-action="new">Start Again</button>
      </section>
    `;
  }
  if (activePanel === "dialogue") return renderDialoguePanel();
  if (activePanel === "inventory") return renderInventoryPanel();
  if (activePanel === "character") return renderCharacterPanel();
  if (activePanel === "skills") return renderSkillsPanel();
  if (activePanel === "journal") return renderJournalPanel();
  if (activePanel === "map") return renderMapPanel();
  return renderScenePanel();
}

function renderGame() {
  const complete = state.flags.demoComplete
    ? `<div class="complete-banner">Demo path complete: opening route -> battle victory -> reward claimed.</div>`
    : "";
  const log = state.log.map((line) => `<li>${line}</li>`).join("");
  return `
    <main class="game-shell">
      <header class="top-bar">
        <div>
          <p class="eyebrow">Camelot Legends</p>
          <h1>Local Browser Demo</h1>
        </div>
        <div class="save-actions">
          <button data-action="save">Save</button>
          <button data-action="load">Load</button>
          <button data-action="reset-save">Reset Save</button>
        </div>
      </header>
      ${complete}
      <div class="game-layout">
        ${renderActivePanel()}
        <aside class="log-card">
          <p class="eyebrow">State Log</p>
          <ul>${log}</ul>
          <p class="status">${status}</p>
        </aside>
      </div>
      <nav class="bottom-nav" aria-label="Game panels">
        <button data-panel="scene">Scene</button>
        <button data-panel="character">Character</button>
        <button data-panel="inventory">Inventory</button>
        <button data-panel="skills">Skills</button>
        <button data-panel="journal">Journal</button>
        <button data-panel="map">Map</button>
      </nav>
    </main>
  `;
}

function renderError(error) {
  root.innerHTML = `
    <main class="menu-screen">
      <section class="hero-panel error-panel">
        <p class="eyebrow">Load Error</p>
        <h1>Unable to start demo</h1>
        <p>${error.message}</p>
      </section>
    </main>
  `;
}

function render() {
  root.innerHTML = state ? renderGame() : renderMenu();
}

root.addEventListener("click", async (event) => {
  const panelButton = event.target.closest("[data-panel]");
  if (panelButton && state) {
    activePanel = panelButton.dataset.panel;
    render();
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  const skill = button.dataset.skill;

  if (action === "new") return startNewGame();
  if (action === "load") return restore();
  if (action === "save" && state) return persist();
  if (action === "reset-save") return clearSave();

  if (!state) return;
  if (action === "dialogue") {
    activePanel = "dialogue";
    render();
  } else if (action === "mark-dialogue") {
    activePanel = "scene";
    setState(markDialogueSeen(state));
  } else if (action === "pickup") {
    setState(addInventoryItem(state, DEMO_PICKUP_ID), "Amethyst recovered from the road.");
  } else if (action === "take-armor") {
    setState(addInventoryItem(state, DEMO_EQUIPMENT_ID), "Lithic Armor recovered.");
  } else if (action === "remove-item") {
    setState(removeInventoryItem(state, id));
  } else if (action === "equip") {
    setState(equipArmor(state, id), "Armor equipped.");
  } else if (action === "rest") {
    setState(restAtCamp(state));
  } else if (action === "next") {
    activePanel = "scene";
    setState(goNext(state));
  } else if (action === "back") {
    activePanel = "scene";
    setState(goBack(state));
  } else if (action === "battle") {
    setState(startBattle(state));
  } else if (action === "attack") {
    setState(playerAttack(state, skill));
  }
});

async function boot() {
  try {
    content = await loadContent();
    maps = {
      areas: byId(content.areas),
      scenes: byId(content.scenes),
      missions: byId(content.missions),
      dialogue: byId(content.dialogue),
      items: byId(content.items),
      equipment: byId(content.equipment),
      characters: byId(content.characters),
    };
    status = "Recovered content loaded. Ready to start.";
    render();
  } catch (error) {
    renderError(error);
  }
}

boot();

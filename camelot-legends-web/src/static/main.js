import {
  BATTLE_ACTIONS,
  DEMO_DIALOGUE_IDS,
  DEMO_EQUIPMENT_ID,
  DEMO_PICKUP_ID,
  DEMO_POTION_ID,
  DEMO_ROUTE,
  DEMO_SKILL_IDS,
  canGoBack,
  canGoNext,
  availableLevelInteractions,
  choiceIsAvailable,
  completeLevelInteraction,
  createNewGame,
  currentEnemyIntent,
  equipArmor,
  goBack,
  goNext,
  levelInteractionById,
  markDialogueSeen,
  normalizeState,
  openLevelInteraction,
  objectiveStatus,
  performBattleAction,
  recoverArmor,
  removeInventoryItem,
  restAtCamp,
  retryBattle,
  searchRoadCache,
  serializableState,
  startBattle,
} from "./game-core.js";
import { byId, loadContent, usableSkills } from "./content-loader.js";
import { FIRST_LEVEL } from "./level-data.js";
import { VISUAL_ASSETS, visualLayoutForArea } from "./level1-visual-layout.js";
import { registerServiceWorker } from "./pwa.js";
import { loadGame, resetSave, saveGame } from "./save-load.js";

const root = document.querySelector("#root");

let content = null;
let maps = {};
let state = null;
let activePanel = "scene";
let status = "Loading recovered Camelot Legends content...";

const DIALOGUE_SPEAKERS = new Map();

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
  status = "Level 1 started.";
  render();
}

function returnToTitle() {
  state = null;
  activePanel = "scene";
  status = "Returned to title.";
  render();
}

function renderMenu() {
  return `
    <main class="menu-screen">
      <section class="hero-panel title-panel">
        <img src="./public/assets/recovered/level-design-example.png" alt="" />
        <p class="eyebrow">Recovered Browser Demo</p>
        <h1>Camelot Legends</h1>
        <p class="lead">${FIRST_LEVEL.subtitle}</p>
        <div class="menu-actions">
          <button class="primary" data-action="new">Start Level 1</button>
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
  return objective.id === "defeat-raider";
}

function sceneVisualPath() {
  if (state.currentAreaId === "area-005") {
    return "./public/assets/recovered/characters-v2.png";
  }
  return "./public/assets/recovered/level-design-example.png";
}

function actorClass(type) {
  return `scene-actor scene-actor-${type}`;
}

function renderActor(actor) {
  const style = `left:${actor.x}%; top:${actor.y}%;`;
  if (actor.type === "party") {
    return `
      <div class="${actorClass(actor.type)}" style="${style}" data-visual-actor="${actor.id}">
        <img src="${VISUAL_ASSETS.party}" alt="${actor.label}" />
        <span>${actor.label}</span>
      </div>
    `;
  }
  const marker = actor.type === "enemy" ? "!" : actor.type === "npc" ? "?" : actor.type === "item" ? "*" : "+";
  return `
    <div class="${actorClass(actor.type)}" style="${style}" data-visual-actor="${actor.id}">
      <b>${marker}</b>
      <span>${actor.label}</span>
    </div>
  `;
}

function renderSceneVisual() {
  const layout = visualLayoutForArea(state.currentAreaId);
  const actors = layout.actors
    .filter((actor) => {
      if (actor.id === "cache" && state.flags.foundItem) return false;
      if (actor.id === "armor" && state.equipment.armor === DEMO_EQUIPMENT_ID) return false;
      if (actor.id === "survivor" && state.flags.survivorEncounterResolved) return false;
      if (actor.id === "scout-shadow" && state.flags.scoutedApproach) return false;
      return true;
    })
    .map(renderActor)
    .join("");
  return `
    <div class="level-map" data-visual="level-map">
      <img class="level-map-bg" src="${layout.background}" alt="${layout.label}" data-visual="map-background" />
      <div class="isometric-grid" aria-hidden="true"></div>
      ${actors}
      <span class="area-badge">${state.currentAreaId}</span>
    </div>
  `;
}

function renderScenePanel() {
  const area = currentArea();
  const mission = lookup("missions", state.currentAreaId.replace("area", "mission"));
  const foundItem = state.inventory.includes(DEMO_PICKUP_ID);
  const hasArmor = state.inventory.includes(DEMO_EQUIPMENT_ID);
  const objective = activeObjective();
  const interactions = availableLevelInteractions(state);
  const canBattle =
    state.currentAreaId === DEMO_ROUTE[DEMO_ROUTE.length - 1] && !state.flags.battleWon;
  const interactionButtons = interactions
    .map(
      (interaction) => `
        <button data-action="open-interaction" data-id="${interaction.id}">
          <strong>${interaction.label}</strong>
          <span>${interaction.description}</span>
        </button>
      `,
    )
    .join("");
  const result = state.lastInteractionResult
    ? `
      <div class="result-callout">
        <strong>${state.lastInteractionResult.label}</strong>
        <span>${state.lastInteractionResult.result}</span>
        <em>${state.lastInteractionResult.rewardText}</em>
      </div>
    `
    : "";

  return `
    <section class="scene-card">
      ${renderSceneVisual()}
      <div class="scene-copy">
        <p class="eyebrow">${recordLabel(mission, "Mission")}</p>
        <h2>${recordLabel(area, "Recovered Scene")}</h2>
        <p>${recordDescription(area, "Recovered scene text is unavailable for this record.")}</p>
        <div class="objective-callout">
          <strong>Current objective</strong>
          <span>${objective ? objective.label : "Continue the route."}</span>
        </div>
        ${result}
      </div>
      <div class="action-grid">
        <button data-action="dialogue">Speak With Mystery</button>
        <button data-action="pickup" ${foundItem || state.currentAreaId !== "area-002" ? "disabled" : ""}>Search Road Cache</button>
        <button data-action="take-armor" ${hasArmor || state.currentAreaId !== "area-003" ? "disabled" : ""}>Recover Armor</button>
        ${interactionButtons}
        <button data-action="rest">Rest</button>
        <button data-action="back" ${canGoBack(state) ? "" : "disabled"}>Previous Area</button>
        <button data-action="next" ${canGoNext(state) && canAdvanceCurrentArea() ? "" : "disabled"}>Next Area</button>
        <button class="danger" data-action="battle" ${canBattle ? "" : "disabled"}>Engage Forgon Scout</button>
      </div>
    </section>
  `;
}

function renderInteractionPanel() {
  const interaction = levelInteractionById(state.activeInteractionId);
  if (!interaction) return renderScenePanel();
  const choices = interaction.choices
    .map((choice) => {
      const disabled = choiceIsAvailable(state, choice) ? "" : "disabled";
      const locked = disabled ? "<em>Requires survivor information</em>" : `<em>${choice.rewardText}</em>`;
      return `
        <button data-action="resolve-interaction" data-id="${choice.id}" ${disabled}>
          <strong>${choice.label}</strong>
          <span>${choice.description}</span>
          ${locked}
        </button>
      `;
    })
    .join("");
  const lines = interaction.lines.map((line) => `<p>${line}</p>`).join("");
  return `
    <section class="panel-card interaction-card">
      <p class="eyebrow">${interaction.eyebrow}</p>
      <h2>${interaction.label}</h2>
      <div class="speaker-row">
        <strong>${interaction.speaker}</strong>
        <span>${interaction.description}</span>
      </div>
      <div class="dialogue-lines">${lines}</div>
      <div class="action-grid choice-grid">${choices}</div>
      ${interaction.optional ? `<button data-action="cancel-interaction">Return to Scene</button>` : ""}
    </section>
  `;
}

function renderDialoguePanel() {
  const lines = DEMO_DIALOGUE_IDS.map((id) => lookup("dialogue", id))
    .filter(Boolean)
    .map((line) => {
      const speaker = DIALOGUE_SPEAKERS.get(line.id);
      return `
        <div class="dialogue-line" data-dialogue-id="${line.id}">
          <strong>${speaker ? speaker.speakerName : "Speaker Unknown"}</strong>
          <p>${recordDescription(line, line.displayName)}</p>
        </div>
      `;
    })
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
        <span>MP ${state.player.mp}/${state.player.maxMp}</span>
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
      <div class="field-notes">
        <strong>Level beats</strong>
        <span>${state.flags.ralliedSurvivors ? "Survivors rallied" : "Survivors still need help"}</span>
        <span>${state.flags.scoutedApproach ? "Castle approach scouted" : "Castle approach unscouted"}</span>
      </div>
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
  const intent = currentEnemyIntent(enemy);
  const potionCount = state.inventory.filter((id) => id === DEMO_POTION_ID).length;
  const actions = BATTLE_ACTIONS.map((action) => {
    const disabled =
      state.player.mp < action.mpCost ||
      (action.id === "potion" && potionCount === 0) ||
      (action.id === "potion" && state.player.hp >= state.player.maxHp);
    const cost = action.mpCost ? ` (${action.mpCost} MP)` : "";
    const suffix = action.id === "potion" ? ` x${potionCount}` : cost;
    return `
      <button data-action="battle-action" data-battle-action="${action.id}" ${disabled ? "disabled" : ""}>
        <strong>${action.label}${suffix}</strong>
        <span>${action.description}</span>
      </button>
    `;
  }).join("");
  return `
    <section class="battle-card">
      <div class="battle-field" data-visual="battle-field">
        <img class="battle-bg" src="${VISUAL_ASSETS.battleBackground}" alt="Battle field" data-visual="battle-background" />
        <div class="battle-sprite battle-party" data-visual="battle-party">
          <img src="${VISUAL_ASSETS.party}" alt="Mystery's party" />
          <span>${state.player.name}</span>
        </div>
        <div class="battle-sprite battle-enemy" data-visual="forgon-enemy">
          <img src="${VISUAL_ASSETS.forgon}" alt="${enemy.name}" />
          <span>${enemy.name}</span>
        </div>
        <p class="eyebrow">Level 1 Encounter</p>
      </div>
      <h2>${enemy.name}</h2>
      <div class="battle-intent">
        <strong>Enemy intent</strong>
        <span>${intent ? intent.label : "The enemy watches for an opening."}</span>
      </div>
      <div class="combatants">
        <div>
          <strong>${state.player.name}</strong>
          <meter min="0" max="${state.player.maxHp}" value="${state.player.hp}"></meter>
          <span>HP ${state.player.hp}/${state.player.maxHp} | MP ${state.player.mp}/${state.player.maxMp} | Guard ${state.player.guard}</span>
        </div>
        <div>
          <strong>${enemy.name}</strong>
          <meter min="0" max="${enemy.maxHp}" value="${enemy.hp}"></meter>
          <span>HP ${enemy.hp}/${enemy.maxHp} | Guard ${enemy.guard}</span>
        </div>
      </div>
      <div class="action-grid battle-actions">${actions}</div>
    </section>
  `;
}

function renderActivePanel() {
  if (state.mode === "battle") return renderBattlePanel();
  if (state.mode === "victory") {
    const area = currentArea();
    const approachSummary = state.flags.usedSurvivorInfo
      ? "Use Survivor Information shaped the approach and forced the scout onto the defensive."
      : state.flags.tookCover
        ? "Taking cover helped Mystery weather the first attack."
        : state.flags.preparedEquipment
          ? "Preparing equipment helped Mystery enter the fight focused."
          : "Mystery met the approach directly and survived the ambush.";
    return `
      <section class="panel-card victory-card">
        <div class="victory-visual" data-visual="victory-visual">
          <img src="${VISUAL_ASSETS.maps.castleWhite}" alt="Castle Camelot secured" />
          <img src="${VISUAL_ASSETS.party}" alt="Mystery's party" />
        </div>
        <p class="eyebrow">Level Complete</p>
        <h2>${FIRST_LEVEL.title}</h2>
        <p><strong>${recordLabel(area, state.currentAreaId)}</strong></p>
        <p>The Forgon scout is defeated and the path into Castle Camelot is open. Mystery recovered the Amethyst, secured armor from the ashes, and learned that the attack on Camelot was no accident.</p>
        <p>${approachSummary}</p>
        <p>Next destination: hold at Castle Camelot and prepare for the next recovered episode.</p>
        <div class="reward-row">
          <span>+25 gold</span>
          <span>+35 XP</span>
          <span>Potion recovered</span>
          <span>HP ${state.player.hp}/${state.player.maxHp}</span>
          <span>MP ${state.player.mp}/${state.player.maxMp}</span>
        </div>
        <div class="menu-actions">
          <button class="primary" data-action="save">Save and Continue Later</button>
          <button data-action="title">Return to Title</button>
          <button data-action="new">Replay Level 1</button>
        </div>
      </section>
    `;
  }
  if (state.mode === "defeat") {
    return `
      <section class="panel-card">
        <p class="eyebrow">Defeat</p>
        <h2>The road falls silent.</h2>
        <p>Mystery can regroup at full health and try the encounter again.</p>
        <button class="primary" data-action="retry">Retry Battle</button>
        <button data-action="new">Start Again</button>
      </section>
    `;
  }
  if (state.mode === "interaction") return renderInteractionPanel();
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
    ? `<div class="complete-banner">Level 1 complete: warning -> road cache -> armor -> survivors -> castle approach -> Forgon scout victory.</div>`
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
  if (action === "title") return returnToTitle();
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
    setState(searchRoadCache(state), "Amethyst and Potion recovered from the road.");
  } else if (action === "take-armor") {
    setState(recoverArmor(state), "Lithic Armor recovered.");
  } else if (action === "open-interaction") {
    setState(openLevelInteraction(state, id));
  } else if (action === "resolve-interaction") {
    setState(completeLevelInteraction(state, state.activeInteractionId, id));
  } else if (action === "cancel-interaction") {
    setState({
      ...state,
      mode: "scene",
      activeInteractionId: null,
    });
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
  } else if (action === "battle-action") {
    setState(performBattleAction(state, button.dataset.battleAction || skill));
  } else if (action === "retry") {
    setState(retryBattle(state));
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
    DIALOGUE_SPEAKERS.clear();
    for (const record of content.dialogueSpeakers || []) {
      DIALOGUE_SPEAKERS.set(record.dialogueId, record);
    }
    status = "Recovered content loaded. Ready to start.";
    render();
  } catch (error) {
    renderError(error);
  }
}

boot();
registerServiceWorker();

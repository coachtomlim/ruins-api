(function () {
  const logEl = document.getElementById("log");
  const cmdEl = document.getElementById("cmd");
  const sendEl = document.getElementById("send");
  const autoWalkthroughEl = document.getElementById("autoWalkthrough");
  const scenePanelEl = document.querySelector(".scene-panel");
  const roomImageEl = document.getElementById("roomImage");
  const roomLabelEl = document.getElementById("roomLabel");
  const phasePillEl = document.getElementById("phasePill");
  const sceneKickerEl = document.getElementById("sceneKicker");
  const transitionStripEl = document.getElementById("transitionStrip");
  const transitionLabelEl = document.getElementById("transitionLabel");
  const transitionMiniEl = document.getElementById("transitionMini");
  const transitionFramesEl = document.getElementById("transitionFrames");
  const miniMapPanelEl = document.getElementById("miniMapPanel");
  const miniMapEl = document.getElementById("miniMap");
  const miniMapStatusEl = document.getElementById("miniMapStatus");
  const breadcrumbsEl = document.getElementById("breadcrumbs");
  const breadcrumbStatusEl = document.getElementById("breadcrumbStatus");
  const statsEl = document.getElementById("stats");
  const locationEl = document.getElementById("location");
  const inventoryEl = document.getElementById("inventory");
  const journalEl = document.getElementById("journal");
  const combatQuickEl = document.getElementById("combatQuick");
  const exploreQuickEl = document.getElementById("exploreQuick");
  const prologueQuickEl = document.getElementById("prologueQuick");
  const useFogEl = document.getElementById("useFog");
  const usePulseEl = document.getElementById("usePulse");
  const useHeartEl = document.getElementById("useHeart");
  const drawerEl = document.getElementById("infoDrawer");
  const drawerBackdropEl = document.getElementById("drawerBackdrop");
  const drawerTitleEl = document.getElementById("drawerTitle");
  const drawerBodyEl = document.getElementById("drawerBody");
  const drawerActionsEl = document.getElementById("drawerActions");
  const drawerCloseEl = document.getElementById("drawerClose");
  const combatPanelEl = document.getElementById("combatPanel");
  const eventPanelEl = document.getElementById("eventPanel");
  const eventIconEl = document.getElementById("eventIcon");
  const eventKindEl = document.getElementById("eventKind");
  const eventTitleEl = document.getElementById("eventTitle");
  const eventBodyEl = document.getElementById("eventBody");
  const eventActionsEl = document.getElementById("eventActions");
  const enemyInitialEl = document.getElementById("enemyInitial");
  const enemyNameEl = document.getElementById("enemyName");
  const enemyHpBarEl = document.getElementById("enemyHpBar");
  const enemyStatsEl = document.getElementById("enemyStats");
  const playerHpBarEl = document.getElementById("playerHpBar");
  const playerCombatStatsEl = document.getElementById("playerCombatStats");
  const fogStateEl = document.getElementById("fogState");
  const pulseStateEl = document.getElementById("pulseState");
  const heartStateEl = document.getElementById("heartState");

  let data = null;
  let state = null;
  let runtime = null;
  let autoFightActive = false;
  let autoWalkthroughActive = false;
  let activeDrawer = null;
  let movementVisualUntil = 0;
  let uiState = null;

  window.__RUINS_DEBUG_STATE__ = () => state;

  const roomsById = new Map();
  const transitionById = new Map();
  const itemsById = new Map();
  const journalById = new Map();
  const monsterById = new Map();
  const navigationNodesById = new Map();
  const routeTransitionsById = new Map();
  const routeTransitionsByKey = new Map();
  const navigationEdges = [];
  const commands = [];

  function nowIso() {
    return new Date().toISOString();
  }

  function write(text) {
    logEl.textContent += (logEl.textContent ? "\n\n" : "") + text;
    logEl.scrollTop = logEl.scrollHeight;
  }

  function clearLog() {
    logEl.textContent = "";
  }

  function floorPct(value, pct) {
    return Math.floor((value * pct) / 100);
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function pct(current, max) {
    if (!max || max <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  }

  function hashSeed(seedText) {
    let hash = 2166136261;
    for (let i = 0; i < seedText.length; i += 1) {
      hash ^= seedText.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash >>> 0;
  }

  function rng(seedText) {
    let seed = hashSeed(seedText || "ruins-seed");
    return function roll(maxInclusive) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const mixed = seed >>> 16;
      return (mixed % maxInclusive) + 1;
    };
  }

  function itemName(itemId) {
    const item = itemsById.get(itemId);
    return item ? item.displayName : itemId;
  }

  function itemVisual(itemId) {
    const item = itemsById.get(itemId);
    const type = item && item.type ? item.type : "item";
    if (itemId.includes("scroll")) return { symbol: "S", type, label: "scroll" };
    if (itemId.includes("prism")) return { symbol: "P", type, label: "prism" };
    if (itemId.includes("glass")) return { symbol: "G", type, label: "key" };
    if (itemId.includes("girdle")) return { symbol: "D", type, label: "ward" };
    if (itemId.includes("potion")) return { symbol: "H", type, label: "heal" };
    if (itemId.includes("shield")) return { symbol: "D", type, label: "shield" };
    if (itemId.includes("hose")) return { symbol: "E", type, label: "speed" };
    if (itemId.includes("tetrahedronal")) return { symbol: "A", type, label: "artifact" };
    if (type === "readable") return { symbol: "J", type, label: "lore" };
    return { symbol: "I", type, label: type.replace(/_/g, " ") };
  }

  function monsterVisual(monster, monsterName) {
    const id = monster && monster.id ? monster.id : "";
    const name = String(monsterName || "").toLowerCase();
    if (id.includes("imp") || name.includes("imp")) return { className: "monster-imp", symbol: "I" };
    if (id.includes("musca") || name.includes("musca")) return { className: "monster-musca", symbol: "M" };
    if (id.includes("lizard") || name.includes("lizard")) return { className: "monster-lizardman", symbol: "L" };
    if (id.includes("banshee") || name.includes("banshee")) return { className: "monster-banshee", symbol: "B" };
    if (name.includes("kobold")) return { className: "monster-kobold", symbol: "K" };
    if (name.includes("gnome")) return { className: "monster-gnome", symbol: "G" };
    if (name.includes("goblin")) return { className: "monster-goblin", symbol: "G" };
    return { className: "monster-random", symbol: String(monsterName || "?").slice(0, 1).toUpperCase() };
  }

  function inventoryChip(entry) {
    const visual = itemVisual(entry.itemId);
    return `
      <span class="item-chip item-${escapeHtml(visual.type)}" title="${escapeHtml(itemName(entry.itemId))}">
        <span class="item-mark">${escapeHtml(visual.symbol)}</span>
        <span class="item-copy"><strong>${escapeHtml(itemName(entry.itemId))}</strong><em>${escapeHtml(visual.label)} x${entry.quantity}</em></span>
      </span>
    `;
  }

  function monsterStats(monster) {
    if (!monster) return null;
    if (monster.id === "monster.random_low_tier_scaled") {
      return {
        ATF: floorPct(state.player.currentStats.ATF, 70),
        DEF: floorPct(state.player.currentStats.DEF, 70),
        EVA: floorPct(state.player.currentStats.EVA, 70),
        HP: floorPct(state.player.currentStats.HP, 70)
      };
    }
    if (monster.id === "monster.banshee_doppelganger") {
      return deepClone(state.player.baseStats);
    }
    if (monster.stats && monster.stats.ATF) return deepClone(monster.stats);
    if (monster.stats && monster.stats.variants && monster.stats.variants.length) {
      return deepClone(monster.stats.variants[0].value);
    }
    return null;
  }

  function hasItem(itemId) {
    return state.inventory.items.some((x) => x.itemId === itemId && x.quantity > 0);
  }

  function consumeItem(itemId) {
    const item = state.inventory.items.find((x) => x.itemId === itemId);
    if (!item) return false;
    item.quantity -= 1;
    if (item.quantity <= 0) {
      state.inventory.items = state.inventory.items.filter((x) => x.itemId !== itemId);
    }
    return true;
  }

  function addItem(itemId, qty = 1) {
    const existing = state.inventory.items.find((x) => x.itemId === itemId);
    if (existing) existing.quantity += qty;
    else state.inventory.items.push({ itemId, quantity: qty });
  }

  function assetUrl(filePath) {
    return `/${String(filePath)
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")}`;
  }

  function routeKey(from, command, to) {
    return `${from}|${command}|${to}`;
  }

  function findRouteTransition(from, command, to) {
    return routeTransitionsByKey.get(routeKey(from, command, to)) || null;
  }

  function routeDuration(route) {
    const steps = route && Array.isArray(route.assetSequence) ? route.assetSequence.length : 1;
    return Math.max(1500, Math.min(4200, 900 + steps * 700));
  }

  function routeName(id) {
    if (id === "prologue") return "Inn";
    const navNode = navigationNodesById.get(id);
    if (navNode && navNode.label) return navNode.label;
    const room = roomsById.get(id) || transitionById.get(id);
    if (room && room.name) return room.name;
    return String(id).replace(/^transition\./, "").replace(/^room\./, "Room ");
  }

  function createUiState() {
    return {
      visitedRoomIds: new Set(["prologue"]),
      visitedRouteIds: new Set(),
      breadcrumbEvents: [{ type: "start", nodeId: "prologue", label: "Inn" }],
      currentRouteId: null,
      walkthroughStepIndex: 0,
      visualEvent: null
    };
  }

  function ensureUiState() {
    if (!uiState) uiState = createUiState();
    return uiState;
  }

  function compactBreadcrumbEvents(events) {
    if (events.length <= 9) return events;
    return [events[0], { type: "gap", label: "..." }, ...events.slice(-7)];
  }

  function addBreadcrumbEvent(event) {
    const ui = ensureUiState();
    const last = ui.breadcrumbEvents[ui.breadcrumbEvents.length - 1];
    if (last && last.type === event.type && last.nodeId === event.nodeId && last.routeId === event.routeId && last.label === event.label) {
      return;
    }
    ui.breadcrumbEvents.push(event);
  }

  function visitNode(nodeId) {
    if (!nodeId) return;
    const ui = ensureUiState();
    const alreadyVisited = ui.visitedRoomIds.has(nodeId);
    ui.visitedRoomIds.add(nodeId);
    if (!alreadyVisited) addBreadcrumbEvent({ type: "location", nodeId, label: routeName(nodeId) });
  }

  function visitRoute(route) {
    if (!route) return;
    const ui = ensureUiState();
    ui.currentRouteId = route.id;
    ui.visitedRouteIds.add(route.id);
    ui.visitedRoomIds.add(route.from);
    ui.visitedRoomIds.add(route.to);
    addBreadcrumbEvent({
      type: "move",
      nodeId: route.to,
      routeId: route.id,
      label: `${routeName(route.from)} -> ${routeName(route.to)}`
    });
  }

  function clearCurrentRoute(routeId, durationMs) {
    setTimeout(() => {
      if (uiState && uiState.currentRouteId === routeId) {
        uiState.currentRouteId = null;
        renderNavigation();
      }
    }, durationMs + 150);
  }

  function edgeMetrics(fromNode, toNode) {
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    return {
      length: Math.sqrt(dx * dx + dy * dy),
      angle: `${Math.atan2(dy, dx)}rad`
    };
  }

  function renderMiniMap() {
    if (!miniMapEl || !data || !data.navigationMap) return;
    const ui = ensureUiState();
    const edgeHtml = navigationEdges
      .map((edge) => {
        const fromNode = navigationNodesById.get(edge.from);
        const toNode = navigationNodesById.get(edge.to);
        if (!fromNode || !toNode) return "";
        const metrics = edgeMetrics(fromNode, toNode);
        const classes = ["map-edge"];
        if (ui.visitedRouteIds.has(edge.routeId)) classes.push("is-visited");
        if (ui.currentRouteId === edge.routeId) classes.push("is-active");
        return `<span class="${classes.join(" ")}" style="--x1:${fromNode.x};--y1:${fromNode.y};--edge-length:${metrics.length};--edge-angle:${metrics.angle}"></span>`;
      })
      .join("");
    const nodeHtml = [...navigationNodesById.values()]
      .map((node) => {
        const classes = ["map-node"];
        const current = state && state.phase === "prologue" ? node.id === "prologue" : state && state.location.currentRoomId === node.id;
        if (ui.visitedRoomIds.has(node.id)) classes.push("is-visited");
        if (current) classes.push("is-current");
        if (node.id === "room.10") classes.push("is-objective");
        return `<span class="${classes.join(" ")}" style="--x:${node.x};--y:${node.y}" title="${escapeHtml(node.label)}">${escapeHtml(node.label.slice(0, 1))}<span>${escapeHtml(node.label)}</span></span>`;
      })
      .join("");
    miniMapEl.innerHTML = `${edgeHtml}${nodeHtml}`;
    if (miniMapStatusEl) {
      const currentLabel = state && state.phase === "prologue" ? "Inn" : routeName(state.location.currentRoomId);
      miniMapStatusEl.textContent = `${currentLabel} | ${ui.visitedRoomIds.size - 1}/${navigationNodesById.size - 1}`;
    }
  }

  function renderBreadcrumbs() {
    if (!breadcrumbsEl) return;
    const ui = ensureUiState();
    const events = compactBreadcrumbEvents(ui.breadcrumbEvents);
    breadcrumbsEl.innerHTML = events
      .map((event, index) => {
        const classes = [];
        if (index === events.length - 1) classes.push("is-current");
        if (event.type !== "location" && event.type !== "start" && event.type !== "gap") classes.push("is-event");
        const label = event.type === "gap" ? "..." : event.label;
        return `<li class="${classes.join(" ")}">${escapeHtml(label)}</li>`;
      })
      .join("");
    if (breadcrumbStatusEl) {
      breadcrumbStatusEl.textContent = `${ui.breadcrumbEvents.length} steps`;
    }
  }

  function renderNavigation() {
    renderMiniMap();
    renderBreadcrumbs();
    if (miniMapPanelEl) miniMapPanelEl.hidden = !data || !data.navigationMap;
  }

  function storeOffers() {
    return [
      { id: "item.store.shield_lionheart", price: 400, label: "Shield 400g" },
      { id: "item.store.minor_combat_healing_potion", price: 350, label: "Potion 350g" },
      { id: "item.store.hose_of_speed", price: 450, label: "Hose 450g" }
    ];
  }

  function setVisualEvent(event) {
    const ui = ensureUiState();
    ui.visualEvent = {
      ...event,
      expiresAt: event.persistent ? null : Date.now() + (event.durationMs || 4800)
    };
    if (event.breadcrumbLabel) {
      addBreadcrumbEvent({
        type: event.kind || "event",
        label: event.breadcrumbLabel,
        nodeId: state && state.location ? state.location.currentRoomId : null
      });
    }
  }

  function persistentVisualEvent() {
    if (!state || state.phase === "prologue") return null;
    const roomId = state.location.currentRoomId;
    if (state.flags["flag.ending.completed"]) {
      return {
        kind: "Ending",
        icon: "*",
        title: "Quest Complete",
        body: "Sheja receives Merlin's Tetrahedronal and the Ruin releases its hold.",
        actions: ["Artifact secured", "Journal complete"]
      };
    }
    if (roomId === "room.10" && state.flags["flag.boss.defeated"]) {
      return {
        kind: "Artifact",
        icon: "A",
        title: "Crystal Stand Awakened",
        body: "The Banshee has fallen. The final artifact can be claimed from the crystal stand.",
        actions: ["Examine crystal stand", "Pick up artifact"]
      };
    }
    if (roomId === "room.10") {
      return {
        kind: "Boss",
        icon: "B",
        title: "Banshee's Chamber",
        body: "The Sound-Deflecting Girdle is the key protection for this final chamber.",
        actions: [hasItem("item.sound_deflecting_girdle") ? "Girdle ready" : "Girdle missing"]
      };
    }
    if (roomId === "room.09" && state.flags["flag.room09.store_visited"]) {
      return {
        kind: "Store",
        icon: "$",
        title: "Galanic Store",
        body: "The seal offers last provisions before the boss chamber.",
        actions: storeOffers().map((offer) => {
          const owned = hasItem(offer.id);
          return `${offer.label}${owned ? " owned" : ""}`;
        })
      };
    }
    return null;
  }

  function renderEventPanel() {
    if (!eventPanelEl || !eventIconEl || !eventKindEl || !eventTitleEl || !eventBodyEl || !eventActionsEl) return;
    const ui = ensureUiState();
    if (ui.visualEvent && ui.visualEvent.expiresAt && ui.visualEvent.expiresAt < Date.now()) {
      ui.visualEvent = null;
    }
    const event = ui.visualEvent || persistentVisualEvent();
    if (!event) {
      eventPanelEl.hidden = true;
      return;
    }
    eventPanelEl.hidden = false;
    eventIconEl.textContent = event.icon || "!";
    eventKindEl.textContent = event.kind || "Event";
    eventTitleEl.textContent = event.title || "Event";
    eventBodyEl.textContent = event.body || "";
    eventActionsEl.innerHTML = (event.actions || []).map((action) => `<span>${escapeHtml(action)}</span>`).join("");
  }

  function renderRouteMini(route, durationMs) {
    if (!transitionMiniEl || !route) return;
    const steps = Math.max(2, route.assetSequence.length + 1);
    const dots = Array.from({ length: steps }, (_, index) => {
      const delay = Math.round((durationMs / Math.max(1, steps - 1)) * index);
      return `<span class="route-dot" style="--dot-delay:${delay}ms"></span>`;
    }).join("");
    transitionMiniEl.innerHTML = `
      <span class="route-endpoint">${escapeHtml(routeName(route.from))}</span>
      <span class="route-track" style="--route-duration:${durationMs}ms">
        ${dots}
        <span class="route-runner"></span>
      </span>
      <span class="route-endpoint">${escapeHtml(routeName(route.to))}</span>
    `;
  }

  function showRouteTransition(route) {
    if (!transitionStripEl || !transitionFramesEl || !transitionLabelEl || !route) return;
    const durationMs = routeDuration(route);
    movementVisualUntil = Math.max(movementVisualUntil, Date.now() + durationMs);
    visitRoute(route);
    transitionStripEl.hidden = false;
    transitionStripEl.classList.remove("is-moving");
    window.requestAnimationFrame(() => transitionStripEl.classList.add("is-moving"));
    transitionLabelEl.textContent = `${route.from} -> ${route.to}`;
    renderRouteMini(route, durationMs);
    transitionFramesEl.innerHTML = route.assetSequence
      .map(
        (filePath, index) => `
          <figure style="--frame-delay:${Math.round((durationMs / Math.max(1, route.assetSequence.length)) * index)}ms">
            <img src="${assetUrl(filePath)}" alt="Movement frame ${index + 1}" />
            <figcaption>${escapeHtml(route.status)}</figcaption>
          </figure>
        `
      )
      .join("");
    renderNavigation();
    clearCurrentRoute(route.id, durationMs);
  }

  function waitForMovementVisual(extraMs = 150) {
    const remaining = movementVisualUntil - Date.now();
    return sleep(Math.max(0, remaining + extraMs));
  }

  function mapImagePath() {
    return assetUrl(data.roomImageAssets.map);
  }

  function sceneImagePath(sceneId) {
    const scenePath = data.sceneImageAssets && data.sceneImageAssets.byId[sceneId];
    return scenePath ? assetUrl(scenePath) : mapImagePath();
  }

  function roomImagePath(roomId) {
    const roomPath = data.roomImageAssets.byRoomId[roomId];
    return roomPath ? assetUrl(roomPath) : mapImagePath();
  }

  function currentRoomId() {
    return state.location.currentRoomId;
  }

  function currentRoom() {
    return roomsById.get(currentRoomId()) || transitionById.get(currentRoomId()) || null;
  }

  function isTransitionNode(roomOrTransition) {
    return Boolean(roomOrTransition && roomOrTransition.id && roomOrTransition.id.startsWith("transition."));
  }

  function updateStatus() {
    const room = currentRoom();
    const inPrologue = state.phase === "prologue";
    const roomTitle = inPrologue ? "Adventurer's Inn" : room && room.name ? room.name : room ? room.id : "Unknown";
    document.body.dataset.phase = state.phase;
    roomLabelEl.textContent = `${roomTitle} (${state.phase})`;
    if (phasePillEl) phasePillEl.textContent = state.phase;
    if (sceneKickerEl) {
      sceneKickerEl.textContent = state.phase === "combat" ? "Combat" : inPrologue ? "Prologue" : roomsById.has(state.location.currentRoomId) ? "Exploration" : "Passage";
    }
    if (inPrologue) {
      roomImageEl.src = sceneImagePath("scene.prologue.tavern");
    } else if (roomsById.has(state.location.currentRoomId)) {
      roomImageEl.src = roomImagePath(state.location.currentRoomId);
    } else {
      roomImageEl.src = mapImagePath();
    }
    roomImageEl.alt = roomTitle;

    const stats = state.player.currentStats;
    statsEl.innerHTML = `<span>ATF ${stats.ATF}</span><span>DEF ${stats.DEF}</span><span>EVA ${stats.EVA}</span><span>HP ${stats.HP}</span><span>Gold ${state.player.gold}</span>`;

    const exits = inPrologue ? "None" : (room && room.exits ? room.exits : []).map((e) => e.direction).join(", ") || "None";
    locationEl.textContent = `${roomTitle}\nExits: ${exits}`;

    inventoryEl.innerHTML = state.inventory.items.length ? `<div class="inventory-chips">${state.inventory.items.map(inventoryChip).join("")}</div>` : "Empty";
    journalEl.textContent = `${state.journal.unlockedEntryIds.length} unlocked`;
    updateCombatPanel();
    syncActionBars();
    renderNavigation();
    renderEventPanel();
    if (activeDrawer) renderDrawer(activeDrawer);
  }

  function updateScrollState(element, label, itemId) {
    if (!element) return;
    const ready = hasItem(itemId) && state.phase === "combat";
    element.textContent = `${label}: ${ready ? "ready" : "unavailable"}`;
    element.dataset.ready = ready ? "true" : "false";
  }

  function updateCombatPanel() {
    if (!combatPanelEl) return;
    const inCombat = state && state.phase === "combat" && state.combat;
    combatPanelEl.hidden = !inCombat;
    if (!inCombat) return;

    const combat = state.combat;
    const player = state.player.currentStats;
    const visual = monsterVisual(combat.monster, combat.monsterName);
    enemyInitialEl.textContent = visual.symbol;
    const portrait = typeof enemyInitialEl.closest === "function" ? enemyInitialEl.closest(".combat-portrait") : null;
    if (portrait) {
      portrait.className = `combat-portrait ${visual.className}`;
    }
    enemyNameEl.textContent = combat.monsterName;
    enemyHpBarEl.style.width = `${pct(combat.currentStats.HP, combat.baseStats.HP)}%`;
    playerHpBarEl.style.width = `${pct(player.HP, state.player.baseStats.HP)}%`;
    enemyStatsEl.textContent = `ATF ${combat.currentStats.ATF} / DEF ${combat.currentStats.DEF} / EVA ${combat.currentStats.EVA} / HP ${Math.max(0, combat.currentStats.HP)}`;
    playerCombatStatsEl.textContent = `ATF ${player.ATF} / DEF ${player.DEF} / EVA ${player.EVA} / HP ${Math.max(0, player.HP)}`;
    updateScrollState(fogStateEl, "Fog", "item.scroll.fog_of_confusion");
    updateScrollState(pulseStateEl, "Pulse", "item.scroll.pulse_of_calm");
    updateScrollState(heartStateEl, "Heart", "item.scroll.heart_beacon");
  }

  function pulseCombatTransition() {
    if (!scenePanelEl) return;
    scenePanelEl.classList.remove("combat-transition");
    window.requestAnimationFrame(() => {
      scenePanelEl.classList.add("combat-transition");
      setTimeout(() => scenePanelEl.classList.remove("combat-transition"), 900);
    });
  }

  function pulseCombatAction() {
    if (!combatPanelEl || combatPanelEl.hidden) return;
    combatPanelEl.classList.remove("combat-action");
    window.requestAnimationFrame(() => {
      combatPanelEl.classList.add("combat-action");
      setTimeout(() => combatPanelEl.classList.remove("combat-action"), 520);
    });
  }

  function drawerRows(rows) {
    if (!rows.length) return '<p class="empty-state">Empty</p>';
    return rows.map((row) => `<div class="drawer-row">${row}</div>`).join("");
  }

  function renderInventoryDrawer() {
    const rows = state.inventory.items.map((entry) => {
      const item = itemsById.get(entry.itemId);
      const type = item && item.type ? item.type.replace(/_/g, " ") : "item";
      return `${inventoryChip(entry)}<span>${escapeHtml(type)} x${entry.quantity}</span>`;
    });
    drawerBodyEl.innerHTML = `<div class="drawer-list">${drawerRows(rows)}</div>`;
    drawerActionsEl.innerHTML = "";
  }

  function renderJournalDrawer() {
    const rows = state.journal.unlockedEntryIds
      .map((id) => journalById.get(id))
      .filter(Boolean)
      .map((entry) => `<strong>${escapeHtml(entry.title)}</strong><span>${escapeHtml(entry.textSummary)}</span>`);
    drawerBodyEl.innerHTML = `<div class="drawer-list">${drawerRows(rows)}</div>`;
    drawerActionsEl.innerHTML = "";
  }

  function renderMapDrawer() {
    const room = currentRoom();
    const roomTitle = state.phase === "prologue" ? "Adventurer's Inn" : room && room.name ? room.name : "Unknown";
    const exits = state.phase === "prologue" ? "None" : (room && room.exits ? room.exits : []).map((e) => e.direction).join(", ") || "None";
    drawerBodyEl.innerHTML = `<img class="drawer-map" src="${mapImagePath()}" alt="Adventure map" /><div class="drawer-row"><strong>${escapeHtml(roomTitle)}</strong><span>Exits: ${escapeHtml(exits)}</span></div>`;
    drawerActionsEl.innerHTML = "";
  }

  function renderSaveDrawer(kind) {
    const saved = localStorage.getItem("ruins-save-v1");
    const parsed = saved ? JSON.parse(saved) : null;
    const savedAt = parsed && parsed.savedAt ? new Date(parsed.savedAt).toLocaleString() : "No local save found";
    const actionLabel = kind === "load" ? "Load Game" : "Save Game";
    drawerBodyEl.innerHTML = `<div class="drawer-row"><strong>Local Slot</strong><span>${escapeHtml(savedAt)}</span></div>`;
    drawerActionsEl.innerHTML = `<button id="drawerPrimaryAction" type="button">${actionLabel}</button>`;
    document.getElementById("drawerPrimaryAction").addEventListener("click", () => {
      processCommand(kind === "load" ? "Load Game" : "Save");
      renderSaveDrawer(kind);
    });
  }

  function renderDrawer(kind) {
    if (!drawerEl || !drawerBodyEl || !drawerTitleEl || !drawerActionsEl) return;
    const titles = {
      inventory: "Inventory",
      journal: "Journal",
      map: "Map",
      save: "Save",
      load: "Load"
    };
    drawerTitleEl.textContent = titles[kind] || "Panel";
    if (kind === "inventory") renderInventoryDrawer();
    else if (kind === "journal") renderJournalDrawer();
    else if (kind === "map") renderMapDrawer();
    else if (kind === "save" || kind === "load") renderSaveDrawer(kind);
  }

  function openDrawer(kind) {
    if (!state) return;
    activeDrawer = kind;
    renderDrawer(kind);
    drawerEl.hidden = false;
    drawerBackdropEl.hidden = false;
    drawerCloseEl.focus();
  }

  function closeDrawer() {
    activeDrawer = null;
    if (drawerEl) drawerEl.hidden = true;
    if (drawerBackdropEl) drawerBackdropEl.hidden = true;
  }

  function syncActionBars() {
    const phase = state ? state.phase : "prologue";
    const inCombat = phase === "combat";
    const inPrologue = phase === "prologue";
    if (exploreQuickEl) {
      exploreQuickEl.style.display = inCombat || inPrologue ? "none" : "flex";
    }
    if (prologueQuickEl) {
      prologueQuickEl.style.display = inPrologue ? "flex" : "none";
    }
    if (combatQuickEl) {
      combatQuickEl.style.display = inCombat ? "flex" : "none";
    }
    if (useFogEl) useFogEl.disabled = !hasItem("item.scroll.fog_of_confusion") || !inCombat;
    if (usePulseEl) usePulseEl.disabled = !hasItem("item.scroll.pulse_of_calm") || !inCombat;
    if (useHeartEl) useHeartEl.disabled = !hasItem("item.scroll.heart_beacon") || !inCombat;
    if (autoWalkthroughEl) autoWalkthroughEl.disabled = autoWalkthroughActive;
  }

  function unlockJournal(entryId) {
    if (entryId && !state.journal.unlockedEntryIds.includes(entryId)) {
      state.journal.unlockedEntryIds.push(entryId);
      return journalById.get(entryId) || null;
    }
    return null;
  }

  function unlockJournalFromTrigger(trigger) {
    const unlocked = [];
    for (const entryId of trigger.journalUnlocks || []) {
      const entry = unlockJournal(entryId);
      if (entry) unlocked.push(entry);
    }
    return unlocked;
  }

  function ensureRoomAvailability(roomId) {
    const room = roomsById.get(roomId);
    const roomState = state.rooms[roomId];
    if (!room || !roomState) return;

    function maybeReveal(itemId, condition) {
      if (!condition) return;
      if (roomState.pickedUpItems.includes(itemId)) return;
      if (!roomState.visibleItems.includes(itemId)) {
        roomState.visibleItems.push(itemId);
      }
    }

    for (const entry of room.itemsAvailable || []) {
      const availability = String(entry.availability || "").toLowerCase();
      const itemId = entry.itemId;
      if (!availability) continue;

      if (availability === "visible_after_monster_defeat") {
        maybeReveal(itemId, roomState.defeatedMonsters.length > 0);
        continue;
      }
      if (availability === "visible_after_imp_defeat") {
        maybeReveal(itemId, roomState.defeatedMonsters.includes("monster.imp"));
        continue;
      }
      if (availability === "visible_after_lizardman_defeat") {
        maybeReveal(itemId, roomState.defeatedMonsters.includes("monster.lizardman"));
        continue;
      }
      if (availability === "visible_after_musca_defeat") {
        maybeReveal(itemId, roomState.defeatedMonsters.includes("monster.musca"));
        continue;
      }
      if (availability === "visible_after_push_panel") {
        maybeReveal(itemId, Boolean(state.flags["flag.room05.panel_pushed"]));
        continue;
      }
      if (availability === "visible_after_examine_sarcophagus") {
        maybeReveal(itemId, roomState.examinedTargets.some((x) => String(x).toLowerCase().includes("sarcophagus")));
        continue;
      }
      if (availability === "visible_after_examine_shards") {
        maybeReveal(itemId, roomState.examinedTargets.some((x) => String(x).toLowerCase().includes("shards")));
        continue;
      }
      if (availability === "visible_after_boss_defeat") {
        maybeReveal(itemId, Boolean(state.flags["flag.boss.defeated"]));
      }
    }
  }

  function revealItems(roomState, trigger) {
    for (const itemId of trigger.revealsItems || []) {
      if (!roomState.visibleItems.includes(itemId) && !roomState.pickedUpItems.includes(itemId)) {
        roomState.visibleItems.push(itemId);
      }
    }
  }

  function listVisibleItemsText(roomId) {
    const roomState = state.rooms[roomId];
    if (!roomState || !roomState.visibleItems.length) return "";
    return `\n\nYou notice: ${roomState.visibleItems.map(itemName).join(", ")}.`;
  }

  function showRoom(room, firstVisit) {
    if (isTransitionNode(room)) {
      visitNode(room.id);
      write(`${room.description}\n\nChoose your path.`);
      updateStatus();
      return;
    }
    ensureRoomAvailability(room.id);
    visitNode(room.id);
    let text = `${room.name}\n${room.description}`;
    if (firstVisit) {
      text += "\n\nA chill of unfamiliar stone settles over you.";
    }
    text += listVisibleItemsText(room.id);
    write(text);
    updateStatus();
  }

  function applyRunPenalty() {
    const keys = ["ATF", "DEF", "EVA", "HP"];
    for (const key of keys) {
      state.player.currentStats[key] = Math.max(1, state.player.currentStats[key] - floorPct(state.player.currentStats[key], 15));
    }
    unlockJournal("journal.penalty.run");
  }

  function fullyHeal() {
    state.player.currentStats.HP = state.player.baseStats.HP;
  }

  function rewardAfterVictory(monsterState) {
    const rewardPct = data.content.config.combat.victoryRewardPercent.value;
    const src = monsterState.baseStats;
    for (const key of ["ATF", "DEF", "EVA", "HP"]) {
      const delta = floorPct(src[key], rewardPct);
      state.player.baseStats[key] += delta;
      state.player.currentStats[key] += delta;
    }
    fullyHeal();
    write("The Galanic powers in this Ruin are activated, and you are healed of all your wounds.");
  }

  function defeatPlayer(message) {
    state.phase = "ended";
    write(`${message}\n\nYour journey ends here. Refresh to begin again.`);
    cmdEl.disabled = true;
    sendEl.disabled = true;
    updateStatus();
  }

  function processCombatTurn(action, itemTargetRaw) {
    const c = state.combat;
    if (!c || state.phase !== "combat") return;
    const roll = runtime.roll;

    function attack(attackerName, attackerStats, defenderName, defenderStats) {
      const a = attackerStats.EVA + roll(4);
      const d = defenderStats.EVA + roll(4);
      if (a < d) {
        write(`${attackerName} strikes at ${defenderName}, but the blow misses.`);
        return;
      }
      const damage = Math.max(1, attackerStats.ATF - defenderStats.DEF + roll(4));
      defenderStats.HP -= damage;
      if (attackerName === "You") write(`You land a hit on ${defenderName} for ${damage} damage.`);
      else write(`${attackerName} lands a hit on ${defenderName} for ${damage} damage.`);
    }

    if (action === "run") {
      applyRunPenalty();
      const retreatTo = c.returnToRoomId || "room.01";
      state.phase = "exploration";
      state.combat = null;
      state.location.currentRoomId = retreatTo;
      write("You break away from combat, but the Ruin exacts a cost.");
      updateStatus();
      const room = currentRoom();
      showRoom(room, false);
      return;
    }

    if (action === "use_item") {
      const query = (itemTargetRaw || "").toLowerCase();
      const scrollId = ["item.scroll.fog_of_confusion", "item.scroll.pulse_of_calm", "item.scroll.heart_beacon"].find((id) =>
        itemName(id).toLowerCase().includes(query)
      );
      if (!scrollId || !hasItem(scrollId)) {
        write("You cannot use that item now.");
      } else {
        consumeItem(scrollId);
        const match = c.monster.weakness === scrollId;
        const pct = match ? 50 : 5;
        for (const key of ["ATF", "DEF", "EVA", "HP"]) {
          c.currentStats[key] = Math.max(1, c.currentStats[key] - floorPct(c.currentStats[key], pct));
        }
        if (match) write("The effects of the scroll were devastating to the fiend, and all its stats have been reduced by half!");
        else write("The powers of the scroll are only mildly effective against this monster.");
      }
      if (c.currentStats.HP > 0) attack(c.monsterName, c.currentStats, "you", state.player.currentStats);
    } else {
      attack("You", state.player.currentStats, c.monsterName, c.currentStats);
      if (c.currentStats.HP > 0) attack(c.monsterName, c.currentStats, "you", state.player.currentStats);
    }

    if (state.player.currentStats.HP <= 0) {
      pulseCombatAction();
      defeatPlayer("You fall beneath the fiend's assault.");
      return;
    }
    if (c.currentStats.HP <= 0) {
      const roomState = state.rooms[c.roomId];
      roomState.defeatedMonsters.push(c.monster.id);
      for (const dropId of c.drops) {
        if (!roomState.visibleItems.includes(dropId) && !roomState.pickedUpItems.includes(dropId)) {
          roomState.visibleItems.push(dropId);
        }
      }
      if (c.monster.id === "monster.banshee_doppelganger") {
        state.flags["flag.boss.defeated"] = true;
      }
      rewardAfterVictory(c);
      ensureRoomAvailability(c.roomId);
      setVisualEvent({
        kind: c.monster.id === "monster.banshee_doppelganger" ? "Boss" : "Victory",
        icon: c.monster.id === "monster.banshee_doppelganger" ? "B" : "V",
        title: `${c.monsterName} Defeated`,
        body: c.monster.id === "monster.banshee_doppelganger"
          ? "The boss is defeated. The crystal stand can now reveal the artifact."
          : "The room settles and new rewards may be visible.",
        breadcrumbLabel: `Defeated: ${c.monsterName}`
      });
      state.phase = "exploration";
      state.combat = null;
      write(`${c.monsterName} is defeated.`);
      updateStatus();
      return;
    }

    write(`Combat status: You ${state.player.currentStats.HP} HP | ${c.monsterName} ${c.currentStats.HP} HP`);
    write("Combat options: Attack Once, Fight till the end, Run, Use Item <scroll>");
    updateStatus();
    pulseCombatAction();
  }

  function startCombatIfTriggered(room, roomState) {
    if (!room.entryTriggers) return false;
    const combatTrigger = room.entryTriggers.find((t) => t.type === "combat");
    if (!combatTrigger) return false;
    if (roomState.defeatedMonsters.includes(combatTrigger.monsterId)) return false;

    const monster = monsterById.get(combatTrigger.monsterId);
    const stats = monsterStats(monster);
    const monsterName =
      monster.id === "monster.random_low_tier_scaled" || monster.id === "monster.random_low_tier"
        ? monster.pool[runtime.roll(monster.pool.length) - 1]
        : monster.displayName;

    if (monster.id === "monster.banshee_doppelganger" && !hasItem("item.sound_deflecting_girdle")) {
      defeatPlayer("The Banshee's opening shriek rends your senses. Without the Sound-Deflecting Girdle, you perish instantly.");
      return true;
    }
    if (monster.id === "monster.banshee_doppelganger" && hasItem("item.sound_deflecting_girdle")) {
      state.flags["flag.boss.girdle_triggered"] = true;
      write("The Sound-Deflecting Girdle flashes and shields you from the Banshee's opening shriek.");
    }

    state.phase = "combat";
    state.combat = {
      roomId: room.id,
      monster,
      monsterName,
      baseStats: deepClone(stats),
      currentStats: deepClone(stats),
      drops: monster.drops || [],
      returnToRoomId:
        state.location.enteredVia === "one_way_portal"
          ? "room.06"
          : state.location.previousRoomId || "room.01"
    };

    setVisualEvent({
      kind: monster.id === "monster.banshee_doppelganger" ? "Boss" : "Combat",
      icon: monsterName.slice(0, 1).toUpperCase(),
      title: monsterName,
      body: `${monsterName} confronts you. Watch HP and scroll readiness.`,
      breadcrumbLabel: `Combat: ${monsterName}`
    });
    pulseCombatTransition();
    write(`A ${monsterName} confronts you. It lunges first.`);
    const a = state.combat.currentStats.EVA + runtime.roll(4);
    const d = state.player.currentStats.EVA + runtime.roll(4);
    if (a >= d) {
      const damage = Math.max(1, state.combat.currentStats.ATF - state.player.currentStats.DEF + runtime.roll(4));
      state.player.currentStats.HP -= damage;
      write(`${monsterName} strikes first for ${damage} damage.`);
    } else {
      write(`${monsterName}'s opening strike misses.`);
    }

    if (state.player.currentStats.HP <= 0) {
      defeatPlayer("You are slain before your counterstroke.");
      return true;
    }

    write("Combat options: Attack Once, Fight till the end, Run, Use Item <scroll>");
    updateStatus();
    return true;
  }

  function applyEntryTriggers(room, roomState) {
    for (const trigger of room.entryTriggers || []) {
      if (trigger.type === "status_effect" && trigger.effect === "reduce_all_stats_30_percent") {
        if (!state.flags["flag.status.poisoned"]) {
          for (const key of ["ATF", "DEF", "EVA", "HP"]) {
            state.player.currentStats[key] = Math.max(1, state.player.currentStats[key] - floorPct(state.player.currentStats[key], 30));
          }
          state.flags["flag.status.poisoned"] = true;
          write("The black roots lash your spirit, draining your strength by thirty percent.");
        }
      }
      if (trigger.type === "store") {
        if (state.flags["flag.prism.assembled"] && !state.flags["flag.room09.store_visited"]) {
          state.flags["flag.room09.store_visited"] = true;
          setVisualEvent({
            kind: "Store",
            icon: "$",
            title: "Galanic Store",
            body: "The seal offers last provisions before the boss chamber.",
            actions: storeOffers().map((offer) => offer.label),
            breadcrumbLabel: "Store opened"
          });
          write("A shimmering Galanic store appears: Buy 1 (Shield 400g), Buy 2 (Minor Potion 350g), Buy 3 (Hose of Speed 450g).");
        }
      }
    }
  }

  function move(directionRaw) {
    if (state.phase !== "exploration") {
      write("You cannot move while in combat or cutscene.");
      return;
    }
    const node = currentRoom();
    if (!node || !node.exits) {
      write("That is not a valid move at this time.");
      return;
    }
    const direction = directionRaw.toLowerCase();
    const exits = node.exits || [];
    const scoreExit = (rawDirection) => {
      const d = String(rawDirection || "").toLowerCase();
      if (d === direction) return 400;
      if (d.startsWith(`${direction}_`) || d.startsWith(`${direction}-`) || d.startsWith(direction)) return 300;
      if (d.includes(`_${direction}_`) || d.endsWith(`_${direction}`) || d.startsWith(`${direction}_`)) return 200;
      if (d.includes(direction)) return 100;
      return 0;
    };
    const candidates = exits
      .map((e) => ({ e, score: scoreExit(e.direction) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    const exit = candidates.length ? candidates[0].e : null;
    if (!exit) {
      write("That is not a valid move at this time.");
      return;
    }
    if ((exit.conditions || []).some((flagId) => !state.flags[flagId])) {
      write("A sealed force blocks your passage.");
      return;
    }

    showRouteTransition(findRouteTransition(node.id, exit.direction, exit.to));
    state.location.previousRoomId = state.location.currentRoomId;
    state.location.currentRoomId = exit.to;
    state.location.enteredVia = exit.oneWay ? "one_way_portal" : "normal";

    const next = currentRoom();
    if (isTransitionNode(next)) {
      write(`You move ${directionRaw.toUpperCase()}.`);
      showRoom(next, false);
      return;
    }
    const roomState = state.rooms[next.id];
    const firstVisit = !roomState.visited;
    roomState.visited = true;
    write(`You move ${directionRaw.toUpperCase()}.`);
    applyEntryTriggers(next, roomState);
    showRoom(next, firstVisit);
    startCombatIfTriggered(next, roomState);
  }

  function runExamine(targetText) {
    if (state.phase !== "exploration") {
      write("Not while combat rages.");
      return;
    }
    const node = currentRoom();
    if (!node || isTransitionNode(node)) {
      write("There is little to examine here beyond the path itself.");
      return;
    }
    const roomState = state.rooms[node.id];
    const target = (targetText || "").trim().toLowerCase();
    if (!target) {
      const notable = (node.examineTriggers || []).map((t) => t.target).filter(Boolean);
      const heldItems = roomState.visibleItems.map(itemName);
      const undefeated = (node.entryTriggers || [])
        .filter((t) => t.type === "combat" && !roomState.defeatedMonsters.includes(t.monsterId))
        .map((t) => {
          const m = monsterById.get(t.monsterId);
          return m ? m.displayName : t.monsterId;
        });

      const lines = [];
      lines.push(`You study ${node.name}.`);
      lines.push(node.description);
      if (undefeated.length) lines.push(`Threats present: ${undefeated.join(", ")}.`);
      if (heldItems.length) lines.push(`Items visible: ${heldItems.join(", ")}.`);
      if (notable.length) lines.push(`Notable features: ${notable.join(", ")}.`);
      if (!undefeated.length && !heldItems.length && !notable.length) lines.push("Nothing obvious reveals itself.");

      write(lines.join("\n"));
      return;
    }
    const trigger = (node.examineTriggers || []).find((x) => String(x.target || "").toLowerCase().includes(target));
    if (!trigger) {
      write("You examine the area but find nothing new.");
      return;
    }
    if ((trigger.requiresFlags || []).some((f) => !state.flags[f])) {
      write("Something about this remains dormant.");
      return;
    }
    if ((trigger.requiresItems || []).some((id) => !hasItem(id))) {
      write("You lack what is needed to complete that action.");
      return;
    }

    for (const flag of trigger.setsFlags || []) state.flags[flag] = true;
    if (trigger.id === "action.room05.push_panel") {
      state.flags["flag.room05.panel_pushed"] = true;
    }
    revealItems(roomState, trigger);
    const unlockedEntries = unlockJournalFromTrigger(trigger);
    roomState.examinedTargets.push(trigger.target);
    ensureRoomAvailability(node.id);
    write(`You examine ${trigger.target}.`);
    for (const entry of unlockedEntries) {
      write(`Journal updated: ${entry.title}\n${entry.textSummary}`);
      setVisualEvent({
        kind: "Journal",
        icon: "J",
        title: entry.title,
        body: entry.textSummary,
        breadcrumbLabel: `Journal: ${entry.title}`
      });
    }
    if ((trigger.revealsItems || []).length) {
      const names = trigger.revealsItems.map(itemName);
      write(`Revealed: ${names.join(", ")}.`);
      setVisualEvent({
        kind: "Discovery",
        icon: "?",
        title: "Hidden Item Revealed",
        body: names.join(", "),
        breadcrumbLabel: `Revealed: ${names[0]}`
      });
    }
    updateStatus();
  }

  function runPick(targetText) {
    if (state.phase !== "exploration") {
      write("Not while combat rages.");
      return;
    }
    const node = currentRoom();
    if (!node || isTransitionNode(node)) {
      write("There is nothing here to pick up.");
      return;
    }
    const roomState = state.rooms[node.id];
    const target = (targetText || "").trim().toLowerCase();
    if (!roomState.visibleItems.length) {
      write("There is nothing here to pick up.");
      return;
    }
    const itemId = roomState.visibleItems.find((id) => itemName(id).toLowerCase().includes(target));
    if (!itemId) {
      write("That item is not available to pick up right now.");
      return;
    }
    roomState.visibleItems = roomState.visibleItems.filter((id) => id !== itemId);
    roomState.pickedUpItems.push(itemId);
    addItem(itemId, 1);
    ensureRoomAvailability(node.id);
    if (itemId === "item.prism_fragment_c") unlockJournal("journal.discovery.prism_fragment_c");
    if (itemId === "item.merlins_tetrahedronal") {
      unlockJournal("journal.ending.hero_prophecy");
      state.flags["flag.ending.completed"] = true;
      setVisualEvent({
        kind: "Ending",
        icon: "*",
        title: "Quest Complete",
        body: "Sheja appears as the prophecy stirs to life. The quest is complete.",
        breadcrumbLabel: "Ending complete",
        persistent: true
      });
      write("As you claim Merlin's Tetrahedronal, Sheja appears and the prophecy stirs to life.");
      write("Sheja rewards you and the quest is complete.");
    } else {
      setVisualEvent({
        kind: "Item",
        icon: "+",
        title: itemName(itemId),
        body: "Added to your pack.",
        breadcrumbLabel: `Item: ${itemName(itemId)}`
      });
    }
    write(`You secure ${itemName(itemId)} in your pack.`);
    updateStatus();
  }

  function runAssemble() {
    if (state.phase !== "exploration") {
      write("Not while combat rages.");
      return;
    }
    const required = ["item.prism_fragment_a", "item.prism_fragment_b", "item.prism_fragment_c"];
    if (!required.every((id) => hasItem(id))) {
      write("You do not yet hold all three Prism Fragments.");
      return;
    }
    for (const id of required) consumeItem(id);
    addItem("item.prism_of_makidos", 1);
    state.flags["flag.prism.assembled"] = true;
    unlockJournal("journal.discovery.prism_assembled");
    unlockJournal("journal.discovery.final_chamber_open");
    ensureRoomAvailability(state.location.currentRoomId);
    setVisualEvent({
      kind: "Assembly",
      icon: "P",
      title: "Prism of Makidos",
      body: "The fragments align and the final chamber path opens.",
      breadcrumbLabel: "Prism assembled"
    });
    write("The fragments align. The Prism of Makidos awakens in your hands.");
    updateStatus();
  }

  function runInventory() {
    const lines = state.inventory.items.map((x) => `${itemName(x.itemId)} x${x.quantity}`);
    write(lines.length ? `Inventory:\n${lines.join("\n")}` : "Inventory is empty.");
  }

  function runJournal() {
    const entries = state.journal.unlockedEntryIds
      .map((id) => journalById.get(id))
      .filter(Boolean)
      .map((entry) => `- ${entry.title}: ${entry.textSummary}`);
    write(entries.length ? `Journal Entries:\n${entries.join("\n")}` : "No journal entries unlocked.");
  }

  function runHelp() {
    write(`Commands:\n${commands.map((c) => c.displayName).join(", ")}\nMovement: N/S/E/W, North/South/East/West.`);
    if (state.phase === "combat") {
      write("Combat commands: Attack Once, Fight till the end, Run, Use Item <scroll name>.");
    }
  }

  function runBuy(index) {
    if (state.location.currentRoomId !== "room.09" || !state.flags["flag.room09.store_visited"]) {
      write("There is no store to buy from here.");
      return;
    }
    const shop = storeOffers();
    const offer = shop[index - 1];
    if (!offer) {
      write("Unknown store option.");
      return;
    }
    if (state.player.gold < offer.price) {
      write("You do not have enough gold.");
      return;
    }
    state.player.gold -= offer.price;
    addItem(offer.id, 1);
    setVisualEvent({
      kind: "Store",
      icon: "$",
      title: itemName(offer.id),
      body: `Purchased for ${offer.price} gold.`,
      breadcrumbLabel: `Bought: ${itemName(offer.id)}`
    });
    write(`Purchased ${itemName(offer.id)}.`);
    updateStatus();
  }

  function runEquip(targetRaw) {
    const target = (targetRaw || "").toLowerCase();
    if (target.includes("shield") && hasItem("item.store.shield_lionheart")) {
      state.inventory.equipped.shield = "item.store.shield_lionheart";
      state.player.currentStats.DEF += 2;
      setVisualEvent({
        kind: "Gear",
        icon: "S",
        title: "Shield Equipped",
        body: "Shield of the Lionheart grants +2 DEF.",
        breadcrumbLabel: "Equipped shield"
      });
      write("You equip Shield of the Lionheart (+2 DEF).");
      updateStatus();
      return;
    }
    if (target.includes("hose") && hasItem("item.store.hose_of_speed")) {
      state.inventory.equipped.hose = "item.store.hose_of_speed";
      state.player.currentStats.EVA += 1;
      setVisualEvent({
        kind: "Gear",
        icon: "H",
        title: "Hose Equipped",
        body: "Hose of Speed grants +1 EVA.",
        breadcrumbLabel: "Equipped hose"
      });
      write("You equip Hose of Speed (+1 EVA).");
      updateStatus();
      return;
    }
    write("You cannot equip that.");
  }

  function saveGame() {
    if (state.phase !== "exploration") {
      write("You cannot save during combat.");
      return;
    }
    localStorage.setItem("ruins-save-v1", JSON.stringify({ state, runtimeSeed: runtime.seed, savedAt: nowIso() }));
    write("Game saved.");
  }

  function loadGame() {
    const raw = localStorage.getItem("ruins-save-v1");
    if (!raw) {
      write("No save found.");
      return;
    }
    const parsed = JSON.parse(raw);
    state = parsed.state;
    runtime = { seed: parsed.runtimeSeed, roll: rng(parsed.runtimeSeed) };
    write("Game loaded.");
    updateStatus();
    const room = currentRoom();
    if (room && room.description) showRoom(room, false);
  }

  function startRuinEntry() {
    state.phase = "exploration";
    state.location.currentRoomId = "room.01";
    state.location.previousRoomId = null;
    showRouteTransition(findRouteTransition("prologue", "say", "room.01"));
    const roomState = state.rooms["room.01"];
    roomState.visited = true;
    write("You utter the incantation. Stone and shadow crash around you as the Ruin takes shape.");
    showRoom(roomsById.get("room.01"), true);
  }

  function processPrologue(inputRaw) {
    const text = inputRaw.toLowerCase();
    if (state.prologue.awaitingIncantation) {
      if (text === "say" || text.includes("incantation")) {
        startRuinEntry();
      } else {
        write("Sheja waits. 'Say the incantation when you are ready.'");
      }
      return;
    }

    if (text === "yes" || text === "y" || text.includes("accept")) {
      state.prologue.accepted = true;
      state.player.gold += state.prologue.offer;
      state.prologue.awaitingIncantation = true;
      write(`Sheja nods. '${state.prologue.offer} gold, as agreed.' The coins are transferred to your purse.`);
      write("Sheja nods. You return to your inn room. Say the incantation?");
      return;
    }
    if (text === "offer") {
      write(`Sheja says, 'The contract stands at ${state.prologue.offer} gold.'`);
    } else if (
      text === "negotiate" ||
      text === "bargain" ||
      text.includes("1000") ||
      text.includes("1100") ||
      text.includes("1200") ||
      text.includes("900g") ||
      text.includes("900 gold") ||
      text.includes("more")
    ) {
      if (state.prologue.offer < 800) {
        state.prologue.offer = 800;
        write("Sheja narrows her eyes. 'Very well. I can raise it to 800 gold.'");
      } else {
        state.prologue.offer = 900;
        write("Sheja exhales. '900 gold. Final offer.'");
      }
    } else if (text.includes("quest") || text.includes("ruin")) {
      write("Sheja says the artifact is Merlin's Tetrahedronal, buried behind ten cursed chambers.");
    } else if (text.includes("monster")) {
      write("Sheja warns of the Voices of Care: fiends that test will, wit, and battlecraft.");
    } else if (text.includes("place") || text.includes("where")) {
      write("Sheja names the destination: the Forgotten Ruin in the Edela wilds, sealed from common paths.");
    } else if (text.includes("deal off") || text.includes("no")) {
      write("Sheja rises. 'Then we are done. Deal is off.'");
      defeatPlayer("The quest slips away before it begins.");
      return;
    } else if (text.includes("offer")) {
      write("Sheja speaks in a low voice about a forgotten ruin, voices of care, and an artifact hidden deep within.");
    } else {
      write("Sheja studies you in silence, waiting for your answer.");
    }

    state.prologue.interactions += 1;
    if (state.prologue.interactions >= 5 && !state.prologue.accepted) {
      write("Sheja rises. 'We are done here. Deal is off.'");
      defeatPlayer("The quest slips away before it begins.");
    }
  }

  function fightTillEnd() {
    if (autoFightActive || state.phase !== "combat") return;
    autoFightActive = true;
    cmdEl.disabled = true;
    sendEl.disabled = true;

    let guard = 0;
    const maxRounds = 400;

    function step() {
      if (!autoFightActive) return;
      if (state.phase !== "combat") {
        autoFightActive = false;
        cmdEl.disabled = false;
        sendEl.disabled = false;
        updateStatus();
        return;
      }
      if (guard >= maxRounds) {
        autoFightActive = false;
        cmdEl.disabled = false;
        sendEl.disabled = false;
        write("The clash drags on without conclusion. Choose your next action.");
        updateStatus();
        return;
      }

      processCombatTurn("attack");
      guard += 1;
      setTimeout(step, autoWalkthroughActive ? 760 : 180);
    }

    setTimeout(step, autoWalkthroughActive ? 650 : 0);
  }

  function processCommand(inputRaw, options = {}) {
    const fromAuto = Boolean(options.fromAuto);
    if (autoWalkthroughActive && !fromAuto) {
      write("Auto Walkthrough is running. Please wait for it to finish.");
      return;
    }
    const input = (inputRaw || "").trim();
    if (!input) return;
    write(`> ${input}`);
    const lower = input.toLowerCase();

    if (state.phase === "ended") {
      write("The adventure is over. Refresh to restart.");
      return;
    }

    if (state.phase === "prologue") {
      processPrologue(input);
      updateStatus();
      return;
    }

    if (state.phase === "combat") {
      if (lower === "a" || lower === "attack once") return processCombatTurn("attack");
      if (lower === "b" || lower === "fight till the end" || lower === "fight to end") return fightTillEnd();
      if (lower === "c" || lower === "run" || lower === "flee") return processCombatTurn("run");
      if (lower.startsWith("use item ")) return processCombatTurn("use_item", lower.slice(9));
      if (lower === "fight") {
        write("Choose: Attack Once, Fight till the end, Run, Use Item <scroll>.");
        return;
      }
      write("Invalid combat command.");
      return;
    }

    const movementAlias = { n: "north", s: "south", e: "east", w: "west" };
    if (movementAlias[lower]) return move(movementAlias[lower]);
    if (["north", "south", "east", "west"].includes(lower)) return move(lower);
    if (lower.startsWith("go ")) return move(lower.slice(3));
    if (lower === "help") return runHelp();
    if (lower === "inventory" || lower === "i") return runInventory();
    if (lower === "read journal" || lower === "journal") return runJournal();
    if (lower === "examine" || lower === "search" || lower === "inspect" || lower === "look") return runExamine("");
    if (lower.startsWith("examine ")) return runExamine(input.slice(8));
    if (lower.startsWith("search ")) return runExamine(input.slice(7));
    if (lower.startsWith("inspect ")) return runExamine(input.slice(8));
    if (lower.startsWith("look at ")) return runExamine(input.slice(8));
    if (lower.startsWith("pick up ")) return runPick(input.slice(8));
    if (lower.startsWith("pick ")) return runPick(input.slice(5));
    if (lower.startsWith("get ")) return runPick(input.slice(4));
    if (lower === "assemble" || lower === "assemble prism") return runAssemble();
    if (lower === "map") {
      roomImageEl.src = mapImagePath();
      write("You unfold the map and trace your route through the ruin.");
      return;
    }
    if (lower === "save" || lower === "save game") return saveGame();
    if (lower === "load" || lower === "load game") return loadGame();
    if (lower === "fight") {
      write("No enemy is currently engaging you.");
      return;
    }
    if (lower.startsWith("buy ")) return runBuy(Number(lower.slice(4).trim()));
    if (lower.startsWith("equip ")) return runEquip(lower.slice(6));
    if (lower.startsWith("use ")) {
      const target = lower.slice(4);
      if (target.includes("cure") && hasItem("item.cure_all_stats_potion")) {
        consumeItem("item.cure_all_stats_potion");
        for (const key of ["ATF", "DEF", "EVA", "HP"]) {
          state.player.currentStats[key] = state.player.baseStats[key];
        }
        state.flags["flag.status.poisoned"] = false;
        write("The potion restores your full strength and clears corruption.");
        updateStatus();
        return;
      }
      write("That item cannot be used right now.");
      return;
    }
    if (lower === "end" || lower === "quit" || lower === "end game") {
      state.phase = "ended";
      write("Your current expedition closes.");
      cmdEl.disabled = true;
      sendEl.disabled = true;
      updateStatus();
      return;
    }

    write("Unknown command. Type Help to see available commands.");
  }

  async function init() {
    const res = await fetch("/api/game-bootstrap");
    if (!res.ok) throw new Error(`Bootstrap failed with ${res.status}`);
    data = await res.json();

    roomsById.clear();
    transitionById.clear();
    itemsById.clear();
    journalById.clear();
    monsterById.clear();
    navigationNodesById.clear();
    routeTransitionsById.clear();
    routeTransitionsByKey.clear();
    navigationEdges.length = 0;
    commands.length = 0;

    for (const room of data.content.rooms) roomsById.set(room.id, room);
    for (const node of data.content.transitions) transitionById.set(node.id, node);
    for (const item of data.content.items) itemsById.set(item.id, item);
    for (const entry of data.content.journalEntries) journalById.set(entry.id, entry);
    for (const monster of data.content.monsters) monsterById.set(monster.id, monster);
    for (const route of data.routeTransitions.routes) {
      routeTransitionsById.set(route.id, route);
      routeTransitionsByKey.set(routeKey(route.from, route.command, route.to), route);
    }
    for (const node of data.navigationMap.nodes) navigationNodesById.set(node.id, node);
    for (const edge of data.navigationMap.edges) navigationEdges.push(edge);
    for (const command of data.content.commands) commands.push(command);

    state = data.initialState;
    uiState = createUiState();
    state.phase = "prologue";
    state.prologue = {
      interactions: 0,
      offer: 700,
      accepted: false,
      awaitingIncantation: false
    };
    state.player.gold = 0;

    const seed = window.__RUINS_TEST_SEED__ || `ruins-${Date.now()}`;
    runtime = { seed, roll: rng(seed) };

    clearLog();
    write("A hooded woman approaches you at the Adventurer's Inn. 'I am Sheja. I seek one willing to enter the Forgotten Ruin.'");
    write("You may ask about the quest, monsters, place, or offer. Accept with Yes.");
    updateStatus();
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function autoCmd(command, waitMs = 260) {
    const beforeMoveVisual = movementVisualUntil;
    if (autoWalkthroughActive) {
      const ui = ensureUiState();
      ui.walkthroughStepIndex += 1;
      addBreadcrumbEvent({
        type: "step",
        label: `${ui.walkthroughStepIndex}. ${command}`,
        nodeId: state && state.location ? state.location.currentRoomId : null
      });
      renderNavigation();
    }
    processCommand(command, { fromAuto: true });
    if (movementVisualUntil > beforeMoveVisual) {
      await waitForMovementVisual();
      return;
    }
    await sleep(waitMs);
  }

  async function waitForCombatToEnd(maxMs = 120000) {
    const start = Date.now();
    while (state.phase === "combat" && Date.now() - start < maxMs) {
      await sleep(200);
    }
  }

  async function autoFightWithOptionalScroll(scrollName) {
    if (state.phase !== "combat") return;
    await sleep(900);
    if (scrollName) {
      await autoCmd(`Use Item ${scrollName}`, 900);
    }
    while (state.phase === "combat") {
      processCommand("Fight till the end", { fromAuto: true });
      await sleep(1000);
      await waitForCombatToEnd();
      await sleep(450);
    }
  }

  async function runAutoWalkthrough() {
    if (autoWalkthroughActive) return;
    autoWalkthroughActive = true;
    updateStatus();

    clearLog();
    await init();
    write("AUTO WALKTHROUGH STARTED");

    try {
      const sequence = [
        "Offer",
        "Negotiate",
        "Bargain",
        "Yes",
        "Say",
        "Examine prism face 1",
        "Examine prism face 2",
        "Examine prism face 3",
        "Examine",
        "North",
        "Pick up Fog of Confusion",
        "Examine shrine",
        "East",
        "Examine mirror shards",
        "Pick up Hexagonal Glass Piece",
        "North",
        "Pick up Heart Beacon",
        "Examine east wall",
        "Examine panel",
        "Pick up Sound-Deflecting Girdle",
        "Pick up Lorebook",
        "South",
        "South",
        "South",
        "North",
        "Examine sarcophagus",
        "Pick up Cure All Stats Potion",
        "go northwest",
        "Pick up Pulse of Calm",
        "West",
        "Pick up Prism Fragment B",
        "Examine north wall mural",
        "South",
        "South",
        "Pick up Prism Fragment C",
        "Use Cure All Stats Potion",
        "Assemble",
        "South",
        "Buy 1",
        "Equip shield",
        "Buy 3",
        "Equip hose",
        "West",
        "Examine crystal stand",
        "Pick up Merlin's Tetrahedronal",
        "Read Journal"
      ];

      for (const step of sequence) {
        if (state.phase === "ended") break;
        if (state.phase === "combat") {
          if (state.combat?.monster?.id === "monster.imp") await autoFightWithOptionalScroll("Fog of Confusion");
          else if (state.combat?.monster?.id === "monster.musca") await autoFightWithOptionalScroll("Pulse of Calm");
          else if (state.combat?.monster?.id === "monster.lizardman") await autoFightWithOptionalScroll("Heart Beacon");
          else await autoFightWithOptionalScroll(null);
        }
        if (state.phase !== "combat") {
          await autoCmd(step);
        }
      }

      if (state.phase === "combat") {
        await autoFightWithOptionalScroll(null);
      }
      write("AUTO WALKTHROUGH COMPLETE");
    } catch (error) {
      write(`AUTO WALKTHROUGH FAILED: ${error.message}`);
    } finally {
      autoWalkthroughActive = false;
      updateStatus();
    }
  }

  sendEl.addEventListener("click", () => {
    processCommand(cmdEl.value);
    cmdEl.value = "";
    cmdEl.focus();
  });
  cmdEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendEl.click();
  });
  document.querySelectorAll("[data-cmd]").forEach((button) => {
    button.addEventListener("click", () => processCommand(button.dataset.cmd));
  });
  document.querySelectorAll("[data-panel]").forEach((button) => {
    button.addEventListener("click", () => openDrawer(button.dataset.panel));
  });
  if (drawerCloseEl) drawerCloseEl.addEventListener("click", closeDrawer);
  if (drawerBackdropEl) drawerBackdropEl.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDrawer();
  });
  if (autoWalkthroughEl) {
    autoWalkthroughEl.addEventListener("click", () => {
      runAutoWalkthrough();
    });
  }
  roomImageEl.addEventListener("error", () => {
    if (data && roomImageEl.src !== new URL(mapImagePath(), window.location.href).href) {
      roomImageEl.src = mapImagePath();
    }
  });

  init().catch((error) => {
    write(`Failed to initialize game UI: ${error.message}`);
  });
})();

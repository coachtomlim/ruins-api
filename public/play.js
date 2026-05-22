(function () {
  const logEl = document.getElementById("log");
  const cmdEl = document.getElementById("cmd");
  const sendEl = document.getElementById("send");
  const roomImageEl = document.getElementById("roomImage");
  const roomLabelEl = document.getElementById("roomLabel");
  const statsEl = document.getElementById("stats");
  const locationEl = document.getElementById("location");
  const inventoryEl = document.getElementById("inventory");
  const journalEl = document.getElementById("journal");

  let data = null;
  let state = null;

  const roomsById = new Map();
  const itemsById = new Map();
  const journalById = new Map();

  function write(text) {
    logEl.textContent += (logEl.textContent ? "\n\n" : "") + text;
    logEl.scrollTop = logEl.scrollHeight;
  }

  function itemName(itemId) {
    const item = itemsById.get(itemId);
    return item ? item.displayName : itemId;
  }

  function roomImagePath(roomId) {
    const roomPath = data.roomImageAssets.byRoomId[roomId];
    return roomPath ? `/${encodeURIComponent(roomPath)}` : `/${encodeURIComponent(data.roomImageAssets.map)}`;
  }

  function currentRoom() {
    return roomsById.get(state.location.currentRoomId);
  }

  function updateStatus() {
    const room = currentRoom();
    roomImageEl.src = roomImagePath(room.id);
    roomLabelEl.textContent = `${room.name} (${room.id})`;

    const stats = state.player.currentStats;
    statsEl.textContent = `Stats\nATF ${stats.ATF}  DEF ${stats.DEF}\nEVA ${stats.EVA}  HP ${stats.HP}`;
    locationEl.textContent = `Location\n${room.shortName}\nExits: ${(room.exits || []).map((e) => e.direction).join(", ") || "None"}`;
    inventoryEl.textContent = `Inventory\n${state.inventory.items.map((x) => itemName(x.itemId)).join(", ") || "Empty"}`;
    journalEl.textContent = `Journal\nUnlocked: ${state.journal.unlockedEntryIds.length}`;
  }

  function describeRoom(room, isFirstVisit) {
    let text = `${room.name}\n${room.description}`;
    if (isFirstVisit) {
      text += "\n\nThis place feels newly charted in your journal.";
    }
    const visible = state.rooms[room.id].visibleItems;
    if (visible.length) {
      text += `\n\nYou spot: ${visible.map(itemName).join(", ")}.`;
    }
    write(text);
    updateStatus();
  }

  function revealItems(roomState, trigger) {
    for (const itemId of trigger.revealsItems || []) {
      if (!roomState.visibleItems.includes(itemId) && !roomState.pickedUpItems.includes(itemId)) {
        roomState.visibleItems.push(itemId);
      }
    }
  }

  function unlockJournal(trigger) {
    for (const entryId of trigger.journalUnlocks || []) {
      if (!state.journal.unlockedEntryIds.includes(entryId)) {
        state.journal.unlockedEntryIds.push(entryId);
      }
    }
  }

  function move(directionRaw) {
    const room = currentRoom();
    const direction = directionRaw.toLowerCase();
    const exits = room.exits || [];

    const candidates = exits.filter((exit) => {
      const d = String(exit.direction || "").toLowerCase();
      return d === direction || d.startsWith(direction) || d.includes(direction);
    });

    if (!candidates.length) {
      write("That is not a valid move at this time.");
      return;
    }

    const exit = candidates[0];
    const toId = exit.to;
    const targetRoom = roomsById.get(toId);
    if (!targetRoom) {
      write(`The path toward ${toId} is not yet traversable in this build.`);
      return;
    }

    state.location.previousRoomId = state.location.currentRoomId;
    state.location.currentRoomId = toId;

    const roomState = state.rooms[toId];
    const firstVisit = !roomState.visited;
    roomState.visited = true;

    write(`You move ${directionRaw.toUpperCase()}.`);
    describeRoom(targetRoom, firstVisit);
  }

  function runExamine(targetText) {
    const room = currentRoom();
    const roomState = state.rooms[room.id];
    const target = (targetText || "").trim().toLowerCase();
    if (!target) {
      write("Examine what?");
      return;
    }

    const trigger = (room.examineTriggers || []).find((x) => String(x.target || "").toLowerCase().includes(target));
    if (!trigger) {
      write("You examine the area but find nothing new.");
      return;
    }

    if ((trigger.requiresFlags || []).some((f) => !state.flags[f])) {
      write("Something about this remains dormant.");
      return;
    }

    for (const flag of trigger.setsFlags || []) state.flags[flag] = true;
    revealItems(roomState, trigger);
    unlockJournal(trigger);
    roomState.examinedTargets.push(trigger.target);

    write(`You examine ${trigger.target}. A hidden detail reveals itself.`);
    if ((trigger.revealsItems || []).length) {
      write(`Revealed: ${trigger.revealsItems.map(itemName).join(", ")}.`);
    }
    updateStatus();
  }

  function runPick(targetText) {
    const room = currentRoom();
    const roomState = state.rooms[room.id];
    const target = (targetText || "").trim().toLowerCase();
    const visible = roomState.visibleItems.slice();
    if (!visible.length) {
      write("There is nothing here to pick up.");
      return;
    }

    const matchId = visible.find((id) => itemName(id).toLowerCase().includes(target));
    if (!matchId) {
      write("That item is not available to pick up right now.");
      return;
    }

    roomState.visibleItems = roomState.visibleItems.filter((id) => id !== matchId);
    roomState.pickedUpItems.push(matchId);

    const existing = state.inventory.items.find((x) => x.itemId === matchId);
    if (existing) existing.quantity += 1;
    else state.inventory.items.push({ itemId: matchId, quantity: 1 });

    write(`You secure ${itemName(matchId)} in your pack.`);
    updateStatus();
  }

  function runAssemble() {
    const required = ["item.prism_fragment_a", "item.prism_fragment_b", "item.prism_fragment_c"];
    const hasAll = required.every((id) => state.inventory.items.some((x) => x.itemId === id && x.quantity > 0));
    if (!hasAll) {
      write("You do not yet hold all three Prism Fragments.");
      return;
    }
    state.inventory.items = state.inventory.items.filter((x) => !required.includes(x.itemId));
    state.inventory.items.push({ itemId: "item.prism_of_makidos", quantity: 1 });
    state.flags["flag.prism.assembled"] = true;
    write("The fragments interlock. The Prism of Makidos hums with dormant force.");
    updateStatus();
  }

  function runHelp() {
    const names = data.content.commands.map((c) => c.displayName).join(", ");
    write(`Commands known in this build:\n${names}\n\nMovement accepts N/S/E/W.`);
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

  function processCommand(inputRaw) {
    const input = (inputRaw || "").trim();
    if (!input) return;

    write(`> ${input}`);
    const lower = input.toLowerCase();
    const movementAlias = { n: "north", s: "south", e: "east", w: "west" };
    if (movementAlias[lower]) return move(movementAlias[lower]);
    if (["north", "south", "east", "west"].includes(lower)) return move(lower);
    if (lower.startsWith("go ")) return move(lower.slice(3));
    if (lower === "help") return runHelp();
    if (lower === "inventory" || lower === "i") return runInventory();
    if (lower === "read journal" || lower === "journal") return runJournal();
    if (lower.startsWith("examine ")) return runExamine(input.slice(8));
    if (lower.startsWith("pick ")) return runPick(input.slice(5));
    if (lower.startsWith("pick up ")) return runPick(input.slice(8));
    if (lower.startsWith("get ")) return runPick(input.slice(4));
    if (lower === "assemble" || lower === "assemble prism") return runAssemble();
    if (lower === "map") {
      roomImageEl.src = `/${encodeURIComponent(data.roomImageAssets.map)}`;
      write("You unfold the ruin map and study the known paths.");
      return;
    }
    if (lower === "fight" || lower === "run" || lower === "save" || lower === "load game" || lower === "load") {
      write("That system is scaffolded but not fully implemented in this build yet.");
      return;
    }
    if (lower === "end" || lower === "quit") {
      write("Your current expedition closes. Refresh page to begin anew.");
      cmdEl.disabled = true;
      sendEl.disabled = true;
      return;
    }

    write("Unknown command. Type Help to see available commands.");
  }

  async function init() {
    const res = await fetch("/api/game-bootstrap");
    if (!res.ok) throw new Error(`Bootstrap failed with ${res.status}`);
    data = await res.json();
    state = data.initialState;

    for (const room of data.content.rooms) roomsById.set(room.id, room);
    for (const item of data.content.items) itemsById.set(item.id, item);
    for (const entry of data.content.journalEntries) journalById.set(entry.id, entry);

    write("You stand at the edge of a forgotten descent. Type Help to begin.");
    describeRoom(currentRoom(), true);
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

  init().catch((error) => {
    write(`Failed to initialize game UI: ${error.message}`);
  });
})();

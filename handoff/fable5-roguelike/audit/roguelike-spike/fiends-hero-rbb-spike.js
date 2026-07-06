(function () {
  const module001 = {
    id: "module-001-spike",
    rooms: {
      entry: {
        title: "Entry Chamber",
        body: "Cold air moves through the first threshold.",
        exits: { east: "fiend" }
      },
      fiend: {
        title: "Fiend Encounter",
        body: "A fiend bars the second room and tests the hero's nerve.",
        fiend: "ashen-fiend",
        artifact: "ember-sigil",
        journal: "journal-entry-001"
      }
    },
    victory: {
      requires: ["artifact:ember-sigil", "journal:journal-entry-001"]
    }
  };

  const state = {
    roomId: "entry",
    flags: {
      encounteredFiend: false,
      hasArtifact: false,
      journalUnlocked: false,
      victory: false
    },
    trace: [
      { step: 0, type: "module_loaded", moduleId: "module-001-spike" }
    ]
  };

  function addTrace(type, detail) {
    state.trace.push({
      step: state.trace.length,
      type,
      roomId: state.roomId,
      detail: detail || null
    });
  }

  function render() {
    const room = module001.rooms[state.roomId];
    document.getElementById("room-title").textContent = room.title;
    document.getElementById("room-body").textContent = room.body;
    document.getElementById("state-line").textContent =
      "Artifact: " + (state.flags.hasArtifact ? "yes" : "no") +
      " | Journal: " + (state.flags.journalUnlocked ? "yes" : "no") +
      " | Victory: " + (state.flags.victory ? "yes" : "no");
    document.getElementById("trace").textContent = JSON.stringify(state.trace, null, 2);

    document.getElementById("cell-entry").classList.toggle("active", state.roomId === "entry");
    document.getElementById("cell-fiend").classList.toggle("active", state.roomId === "fiend");
    document.getElementById("move").disabled = state.roomId !== "entry";
    document.getElementById("encounter").disabled = state.roomId !== "fiend" || state.flags.encounteredFiend;
    document.getElementById("artifact").disabled = !state.flags.encounteredFiend || state.flags.hasArtifact;
    document.getElementById("journal").disabled = !state.flags.hasArtifact || state.flags.journalUnlocked;
    document.getElementById("victory").disabled =
      !state.flags.hasArtifact || !state.flags.journalUnlocked || state.flags.victory;
  }

  document.getElementById("move").addEventListener("click", function () {
    state.roomId = module001.rooms.entry.exits.east;
    addTrace("move", { from: "entry", to: "fiend", direction: "east" });
    render();
  });

  document.getElementById("encounter").addEventListener("click", function () {
    state.flags.encounteredFiend = true;
    addTrace("encounter_triggered", { fiend: module001.rooms.fiend.fiend });
    render();
  });

  document.getElementById("artifact").addEventListener("click", function () {
    state.flags.hasArtifact = true;
    addTrace("artifact_collected", { artifact: module001.rooms.fiend.artifact });
    render();
  });

  document.getElementById("journal").addEventListener("click", function () {
    state.flags.journalUnlocked = true;
    addTrace("journal_unlocked", { journal: module001.rooms.fiend.journal });
    render();
  });

  document.getElementById("victory").addEventListener("click", function () {
    state.flags.victory = true;
    addTrace("victory", { condition: module001.victory.requires });
    render();
  });

  render();
})();

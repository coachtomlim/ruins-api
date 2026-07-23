const fs = require("node:fs");
const path = require("node:path");

const { deepFreeze, indexById } = require("./utils");

const DEFAULT_CONTENT_DIR = path.resolve(__dirname, "..", "..", "content");

const FILES = {
  commands: "commands.json",
  flags: "flags.json",
  gameConfig: "game-config.json",
  items: "items.json",
  journalEntries: "journal-entries.json",
  monsters: "monsters.json",
  rooms: "rooms.json",
  scrolls: "scrolls.json"
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadContent(contentDir = DEFAULT_CONTENT_DIR) {
  const raw = {};

  for (const [key, file] of Object.entries(FILES)) {
    raw[key] = readJson(path.join(contentDir, file));
  }

  const rooms = raw.rooms.rooms;
  const transitionNodes = raw.rooms.transitionNodes || [];
  const monsters = raw.monsters.monsters;
  const items = raw.items.items;
  const journalEntries = raw.journalEntries.journalEntries;
  const flags = raw.flags.flags;
  const commands = raw.commands.commands;
  const scrolls = raw.scrolls.scrolls;

  const content = {
    schemaVersion: 1,
    canonVariant: raw.gameConfig.canonVariant,
    config: raw.gameConfig,
    rooms,
    transitionNodes,
    monsters,
    items,
    journalEntries,
    flags,
    commands,
    scrolls,
    indexes: {
      roomsById: indexById(rooms, "rooms"),
      transitionNodesById: indexById(transitionNodes, "transitionNodes"),
      monstersById: indexById(monsters, "monsters"),
      itemsById: indexById(items, "items"),
      journalEntriesById: indexById(journalEntries, "journalEntries"),
      flagsById: indexById(flags, "flags"),
      commandsById: indexById(commands, "commands"),
      scrollsById: indexById(scrolls, "scrolls")
    }
  };

  return deepFreeze(content);
}

module.exports = {
  DEFAULT_CONTENT_DIR,
  loadContent
};

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const contentDir = path.join(root, "content");
const errors = [];

const requiredFiles = {
  "rooms.json": "rooms",
  "monsters.json": "monsters",
  "items.json": "items",
  "scrolls.json": "scrolls",
  "journal-entries.json": "journalEntries",
  "flags.json": "flags",
  "commands.json": "commands",
  "game-config.json": null
};

function readJson(file) {
  const fullPath = path.join(contentDir, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing content file: content/${file}`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON in content/${file}: ${error.message}`);
    return null;
  }
}

function collectIds(file, collectionName, requiredFields = []) {
  const data = readJson(file);
  if (!data) return { data: null, ids: new Set() };

  if (data.schemaVersion !== 1) {
    errors.push(`content/${file} must have schemaVersion 1.`);
  }

  const collection = data[collectionName];
  if (!Array.isArray(collection)) {
    errors.push(`content/${file} must contain array ${collectionName}.`);
    return { data, ids: new Set() };
  }

  const ids = new Set();
  for (const entry of collection) {
    if (!entry.id) {
      errors.push(`content/${file} has entry without id.`);
      continue;
    }

    if (ids.has(entry.id)) {
      errors.push(`content/${file} has duplicate id ${entry.id}.`);
    }
    ids.add(entry.id);

    for (const field of requiredFields) {
      if (entry[field] === undefined || entry[field] === null || entry[field] === "") {
        errors.push(`content/${file}:${entry.id} missing required field ${field}.`);
      }
    }

    if (!["LOCKED", "LIKELY", "CONFLICTED", "UNKNOWN"].includes(entry.canonStatus)) {
      errors.push(`content/${file}:${entry.id} has invalid or missing canonStatus.`);
    }
  }

  return { data, ids };
}

for (const [file, collection] of Object.entries(requiredFiles)) {
  const data = readJson(file);
  if (data && data.schemaVersion !== 1) {
    errors.push(`content/${file} must have schemaVersion 1.`);
  }
  if (collection && !Array.isArray(data?.[collection])) {
    errors.push(`content/${file} must contain array ${collection}.`);
  }
}

const rooms = collectIds("rooms.json", "rooms", ["name", "exits", "itemsAvailable", "monsters"]);
const monsters = collectIds("monsters.json", "monsters", ["displayName", "stats", "initiative"]);
const items = collectIds("items.json", "items", ["displayName", "type"]);
const scrolls = collectIds("scrolls.json", "scrolls", ["itemId", "displayName", "superEffectiveAgainst"]);
const journal = collectIds("journal-entries.json", "journalEntries", ["title", "unlockCondition", "textSummary"]);
const flags = collectIds("flags.json", "flags", ["kind", "description"]);
const commands = collectIds("commands.json", "commands", ["displayName", "context", "category"]);

const roomIds = rooms.ids;
const transitionIds = new Set((rooms.data?.transitionNodes || []).map((node) => node.id));
const monsterIds = monsters.ids;
const itemIds = items.ids;
const journalIds = journal.ids;
const flagIds = flags.ids;

for (const node of rooms.data?.transitionNodes || []) {
  if (!node.id) errors.push("transition node missing id.");
  if (transitionIds.has(node.id) && [...transitionIds].filter((id) => id === node.id).length > 1) {
    errors.push(`Duplicate transition node id: ${node.id}.`);
  }
}

function validateTarget(ref, knownIds, label, owner) {
  if (!knownIds.has(ref)) {
    errors.push(`${owner} references unknown ${label}: ${ref}`);
  }
}

for (const room of rooms.data?.rooms || []) {
  for (const exit of room.exits || []) {
    const targetType = exit.targetType || "room";
    if (targetType === "room") validateTarget(exit.to, roomIds, "room", room.id);
    if (targetType === "transition") validateTarget(exit.to, transitionIds, "transition node", room.id);
  }

  for (const trigger of room.entryTriggers || []) {
    if (trigger.monsterId) validateTarget(trigger.monsterId, monsterIds, "monster", `${room.id}:${trigger.id}`);
    for (const itemId of trigger.requiresItems || []) validateTarget(itemId, itemIds, "item", `${room.id}:${trigger.id}`);
    for (const flagId of trigger.requiresFlags || []) validateTarget(flagId, flagIds, "flag", `${room.id}:${trigger.id}`);
  }

  for (const trigger of room.examineTriggers || []) {
    for (const itemId of trigger.revealsItems || []) validateTarget(itemId, itemIds, "item", `${room.id}:${trigger.id}`);
    for (const itemId of trigger.requiresItems || []) validateTarget(itemId, itemIds, "item", `${room.id}:${trigger.id}`);
    for (const flagId of trigger.requiresFlags || []) validateTarget(flagId, flagIds, "flag", `${room.id}:${trigger.id}`);
    for (const flagId of trigger.setsFlags || []) validateTarget(flagId, flagIds, "flag", `${room.id}:${trigger.id}`);
    for (const entryId of trigger.journalUnlocks || []) validateTarget(entryId, journalIds, "journal entry", `${room.id}:${trigger.id}`);
  }

  for (const available of room.itemsAvailable || []) validateTarget(available.itemId, itemIds, "item", room.id);
  for (const monsterId of room.monsters || []) validateTarget(monsterId, monsterIds, "monster", room.id);
  for (const entryId of room.journalUnlocks || []) validateTarget(entryId, journalIds, "journal entry", room.id);
}

for (const node of rooms.data?.transitionNodes || []) {
  for (const exit of node.exits || []) {
    const targetType = exit.targetType || "room";
    if (targetType === "room") validateTarget(exit.to, roomIds, "room", node.id);
    if (targetType === "transition") validateTarget(exit.to, transitionIds, "transition node", node.id);
  }
}

for (const monster of monsters.data?.monsters || []) {
  if (monster.weakness) validateTarget(monster.weakness, itemIds, "item", monster.id);
  for (const itemId of monster.drops || []) validateTarget(itemId, itemIds, "item", monster.id);
}

for (const scroll of scrolls.data?.scrolls || []) {
  validateTarget(scroll.itemId, itemIds, "item", scroll.id);
  validateTarget(scroll.superEffectiveAgainst, monsterIds, "monster", scroll.id);
}

for (const command of commands.data?.commands || []) {
  for (const itemId of command.requiresItems || []) validateTarget(itemId, itemIds, "item", command.id);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Validated content: ${roomIds.size} rooms, ${transitionIds.size} transitions, ${monsterIds.size} monsters, ${itemIds.size} items, ${journalIds.size} journal entries, ${flagIds.size} flags, ${commands.ids.size} commands.`
);

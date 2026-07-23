function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }

  return value;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function indexById(entries, label) {
  const index = new Map();

  for (const entry of entries) {
    if (!entry.id) {
      throw new Error(`${label} entry is missing id`);
    }

    if (index.has(entry.id)) {
      throw new Error(`${label} contains duplicate id: ${entry.id}`);
    }

    index.set(entry.id, entry);
  }

  return index;
}

module.exports = {
  cloneJson,
  deepFreeze,
  indexById
};

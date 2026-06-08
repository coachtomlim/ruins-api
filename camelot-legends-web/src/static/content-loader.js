const CONTENT_FILES = {
  worlds: "worlds.json",
  areas: "areas.json",
  scenes: "scenes.json",
  characters: "characters.json",
  dialogue: "dialogue.json",
  missions: "missions.json",
  items: "items.json",
  equipment: "equipment.json",
  skills: "skills.json",
  assets: "asset-manifest.json",
};

const contentBases = ["./public/content/", "./content/", "/content/"];

async function fetchJson(fileName) {
  const errors = [];
  for (const base of contentBases) {
    try {
      const response = await fetch(`${base}${fileName}`);
      if (!response.ok) {
        errors.push(`${base}${fileName}: ${response.status}`);
        continue;
      }
      return response.json();
    } catch (error) {
      errors.push(`${base}${fileName}: ${error.message}`);
    }
  }
  throw new Error(`Could not load ${fileName}. Tried: ${errors.join("; ")}`);
}

function assertRecords(name, records) {
  if (!Array.isArray(records)) {
    throw new Error(`${name} must be an array`);
  }
  for (const record of records) {
    if (
      !record.id ||
      record.displayName === undefined ||
      record.description === undefined ||
      record.confidence === undefined
    ) {
      throw new Error(`${name} contains an invalid recovered record`);
    }
  }
}

function assertAssets(records) {
  if (!Array.isArray(records)) {
    throw new Error("assets must be an array");
  }
  for (const record of records) {
    if (!record.id || !record.originalPath || !record.assetType) {
      throw new Error("asset-manifest contains an invalid asset record");
    }
  }
}

export async function loadContent() {
  const entries = await Promise.all(
    Object.entries(CONTENT_FILES).map(async ([key, fileName]) => [
      key,
      await fetchJson(fileName),
    ]),
  );
  const content = Object.fromEntries(entries);
  for (const [name, records] of Object.entries(content)) {
    if (name === "assets") {
      assertAssets(records);
    } else {
      assertRecords(name, records);
    }
  }
  return content;
}

export function byId(records) {
  return new Map(records.map((record) => [record.id, record]));
}

export function usableSkills(skills, ids) {
  const map = byId(skills);
  return ids.map((id) => map.get(id)).filter(Boolean);
}

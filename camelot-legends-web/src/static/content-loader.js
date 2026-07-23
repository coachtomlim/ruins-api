const CONTENT_FILES = {
  worlds: "worlds.json",
  areas: "areas.json",
  scenes: "scenes.json",
  characters: "characters.json",
  dialogueSpeakers: "dialogue-speaker-map.json",
  dialogue: "dialogue.json",
  missions: "missions.json",
  items: "items.json",
  equipment: "equipment.json",
  skills: "skills.json",
  assets: "asset-manifest.json",
  visualAssets: "visual-asset-bindings.json",
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

function assertVisualAssets(records) {
  if (!Array.isArray(records)) {
    throw new Error("visualAssets must be an array");
  }
  for (const record of records) {
    if (!record.id || !record.runtimePath || !record.originalArchivePath || !record.intendedUse) {
      throw new Error("visual-asset-bindings contains an invalid asset record");
    }
  }
}

function assertDialogueSpeakers(records) {
  if (!Array.isArray(records)) {
    throw new Error("dialogueSpeakers must be an array");
  }
  for (const record of records) {
    if (!record.dialogueId || !record.speakerName || !record.source || !record.confidence) {
      throw new Error("dialogue-speaker-map contains an invalid speaker record");
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
    } else if (name === "visualAssets") {
      assertVisualAssets(records);
    } else if (name === "dialogueSpeakers") {
      assertDialogueSpeakers(records);
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

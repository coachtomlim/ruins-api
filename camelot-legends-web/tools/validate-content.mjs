import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const contentDir = join(root, "public", "content");

const contentFiles = [
  "worlds.json",
  "areas.json",
  "scenes.json",
  "characters.json",
  "classes.json",
  "enemies.json",
  "skills.json",
  "items.json",
  "equipment.json",
  "dialogue.json",
  "missions.json",
];

const assetFiles = ["asset-manifest.json"];
const allowedConfidence = new Set(["HIGH", "MEDIUM", "LOW"]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readJson(fileName) {
  const content = await readFile(join(contentDir, fileName), "utf8");
  return JSON.parse(content);
}

for (const fileName of contentFiles) {
  const records = await readJson(fileName);
  assert(Array.isArray(records), `${fileName} must contain an array`);
  const ids = new Set();
  for (const [index, record] of records.entries()) {
    assert(record.id, `${fileName}[${index}] is missing id`);
    assert(!ids.has(record.id), `${fileName} has duplicate id ${record.id}`);
    ids.add(record.id);
    assert(record.displayName !== undefined, `${fileName}[${index}] is missing displayName`);
    assert(record.description !== undefined, `${fileName}[${index}] is missing description`);
    assert(record.sourceFile, `${fileName}[${index}] is missing sourceFile`);
    assert(allowedConfidence.has(record.confidence), `${fileName}[${index}] has invalid confidence`);
    assert(record.notes !== undefined, `${fileName}[${index}] is missing notes`);
  }
  console.log(`${fileName}: ${records.length} records`);
}

for (const fileName of assetFiles) {
  const records = await readJson(fileName);
  assert(Array.isArray(records), `${fileName} must contain an array`);
  const ids = new Set();
  for (const [index, record] of records.entries()) {
    assert(record.id, `${fileName}[${index}] is missing id`);
    assert(!ids.has(record.id), `${fileName} has duplicate id ${record.id}`);
    ids.add(record.id);
    assert(record.originalPath, `${fileName}[${index}] is missing originalPath`);
    assert(record.assetType, `${fileName}[${index}] is missing assetType`);
    assert(record.likelyUse, `${fileName}[${index}] is missing likelyUse`);
    assert(typeof record.fileSize === "number", `${fileName}[${index}] has invalid fileSize`);
    assert(["yes", "no"].includes(record.needsConversion), `${fileName}[${index}] has invalid needsConversion`);
    assert(allowedConfidence.has(record.confidence), `${fileName}[${index}] has invalid confidence`);
    assert(record.licensingNotes !== undefined, `${fileName}[${index}] is missing licensingNotes`);
  }
  console.log(`${fileName}: ${records.length} records`);
}

console.log("Content validation passed");

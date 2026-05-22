const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "public", "assets-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const errors = [];
const ids = new Set();
const names = new Set();
const allowedTypes = new Set(["map", "room_image", "transition"]);

if (manifest.schemaVersion !== 1) {
  errors.push("assets-manifest.json must have schemaVersion 1.");
}

if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
  errors.push("assets-manifest.json must define a non-empty assets array.");
}

for (const asset of manifest.assets || []) {
  if (!asset.id) errors.push("Asset is missing id.");
  if (!asset.displayName) errors.push(`${asset.id || "unknown"} is missing displayName.`);
  if (!asset.filePath) errors.push(`${asset.id || "unknown"} is missing filePath.`);
  if (!allowedTypes.has(asset.type)) errors.push(`${asset.id} has unsupported type ${asset.type}.`);

  if (asset.id && ids.has(asset.id)) errors.push(`Duplicate asset id: ${asset.id}.`);
  if (asset.id) ids.add(asset.id);

  const aliases = [asset.displayName, ...(asset.aliases || [])].filter(Boolean);
  if (aliases.length === 0) errors.push(`${asset.id} must expose at least one name or alias.`);

  for (const alias of aliases) {
    const normalized = String(alias).trim().toLowerCase();
    if (!normalized) errors.push(`${asset.id} has an empty alias.`);
    if (names.has(normalized)) errors.push(`Duplicate asset alias/display name: ${alias}.`);
    names.add(normalized);
  }

  if (asset.filePath) {
    const assetPath = path.join(root, "public", asset.filePath);
    if (!fs.existsSync(assetPath)) {
      errors.push(`${asset.id} points to missing file: public/${asset.filePath}.`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${manifest.assets.length} assets.`);

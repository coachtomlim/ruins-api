const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const routePath = path.join(root, "public", "route-transitions.json");
const routes = JSON.parse(fs.readFileSync(routePath, "utf8"));

const errors = [];
const ids = new Set();
const allowedStatuses = new Set(["approved", "placeholder", "missing"]);

if (routes.schemaVersion !== 1) {
  errors.push("route-transitions.json must have schemaVersion 1.");
}

if (!Array.isArray(routes.routes) || routes.routes.length === 0) {
  errors.push("route-transitions.json must define a non-empty routes array.");
}

for (const route of routes.routes || []) {
  if (!route.id) errors.push("Route is missing id.");
  if (route.id && ids.has(route.id)) errors.push(`Duplicate route id: ${route.id}.`);
  if (route.id) ids.add(route.id);
  if (!route.from) errors.push(`${route.id || "unknown"} is missing from.`);
  if (!route.command) errors.push(`${route.id || "unknown"} is missing command.`);
  if (!route.to) errors.push(`${route.id || "unknown"} is missing to.`);
  if (!allowedStatuses.has(route.status)) errors.push(`${route.id || "unknown"} has invalid status ${route.status}.`);
  if (!Array.isArray(route.assetSequence)) {
    errors.push(`${route.id || "unknown"} assetSequence must be an array.`);
    continue;
  }
  if (route.status !== "missing" && route.assetSequence.length === 0) {
    errors.push(`${route.id || "unknown"} must define at least one asset for non-missing routes.`);
  }
  for (const filePath of route.assetSequence) {
    const resolved = path.join(root, "public", filePath);
    if (!resolved.startsWith(path.join(root, "public"))) {
      errors.push(`${route.id || "unknown"} points outside public/: ${filePath}.`);
      continue;
    }
    if (!fs.existsSync(resolved)) {
      errors.push(`${route.id || "unknown"} points to missing asset: public/${filePath}.`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${routes.routes.length} route transitions.`);

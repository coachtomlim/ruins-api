const fs = require("node:fs");
const path = require("node:path");
const { loadContent } = require("../src/engine");

const root = path.resolve(__dirname, "..");
const navPath = path.join(root, "public", "navigation-map.json");
const routesPath = path.join(root, "public", "route-transitions.json");
const navigationMap = JSON.parse(fs.readFileSync(navPath, "utf8"));
const routeTransitions = JSON.parse(fs.readFileSync(routesPath, "utf8"));
const content = loadContent();

const errors = [];
const validNodeIds = new Set(["prologue"]);
const routeIds = new Set((routeTransitions.routes || []).map((route) => route.id));
const nodeIds = new Set();

for (const room of content.rooms) validNodeIds.add(room.id);
for (const node of content.transitionNodes) validNodeIds.add(node.id);

if (navigationMap.schemaVersion !== 1) {
  errors.push("navigation-map.json must have schemaVersion 1.");
}

if (!Array.isArray(navigationMap.nodes) || navigationMap.nodes.length === 0) {
  errors.push("navigation-map.json must define a non-empty nodes array.");
}

if (!Array.isArray(navigationMap.edges) || navigationMap.edges.length === 0) {
  errors.push("navigation-map.json must define a non-empty edges array.");
}

for (const node of navigationMap.nodes || []) {
  if (!node.id) errors.push("Navigation node is missing id.");
  if (node.id && nodeIds.has(node.id)) errors.push(`Duplicate navigation node id: ${node.id}.`);
  if (node.id) nodeIds.add(node.id);
  if (node.id && !validNodeIds.has(node.id)) errors.push(`Navigation node references unknown content id: ${node.id}.`);
  if (!node.label) errors.push(`${node.id || "unknown"} is missing label.`);
  if (!["scene", "room", "transition"].includes(node.kind)) errors.push(`${node.id || "unknown"} has invalid kind: ${node.kind}.`);
  for (const axis of ["x", "y"]) {
    if (typeof node[axis] !== "number" || node[axis] < 0 || node[axis] > 100) {
      errors.push(`${node.id || "unknown"} has invalid ${axis} coordinate: ${node[axis]}.`);
    }
  }
}

for (const edge of navigationMap.edges || []) {
  if (!edge.from) errors.push("Navigation edge is missing from.");
  if (!edge.to) errors.push("Navigation edge is missing to.");
  if (!edge.routeId) errors.push(`Navigation edge ${edge.from || "unknown"} -> ${edge.to || "unknown"} is missing routeId.`);
  if (edge.from && !nodeIds.has(edge.from)) errors.push(`Navigation edge references unknown from node: ${edge.from}.`);
  if (edge.to && !nodeIds.has(edge.to)) errors.push(`Navigation edge references unknown to node: ${edge.to}.`);
  if (edge.routeId && !routeIds.has(edge.routeId)) errors.push(`Navigation edge references unknown route: ${edge.routeId}.`);
}

for (const route of routeTransitions.routes || []) {
  const hasEdge = (navigationMap.edges || []).some((edge) => edge.routeId === route.id);
  if (!hasEdge) errors.push(`Route transition is missing navigation edge: ${route.id}.`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${navigationMap.nodes.length} navigation nodes and ${navigationMap.edges.length} edges.`);

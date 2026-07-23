const fs = require("node:fs");
const path = require("node:path");

const openapiPath = path.resolve(__dirname, "..", "public", "openapi.yaml");
const text = fs.readFileSync(openapiPath, "utf8");
const errors = [];

const requiredSnippets = [
  "openapi: 3.1.0",
  "title: Ruins Display API",
  "/api/display-room:",
  "operationId: displayRoom",
  "name: name",
  "required: true",
  "text/markdown:",
  "\"200\":",
  "\"400\":",
  "\"404\":"
];

for (const snippet of requiredSnippets) {
  if (!text.includes(snippet)) {
    errors.push(`Missing expected OpenAPI snippet: ${snippet}`);
  }
}

const lines = text.split(/\r?\n/);
for (const [index, line] of lines.entries()) {
  if (/\t/.test(line)) {
    errors.push(`Line ${index + 1}: tabs are not allowed in YAML indentation.`);
  }
  if (/[ \t]+$/.test(line)) {
    errors.push(`Line ${index + 1}: trailing whitespace.`);
  }
}

if (!/version:\s+1\.1\.0/.test(text)) {
  errors.push("OpenAPI info.version should be 1.1.0 for the Room 1 and 400-response update.");
}

if (!/Room 1/.test(text)) {
  errors.push("OpenAPI examples should mention Room 1 now that the endpoint exposes it.");
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("OpenAPI validation passed.");

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const errors = [];
const checkableExtensions = new Set([".js", ".json", ".md", ".yaml", ".yml"]);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!checkableExtensions.has(path.extname(entry.name))) continue;

    const text = fs.readFileSync(fullPath, "utf8");
    const rel = path.relative(root, fullPath);
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (/[ \t]+$/.test(line)) {
        errors.push(`${rel}:${index + 1}: trailing whitespace`);
      }
    });

    if (!text.endsWith("\n")) {
      errors.push(`${rel}: missing final newline`);
    }
  }
}

walk(root);

for (const file of ["api/display-room.js", "scripts/lint.js", "scripts/validate-assets.js", "scripts/validate-openapi.js"]) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, file)], {
    encoding: "utf8"
  });
  if (result.status !== 0) {
    errors.push(result.stderr || result.stdout);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Lint checks passed.");

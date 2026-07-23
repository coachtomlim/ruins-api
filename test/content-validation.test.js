const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

test("content validation script passes", () => {
  const result = spawnSync(process.execPath, [path.join("scripts", "validate-content.js")], {
    cwd: path.resolve(__dirname, ".."),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Validated content: 10 rooms/);
});

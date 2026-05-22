const assert = require("node:assert/strict");
const test = require("node:test");

const gameBootstrap = require("../api/game-bootstrap");

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    }
  };
}

test("game bootstrap returns initial state and content payload", () => {
  const res = createResponse();
  gameBootstrap({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["content-type"], "application/json; charset=utf-8");

  const payload = JSON.parse(res.body);
  assert.equal(payload.initialState.location.currentRoomId, "room.01");
  assert.equal(Array.isArray(payload.content.rooms), true);
  assert.equal(Array.isArray(payload.content.commands), true);
  assert.match(payload.roomImageAssets.map, /^Map\./);
});

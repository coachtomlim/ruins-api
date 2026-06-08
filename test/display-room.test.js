const assert = require("node:assert/strict");
const test = require("node:test");

const displayRoom = require("../api/display-room");

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

function invoke(query = {}) {
  const req = {
    query,
    headers: {
      host: "ruins-api.vercel.app"
    }
  };
  const res = createResponse();
  displayRoom(req, res);
  return res;
}

test("Map returns markdown image response", () => {
  const res = invoke({ name: "Map" });

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["content-type"], "text/markdown; charset=utf-8");
  assert.match(res.body, /^!\[Map\]\(https:\/\/ruins-api\.vercel\.app\/assets\/beta\/rooms\/map-main\.webp\)/);
  assert.match(res.body, /\*\*Map\*\*/);
});

test("Room 3 returns markdown image response", () => {
  const res = invoke({ name: "Room 3" });

  assert.equal(res.statusCode, 200);
  assert.match(res.body, /^!\[Room 3\]\(https:\/\/ruins-api\.vercel\.app\/assets\/beta\/rooms\/room-03-sarcophagus-hall\.webp\)/);
  assert.match(res.body, /\*\*Room 3\*\*/);
});

test("Room 4 returns markdown image response", () => {
  const res = invoke({ name: "Room 4" });

  assert.equal(res.statusCode, 200);
  assert.match(res.body, /^!\[Room 4\]\(https:\/\/ruins-api\.vercel\.app\/assets\/beta\/rooms\/room-04-guardroom-delta\.webp\)/);
  assert.match(res.body, /\*\*Room 4\*\*/);
});

test("Room 1 is exposed because its public asset exists", () => {
  const res = invoke({ name: "Room 1" });

  assert.equal(res.statusCode, 200);
  assert.match(res.body, /^!\[Room 1\]\(https:\/\/ruins-api\.vercel\.app\/assets\/beta\/rooms\/room-01-cracked-altar\.webp\)/);
  assert.match(res.body, /\*\*Room 1\*\*/);
});

test("transition aliases continue to work", () => {
  const res = invoke({ name: "Room3to4" });

  assert.equal(res.statusCode, 200);
  assert.match(res.body, /^!\[Room3to4\]\(https:\/\/ruins-api\.vercel\.app\/assets\/beta\/transitions\/room-03-to-04\.webp\)/);
});

test("unknown room returns 404", () => {
  const res = invoke({ name: "Room 99" });

  assert.equal(res.statusCode, 404);
  assert.equal(res.body, "Not found");
});

test("missing name returns 400", () => {
  const res = invoke();

  assert.equal(res.statusCode, 400);
  assert.equal(res.body, "Missing required query parameter: name");
});

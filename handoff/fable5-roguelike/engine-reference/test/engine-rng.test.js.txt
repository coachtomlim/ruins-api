const assert = require("node:assert/strict");
const test = require("node:test");

const { createRng, hashSeed } = require("../src/engine");

test("hashSeed is deterministic", () => {
  assert.equal(hashSeed("alpha"), hashSeed("alpha"));
  assert.notEqual(hashSeed("alpha"), hashSeed("beta"));
});

test("seeded RNG produces repeatable d4 rolls", () => {
  const first = createRng({ seed: "ruins-test" });
  const second = createRng({ seed: "ruins-test" });

  const firstRolls = [first.d4(), first.d4(), first.d4(), first.d4()];
  const secondRolls = [second.d4(), second.d4(), second.d4(), second.d4()];

  assert.deepEqual(firstRolls, secondRolls);
  assert.equal(first.drawIndex, 4);
  assert.deepEqual(first.snapshot(), {
    seed: "ruins-test",
    drawIndex: 4
  });
});

test("generic dice use injectable RNG provider", () => {
  const rng = createRng({
    seed: "provider-test",
    provider: () => 0.5
  });

  assert.equal(rng.rollDie(6), 4);
  assert.equal(rng.d4(), 3);
  assert.equal(rng.drawIndex, 2);
});

test("RNG rejects invalid providers and dice", () => {
  const rng = createRng({ provider: () => 1 });

  assert.throws(() => rng.d4(), /0 <= value < 1/);
  assert.throws(() => createRng().rollDie(0), /positive integer/);
});

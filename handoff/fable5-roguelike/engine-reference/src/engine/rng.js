const UINT32_MAX_PLUS_ONE = 0x100000000;

function hashSeed(seed) {
  const text = String(seed ?? "ruins-default-seed");
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createLcg(seed) {
  let state = hashSeed(seed);

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / UINT32_MAX_PLUS_ONE;
  };
}

function createRng(options = {}) {
  const seed = options.seed ?? "ruins-default-seed";
  const nextFloat = options.provider || createLcg(seed);
  let drawIndex = Number.isInteger(options.drawIndex) ? options.drawIndex : 0;

  return {
    get seed() {
      return seed;
    },
    get drawIndex() {
      return drawIndex;
    },
    next() {
      const value = nextFloat();
      if (typeof value !== "number" || value < 0 || value >= 1) {
        throw new Error("RNG provider must return a number where 0 <= value < 1");
      }

      drawIndex += 1;
      return value;
    },
    rollDie(sides) {
      if (!Number.isInteger(sides) || sides < 1) {
        throw new Error("rollDie requires a positive integer number of sides");
      }

      return Math.floor(this.next() * sides) + 1;
    },
    d4() {
      return this.rollDie(4);
    },
    snapshot() {
      return {
        seed,
        drawIndex
      };
    }
  };
}

module.exports = {
  createRng,
  hashSeed
};

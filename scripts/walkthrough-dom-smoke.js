const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const gameBootstrap = require("../api/game-bootstrap");

const root = path.resolve(__dirname, "..");

class FakeElement {
  constructor(id) {
    this.id = id;
    this.alt = "";
    this.dataset = {};
    this.disabled = false;
    this.scrollHeight = 0;
    this.scrollTop = 0;
    this.src = "";
    this.style = {};
    this.value = "";
    this._textContent = "";
    this.listeners = new Map();
    this.classList = {
      add() {},
      remove() {}
    };
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = String(value);
    this.scrollHeight = this._textContent.length;
  }

  get innerHTML() {
    return this._textContent;
  }

  set innerHTML(value) {
    this._textContent = String(value).replace(/<[^>]*>/g, "");
    this.scrollHeight = this._textContent.length;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  click() {
    const listener = this.listeners.get("click");
    if (listener) listener({ target: this });
  }

  focus() {}
}

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

function createBootstrapResponse() {
  const res = createResponse();
  gameBootstrap({}, res);
  return {
    ok: res.statusCode >= 200 && res.statusCode < 300,
    status: res.statusCode,
    json: async () => JSON.parse(res.body)
  };
}

async function run() {
  const elements = new Map();
  const document = {
    body: { dataset: {} },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id));
      return elements.get(id);
    },
    querySelector(selector) {
      if (selector === ".scene-panel") return this.getElementById("scenePanel");
      return null;
    },
    addEventListener() {},
    querySelectorAll() {
      return [];
    }
  };

  const sandbox = {
    URL,
    console,
    document,
    fetch: async (url) => {
      if (url === "/api/game-bootstrap") return createBootstrapResponse();
      throw new Error(`Unexpected fetch: ${url}`);
    },
    localStorage: {
      values: new Map(),
      getItem(key) {
        return this.values.get(key) || null;
      },
      setItem(key, value) {
        this.values.set(key, String(value));
      }
    },
    setTimeout: (listener) => setTimeout(listener, 0),
    window: {
      __RUINS_TEST_SEED__: "ruins-beta-dom-smoke",
      requestAnimationFrame: (listener) => setTimeout(listener, 0),
      location: {
        href: "http://localhost:4273/play.html"
      }
    },
    requestAnimationFrame: (listener) => setTimeout(listener, 0)
  };

  vm.createContext(sandbox);
  const playJs = fs.readFileSync(path.join(root, "public", "play.js"), "utf8");
  vm.runInContext(playJs, sandbox, { filename: "public/play.js" });

  await new Promise((resolve) => setTimeout(resolve, 50));
  const autoButton = elements.get("autoWalkthrough");
  if (!autoButton) throw new Error("Auto Walkthrough button was not registered.");
  autoButton.click();

  const log = elements.get("log");
  const start = Date.now();
  while (!log.textContent.includes("AUTO WALKTHROUGH COMPLETE")) {
    if (log.textContent.includes("AUTO WALKTHROUGH FAILED")) {
      throw new Error("Auto walkthrough reported failure.");
    }
    if (Date.now() - start > 30000) {
      throw new Error("Timed out waiting for auto walkthrough completion.");
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  if (!log.textContent.includes("Sheja rewards you and the quest is complete.")) {
    throw new Error("Ending completion text was not reached.");
  }

  const outPath = path.join(root, "docs", "beta", "beta-1-walkthrough-dom-log.md");
  fs.writeFileSync(outPath, `# Beta 1 DOM Walkthrough Smoke Log\n\n${log.textContent}\n`, "utf8");
  console.log(`Beta 1 DOM walkthrough smoke passed: ${outPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

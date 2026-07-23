const assert = require("node:assert/strict");
const test = require("node:test");

const { createCommandRegistry, createTransitionRegistry, loadContent } = require("../src/engine");

test("content loader exposes immutable indexed content", () => {
  const content = loadContent();

  assert.equal(content.rooms.length, 10);
  assert.equal(content.items.length, 17);
  assert.equal(content.indexes.roomsById.get("room.01").name, "Cracked Altar Room");
  assert.equal(Object.isFrozen(content), true);
  assert.equal(Object.isFrozen(content.rooms[0]), true);
});

test("command registry supports lookup, list, and categorization", () => {
  const registry = createCommandRegistry(loadContent());
  const command = registry.lookupCommand("command.inventory");

  assert.equal(command.displayName, "Inventory");
  assert.equal(registry.lookupCommand("missing.command"), null);
  assert.equal(registry.listCommands().length, 14);

  const categories = registry.categorizeCommands();
  assert.equal(categories.universal.length, 10);
  assert.equal(categories.combat.length, 4);
});

test("transition registry exposes transition nodes without resolving movement", () => {
  const registry = createTransitionRegistry(loadContent());
  const transition = registry.getTransition("transition.room05.mid_passage");

  assert.equal(registry.listTransitions().length, 2);
  assert.equal(transition.id, "transition.room05.mid_passage");
  assert.deepEqual(registry.validateTransitionNode(transition), {
    valid: true,
    errors: []
  });
  assert.equal(registry.getTransition("missing.transition"), null);
});

test("transition registry reports invalid node references", () => {
  const registry = createTransitionRegistry(loadContent());
  const result = registry.validateTransitionNode({
    id: "transition.invalid",
    exits: [
      {
        targetType: "room",
        to: "room.999"
      }
    ]
  });

  assert.equal(result.valid, false);
  assert.match(result.errors[0], /unknown room/);
});

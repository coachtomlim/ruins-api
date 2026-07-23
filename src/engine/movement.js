const { loadContent } = require("./content");

function createTransitionRegistry(content = loadContent()) {
  const transitions = [...content.transitionNodes];

  return {
    validateTransitionNode(node) {
      if (!node || !node.id) {
        return {
          valid: false,
          errors: ["Transition node must have an id"]
        };
      }

      const errors = [];
      for (const exit of node.exits || []) {
        const targetType = exit.targetType || "room";
        if (targetType === "room" && !content.indexes.roomsById.has(exit.to)) {
          errors.push(`${node.id} references unknown room ${exit.to}`);
        }
        if (targetType === "transition" && !content.indexes.transitionNodesById.has(exit.to)) {
          errors.push(`${node.id} references unknown transition ${exit.to}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    },
    listTransitions() {
      return [...transitions];
    },
    getTransition(id) {
      return content.indexes.transitionNodesById.get(id) || null;
    }
  };
}

module.exports = {
  createTransitionRegistry
};

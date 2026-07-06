const { loadContent } = require("./content");

function createCommandRegistry(content = loadContent()) {
  return {
    lookupCommand(id) {
      return content.indexes.commandsById.get(id) || null;
    },
    listCommands() {
      return [...content.commands];
    },
    categorizeCommands() {
      return content.commands.reduce((categories, command) => {
        const key = command.category;
        categories[key] ||= [];
        categories[key].push(command);
        return categories;
      }, {});
    }
  };
}

module.exports = {
  createCommandRegistry
};

const manifest = require("../public/assets-manifest.json");
const { createInitialState, loadContent } = require("../src/engine");

function toImageLookup(assets) {
  const imagesByRoomId = {};
  let mapImagePath = null;

  for (const asset of assets) {
    if (asset.type === "map" && !mapImagePath) {
      mapImagePath = asset.filePath;
    }
    if (asset.roomId && asset.type === "room_image") {
      imagesByRoomId[asset.roomId] = asset.filePath;
    }
  }

  return { imagesByRoomId, mapImagePath };
}

module.exports = (_req, res) => {
  const content = loadContent();
  const initialState = createInitialState({ content, sessionId: "play-ui-session" });
  const { imagesByRoomId, mapImagePath } = toImageLookup(manifest.assets);

  const payload = {
    engineVersion: initialState.engineVersion,
    canonVariant: content.canonVariant,
    roomImageAssets: {
      map: mapImagePath,
      byRoomId: imagesByRoomId
    },
    initialState,
    content: {
      config: content.config,
      rooms: content.rooms,
      transitions: content.transitionNodes,
      monsters: content.monsters,
      items: content.items,
      journalEntries: content.journalEntries,
      commands: content.commands,
      scrolls: content.scrolls
    }
  };

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).send(JSON.stringify(payload));
};

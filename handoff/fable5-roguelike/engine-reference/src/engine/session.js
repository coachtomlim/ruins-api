function createSessionMetadata(options = {}) {
  return {
    id: options.id || "local-session",
    persistence: "none",
    runtimeConnected: false
  };
}

module.exports = {
  createSessionMetadata
};

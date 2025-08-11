// /api/display-room.js
// Returns ONLY text/markdown so the GPT can render it verbatim.

module.exports = (req, res) => {
  const name = String(req.query.name || "").trim();

  // Exact names the GPT will pass in (per Instructions)
  const FILES = {
    "Room 3": "Room 3 - Sarcophagus Hall.webp",
    "Room 4": "Room 4 - Guardroom Deltra.webp",
    "Room3to4": "Room3to4.webp",     // animated
    "Room4to3": "Room4to3.webp",     // animated
    "Map": "AdventureMap.webp"
  };

  // Which entries are animated and must always cache-bust
  const ANIMATED = new Set(["Room3to4", "Room4to3"]);

  const file = FILES[name];
  if (!file) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(404).send("Not found");
  }

  const host = `https://${req.headers.host}`;
  const isAnimated = ANIMATED.has(name);

  // Cache‑buster only on animated .webp so the GIF-style playback always restarts
  const ts = isAnimated ? `?t=${Math.floor(Date.now() / 1000)}` : "";
  const url = `${host}/${encodeURIComponent(file)}${ts}`;

  const markdown = `![${name}](${url})\n\n**${name}**`;

  // Critical: return text/markdown so the client echoes it and renders the image.
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  return res.status(200).send(markdown);
};

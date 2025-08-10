// api/display.js
module.exports = (req, res) => {
  const raw = String(req.query.name || "").trim();
  const key = raw.toLowerCase();

  // Rooms + Map
  const rooms = {
    "room 3": { file: "Room3.webp", title: "Room 3 – Sarcophagus Hall" },
    "room3":  { file: "Room3.webp", title: "Room 3 – Sarcophagus Hall" },
    "room 4": { file: "Room4.webp", title: "Room 4 – Guardroom Delta" },
    "room4":  { file: "Room4.webp", title: "Room 4 – Guardroom Delta" },
    "map":    { file: "Map.webp",   title: "Adventure Map" }
  };

  // Transitions
  const transitions = {
    "room3to4": { file: "Room3to4.webp", title: "Transition: Room 3 → Room 4" },
    "room4to3": { file: "Room4to3.webp", title: "Transition: Room 4 → Room 3" }
  };

  // Resolve name
  let entry = rooms[key] || transitions[key];
  if (!entry) {
    res.status(404).send("Not found");
    return;
  }

  const host = `https://${req.headers.host}`;
  const url = `${host}/${entry.file}`;

  const markdown = `![${entry.title}](${url})

**${entry.title}**`;

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.status(200).send(markdown);
};

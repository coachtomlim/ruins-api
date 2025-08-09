// api/display-room.js
/**
 * GET /api/display-room?name=Room%201
 * Returns: { markdown: "![Room 1](https://<host>/Room%201.png)\n\n**Room 1**" }
 */
module.exports = (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    if (!name) return res.status(400).json({ error: "Missing ?name" });

    // Expect "Room 1", "room 1", etc.
    const m = name.toLowerCase().match(/^room\s*(\d{1,2})$/);
    if (!m) return res.status(404).json({ error: `Unknown room: ${name}` });

    const n = m[1]; // "1"
    const host = `https://${req.headers.host}`;
    // Your filenames in /public are exactly "Room 1.png", "Room 2.png", ...
    const file = `Room%20${n}.png`; // URL-encoded space

    const title = `Room ${n}`;
    const markdown = `![${title}](${host}/${file})

**${title}**`;

    res.status(200).json({ markdown });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
};

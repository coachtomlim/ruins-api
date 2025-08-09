// GET /api/display-room?name=Room%201
module.exports = (req, res) => {
  const name = String(req.query.name || "").trim();
  const m = name.toLowerCase().match(/^room\s*(\d{1,2})$/);
  if (!m) return res.status(404).send("Not found");

  const n = m[1];
  const host = `https://${req.headers.host}`;
  const file = `Room%20${n}.png`; // matches "Room 1.png", etc.
  const title = `Room ${n}`;

  const markdown =
`![${title}](${host}/${file})

**${title}**`;

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.status(200).send(markdown);
};

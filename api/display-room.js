// api/display-room.js
module.exports = (req, res) => {
  const name = String(req.query.name || "").trim();

  // Map the exact images you have in /public
  const FILES = {
    "Room 3": "Room3.webp",
    "Room 4": "Room4.webp",
    "Room3to4": "Room3to4.webp",
    "Room4to3": "Room4to3.webp",
    "Map": "Map.webp",
  };

  if (!FILES[name]) return res.status(404).send("Not found");

  const host = `https://${req.headers.host}`;
  const markdown = `![${name}](${host}/${encodeURIComponent(FILES[name])})\n\n**${name}**`;

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.status(200).send(markdown);
};

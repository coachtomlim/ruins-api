export default function handler(req, res) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).send("Missing 'name' query parameter");
  }

  const baseUrl = "https://ruins-api.vercel.app";

  // Mapping for special filenames
  const imageMap = {
    "Room3to4": `${baseUrl}/Room3to4.webp`,
    "Room4to3": `${baseUrl}/Room4to3.webp`,
    "Map": `${baseUrl}/Map.webp`,
    "Room 3 - Sarcophagus Hall": `${baseUrl}/Room%203%20-%20Sarcophagus%20Hall.webp`,
    "Room 4 - Guardroom Delta": `${baseUrl}/Room%204%20-%20Guardroom%20Delta.webp`
  };

  // Try direct map first
  let imageUrl = imageMap[name];

  // If not found in map, fall back to standard Room X naming
  if (!imageUrl) {
    const match = name.toLowerCase().match(/^room\s*(\d{1,2})$/);
    if (match) {
      const num = match[1];
      imageUrl = `${baseUrl}/Room%20${num}.png`;
    }
  }

  if (!imageUrl) {
    return res.status(404).send("Not found");
  }

  // Markdown output
  const markdown = `![${name}](${imageUrl})\n\n**${name}**`;

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.status(200).send(markdown);
}

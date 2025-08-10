export default function handler(req, res) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).send("Missing 'name' query parameter");
  }

  // Encode spaces for URLs
  const encodedName = encodeURIComponent(name);

  // Image base URL
  const baseUrl = "https://ruins-api.vercel.app";

  // Map request to file name
  const imageMap = {
    "Room 3": `${baseUrl}/Room%203.webp`,
    "Room 4": `${baseUrl}/Room%204.webp`,
    "Room3to4": `${baseUrl}/Room3to4.webp`,
    "Room4to3": `${baseUrl}/Room4to3.webp`,
    "Map": `${baseUrl}/Map.webp`
  };

  const imageUrl = imageMap[name];

  if (!imageUrl) {
    return res.status(404).send("Not found");
  }

  // Markdown output
  const markdown = `![${name}](${imageUrl})\n\n**${name}**`;

  res.setHeader("Content-Type", "text/markdown");
  res.status(200).send(markdown);
}

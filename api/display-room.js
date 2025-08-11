export default function handler(req, res) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).send("Missing 'name' query parameter.");
  }

  // Encode name for use in URL
  const encodedName = encodeURIComponent(name);

  // Generate cache-busting timestamp
  const timestamp = Date.now();

  // Construct image URL with cache-buster
  const imageUrl = `https://ruins-api.vercel.app/${encodedName}.webp?t=${timestamp}`;

  // Return markdown with image URL
  const markdown = `![${name}](${imageUrl})`;

  // Example: ![Room 3](https://ruins-api.vercel.app/Room%203.webp?t=1691234567890)
  res.setHeader("Content-Type", "text/markdown");
  return res.status(200).send(markdown);
}

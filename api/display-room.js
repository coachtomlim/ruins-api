const manifest = require("../public/assets-manifest.json");

const assetsByName = new Map();

for (const asset of manifest.assets) {
  const names = [asset.displayName, ...(asset.aliases || [])];
  for (const name of names) {
    assetsByName.set(String(name).trim().toLowerCase(), asset);
  }
}

module.exports = (req, res) => {
  const name = String(req.query.name || "").trim();

  if (!name) {
    return res.status(400).send("Missing required query parameter: name");
  }

  const asset = assetsByName.get(name.toLowerCase());

  if (!asset) return res.status(404).send("Not found");

  const host = `https://${req.headers.host}`;
  const markdown = `![${asset.displayName}](${host}/${encodeURIComponent(asset.filePath)})\n\n**${asset.displayName}**`;

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.status(200).send(markdown);
};

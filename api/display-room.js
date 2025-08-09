// api/display-room.js
export default function handler(req, res) {
  // Only allow GET
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // --- Room data map ---
  const rooms = {
    "1": {
      title: "Room 1 - Cracked Altar Room",
      image_url:
        "https://dl.dropboxusercontent.com/scl/fi/p162jg4bpvj0af8go0rco/Room-1.png?rlkey=8gr04gvzy87wxq1p35jfzezg8",
      narration:
        "You step into a large square chamber. A cracked altar squats in the center, its surface split like old bone."
    },

    // Example placeholder (fill when you have the link)
    // "3": {
    //   title: "Room 3 - Sarcophagus Hall",
    //   image_url: "https://YOUR-DIRECT-LINK/Room-3.png",
    //   narration:
    //     "Moonlight cuts through the cracked ceiling, spilling across a stone sarcophagus whose lid lies slightly ajar."
    // }
  };

  // Accept `?room=1` or `?room=Room 1` (case-insensitive)
  const raw = String(req.query.room || "").trim().toLowerCase();
  let key = raw;
  const m = raw.match(/^room\s*(\d+)$/i);
  if (m) key = m[1]; // normalize "room 1" -> "1"

  if (!key) {
    return res.status(400).json({ error: "Missing query parameter: room" });
  }
  const data = rooms[key];
  if (!data) {
    return res.status(404).json({ error: `Room not found: ${req.query.room}` });
  }

  // Return JSON (Custom GPT will render image via markdown using image_url)
  return res.status(200).json(data);
}

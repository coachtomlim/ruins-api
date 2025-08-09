export default function handler(req, res) {
  const rooms = {
    "1": {
      title: "Room 1 - Cracked Altar Room",
      image_url: "https://dl.dropboxusercontent.com/scl/fi/p162jg4bpvj0af8go0rco/Room-1.png?rlkey=8gr04gvzy87wxq1p35jfzezg8",
      narration: "You step into a large square chamber. A cracked altar squats in the center..."
    }
    // You can add more rooms here later
  };

  const room = req.query.room;
  if (!room || !rooms[room]) {
    return res.status(404).json({ error: "Room not found" });
  }

  res.status(200).json(rooms[room]);
}

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

let events = [];
const BUFFER_MINUTES = 0; // optional gap time between events

// ✅ Helper function to check time overlap
function isOverlapping(start1, end1, start2, end2) {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  return s1 < e2 && e1 > s2;
}


app.post("/check-conflicts", (req, res) => {
  const { startTime, endTime, participants } = req.body;

 
  const newParticipants = Array.isArray(participants) ? participants : [participants || 'default'];
  
  console.log("🔍 Incoming event:", { startTime, endTime, newParticipants });

  let conflicts = [];

  for (const event of events) {
    const hasCommon = event.participants.some(p => newParticipants.includes(p));
    if (hasCommon && isOverlapping(startTime, endTime, event.startTime, event.endTime)) {
      conflicts.push(event);
    }
  }

  if (conflicts.length > 0) {
    return res.json({
      conflict: true,
      message: "Conflict found for this user!",
      conflicts,
    });
  }

  events.push({ startTime, endTime, participants: newParticipants });
  return res.json({
    conflict: false,
    message: "Event added successfully!",
  });
});



app.post("/suggest-times", (req, res) => {
  const { startTime, endTime } = req.body;

  const start = new Date(startTime);
  const end = new Date(endTime);
  const suggestions = [];

  for (let i = 1; i <= 3; i++) {
    const newStart = new Date(start);
    const newEnd = new Date(end);
    newStart.setMinutes(start.getMinutes() + i * 30);
    newEnd.setMinutes(end.getMinutes() + i * 30);
    suggestions.push({
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
    });
  }

  console.log("💡 Suggested alternate times:", suggestions);
  res.json({ suggestions });
});

app.listen(3000, () => console.log("✅ Backend running on port 3000"));

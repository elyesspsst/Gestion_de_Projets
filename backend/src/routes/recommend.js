// routes/recommend.js
const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/authMiddleware");

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

const { Skill } = require("../models/association"); // ADAPT path if needed

const AI_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

// Skill names come from the DB (same source as the Python service),
// cached for 60 seconds.
let skillCache = { names: null, at: 0 };
async function getSkillNames() {
  if (!skillCache.names || Date.now() - skillCache.at > 60000) {
    const rows = await Skill.findAll({ attributes: ["name"] });
    skillCache = { names: new Set(rows.map((r) => r.name)), at: Date.now() };
  }
  return skillCache.names;
}

async function callAI(path, payload, res) {
  let r;
  try {
    r = await fetch(`${AI_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // first call can be slow while Ollama loads the model
      signal: AbortSignal.timeout(120000),
    });
  } catch (err) {
    console.error("AI service request failed:", err);
    const timedOut = err.name === "TimeoutError" || err.name === "AbortError";
    return res.status(timedOut ? 504 : 503).json({
      error: timedOut ? "AI service timed out" : "AI service unavailable",
    });
  }

  let data;
  try {
    data = await r.json();
  } catch (err) {
    console.error("AI service returned non-JSON (status %d):", r.status, err);
    return res.status(502).json({ error: "Invalid response from AI service" });
  }
  res.status(r.status).json(data);
}

router.use(authenticate, requireRole("PROJECT_MANAGER", "ADMIN"));

// Step 1: free text -> detected skills
router.post("/analyze", (req, res) => {
  const text = (req.body.text || "").toString().trim();
  if (!text || text.length > 1000) {
    return res.status(400).json({ error: "text must be 1-1000 characters" });
  }
  callAI("/analyze", { text }, res);
});

// Step 2: confirmed skills -> ranked employees
router.post("/", async (req, res) => {
  try {
    const reqs = req.body.requirements;
    const skills = await getSkillNames();
    const valid =
      reqs &&
      typeof reqs === "object" &&
      !Array.isArray(reqs) &&
      Object.keys(reqs).length > 0 &&
      Object.entries(reqs).every(
        ([s, l]) => skills.has(s) && Number.isInteger(l) && l >= 1 && l <= 5,
      );
    if (!valid) return res.status(400).json({ error: "invalid requirements" });
    callAI("/recommend", { requirements: reqs }, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal error" });
  }
});

module.exports = router;
// in app.js:  app.use("/api/recommend", require("./routes/recommend"));

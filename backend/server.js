import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { runDebate } from "./engine/debateOrchestrator.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- CORS ---
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
}));

app.use(express.json());

// --- TRUST PROXY (for Railway/Render) ---
app.set("trust proxy", 1);

// --- RATE LIMITING: 3 debates per hour per IP ---
const debateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: "Rate limit reached. You can run 3 debates per hour.",
    retryAfter: "Try again in about an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- GLOBAL DAILY CAP ---
let dailyDebateCount = 0;
const DAILY_MAX = parseInt(process.env.DAILY_DEBATE_LIMIT || "100");

setInterval(() => {
  dailyDebateCount = 0;
  console.log("🔄 Daily debate counter reset");
}, 24 * 60 * 60 * 1000);

// --- INPUT VALIDATION ---
function validateInput(req, res, next) {
  const { decision, context } = req.body;

  if (!decision || typeof decision !== "string") {
    return res.status(400).json({ error: "Decision is required." });
  }

  const cleanDecision = decision.replace(/<[^>]*>/g, "").trim();
  const cleanContext = (context || "").replace(/<[^>]*>/g, "").trim();

  if (cleanDecision.length < 20) {
    return res.status(400).json({ error: "Decision must be at least 20 characters. Be specific!" });
  }
  if (cleanDecision.length > 500) {
    return res.status(400).json({ error: "Decision must be under 500 characters." });
  }
  if (cleanContext.length > 300) {
    return res.status(400).json({ error: "Context must be under 300 characters." });
  }

  req.cleanInput = { decision: cleanDecision, context: cleanContext };
  next();
}

// --- HEALTH ---
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    debatesToday: dailyDebateCount,
    dailyLimit: DAILY_MAX,
    remaining: DAILY_MAX - dailyDebateCount,
  });
});

// --- DEBATE (SSE) ---
app.post("/api/debate", debateLimiter, validateInput, async (req, res) => {
  if (dailyDebateCount >= DAILY_MAX) {
    return res.status(503).json({
      error: "The War Room is at capacity today. Come back tomorrow!",
      debatesToday: dailyDebateCount,
    });
  }

  dailyDebateCount++;
  console.log(`\n🎖️ Debate #${dailyDebateCount} started`);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });

  let aborted = false;
  req.on("close", () => {
    aborted = true;
    console.log("Client disconnected, aborting debate");
  });

  const { decision, context } = req.cleanInput;

  try {
    for await (const event of runDebate(decision, context)) {
      if (aborted) break;
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (res.flush) res.flush();
    }
    if (!aborted) {
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    }
  } catch (error) {
    console.error("Debate error:", error.message);
    if (!aborted) {
      res.write(`data: ${JSON.stringify({ type: "error", message: "An error occurred. Please try again." })}\n\n`);
    }
  } finally {
    if (!aborted) res.end();
  }
});

app.listen(PORT, () => {
  console.log(`\n🎖️ AI Career War Room backend running on port ${PORT}`);
  console.log(`   Daily debate limit: ${DAILY_MAX}`);
  console.log(`   Rate limit: 3 per hour per IP`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

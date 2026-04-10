import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import cors from "cors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// CORS: restrict to the app's own origin; prevents third-party sites from
// calling the API on behalf of a user's browser session.
const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:5173";
app.use(cors({
  origin: allowedOrigin,
  methods: ["POST"],
  allowedHeaders: ["Content-Type", "X-App-Token"],
}));

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // 10 requests per IP per minute
  message: { error: { message: "Too many requests, please slow down." } },
});

// Allowlists — must stay in sync with the frontend constants in FashionTrendTagger.jsx
const ALLOWED_CATEGORIES = new Set([
  "All", "Streetwear", "Luxury", "Y2K", "Minimalist",
  "Coastal", "Gorpcore", "Dark Academia", "Cottagecore",
]);
const ALLOWED_SEASONS = new Set([
  "Spring/Summer 2025", "Fall/Winter 2025", "Resort 2026", "Spring/Summer 2026",
]);
const ALLOWED_REGIONS = new Set([
  "Global", "North America", "Europe", "Asia-Pacific", "South America",
]);

function buildPrompt(category, season, region) {
  return `You are a fashion trend analyst with access to current runway reports, street style coverage, and social media data.

Search the web for the LATEST fashion trends for: ${category === "All" ? "all fashion categories" : category} | Season: ${season} | Region: ${region}

Then return ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "summary": "2-3 sentence overview of the dominant aesthetic direction",
  "trendNames": [
    { "name": "Quiet Luxury", "description": "Understated, high-quality basics" },
    ...up to 8 trend names
  ],
  "tags": [
    { "tag": "quietluxury", "score": 98 },
    { "tag": "oldmoney", "score": 95 },
    ...up to 30 tags, sorted by trend score 1-100, no spaces, no #, lowercase with camelCase allowed
  ]
}

Use REAL, CURRENT trend names and tags sourced from what you find on the web. Prioritize tags that are actually being used on Instagram, TikTok, and fashion editorial. Include a mix of macro trends, micro aesthetics, key item names, and style adjectives.`;
}

app.post("/api/claude", limiter, async (req, res) => {
  // Optional shared secret — provides a lightweight barrier against casual script
  // abuse. Note: if APP_SECRET is exposed to the frontend via VITE_APP_SECRET it
  // will appear in the client bundle; rely primarily on rate limiting + input
  // validation for production hardening, or add server-side session auth.
  const appSecret = process.env.APP_SECRET;
  if (appSecret && req.headers["x-app-token"] !== appSecret) {
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }

  // Only read ANTHROPIC_API_KEY — never the VITE_ variant, which would be
  // inlined into the client bundle by Vite and exposed to end users.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: "ANTHROPIC_API_KEY is not set" } });
  }

  const { category, season, region } = req.body;

  // Validate all inputs against server-side allowlists before constructing
  // the prompt. The model, max_tokens, and tools are hardcoded server-side so
  // clients cannot influence them.
  if (
    !ALLOWED_CATEGORIES.has(category) ||
    !ALLOWED_SEASONS.has(season) ||
    !ALLOWED_REGIONS.has(region)
  ) {
    return res.status(400).json({ error: { message: "Invalid parameters" } });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: buildPrompt(category, season, region) }],
      }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// Serve the built React app
app.use(express.static(path.join(__dirname, "dist")));
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

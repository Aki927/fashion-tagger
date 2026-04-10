# Fashion Trend Tagger

An AI-powered tool that searches the web in real time to surface current fashion trend names and ranked hashtags — filtered by category, season, and region.

Built with React + Vite on the frontend and an Express API server on the backend. Claude (via the Anthropic API) performs live web searches to generate results grounded in current runway reports, street style coverage, and social media data.

## What it does

Select a fashion category, season, and region, then click **Generate Trends**. Claude searches the web and returns:

- **Summary** — a 2–3 sentence overview of the dominant aesthetic direction
- **Trend Names** — up to 8 named micro-aesthetics or macro trends with descriptions
- **Ranked Hashtags** — up to 30 hashtags scored by trend velocity (100 = peak), sourced from Instagram, TikTok, and fashion editorial

Click any hashtag pill to copy it, or use **Copy all tags** to copy the full set for bulk pasting into a caption or scheduling tool.

## Filters

| Filter | Options |
|---|---|
| Category | All, Streetwear, Luxury, Y2K, Minimalist, Coastal, Gorpcore, Dark Academia, Cottagecore |
| Season | Spring/Summer 2025, Fall/Winter 2025, Resort 2026, Spring/Summer 2026 |
| Region | Global, North America, Europe, Asia-Pacific, South America |

## Setup

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/) with access to `claude-sonnet-4-6` and the `web_search` tool

### Install

```bash
git clone <repo-url>
cd fashion-tagger
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
ANTHROPIC_API_KEY=your_api_key_here

# Optional: restrict CORS to a specific origin (defaults to http://localhost:5173)
ALLOWED_ORIGIN=http://localhost:5173

# Optional: shared secret for a lightweight auth check (X-App-Token header)
# Note: if set, also add VITE_APP_SECRET=same_value so the frontend sends it
APP_SECRET=
VITE_APP_SECRET=
```

> **Never commit `.env` to version control.** The API key is kept server-side only and is never exposed to the browser bundle.

### Development

Run the Vite dev server and the API server in separate terminals:

```bash
# Terminal 1 — frontend (http://localhost:5173)
npm run dev

# Terminal 2 — API server (http://localhost:3030)
npm run server
```

### Production

Build the frontend, then serve everything from the Express server:

```bash
npm run build
npm start
```

The server serves the built React app from `dist/` and handles API requests at `/api/claude`. Default port is `3030` (override with `PORT` env var).

## Rate limiting

The API endpoint is rate-limited to **10 requests per IP per minute** to prevent abuse.

## Tech stack

- **Frontend** — React 19, Vite, DM Sans + Playfair Display (Google Fonts)
- **Backend** — Express 5, CORS, express-rate-limit
- **AI** — Anthropic Claude (`claude-sonnet-4-6`) with web search tool
- **Linting** — ESLint 9 (flat config), eslint-plugin-react-hooks, Prettier

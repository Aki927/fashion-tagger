import { useState, useCallback } from "react";

const CATEGORIES = ["All", "Streetwear", "Luxury", "Y2K", "Minimalist", "Coastal", "Gorpcore", "Dark Academia", "Cottagecore"];
const SEASONS = ["Spring/Summer 2025", "Fall/Winter 2025", "Resort 2026", "Spring/Summer 2026"];
const REGIONS = ["Global", "North America", "Europe", "Asia-Pacific", "South America"];

const TAG_COLORS = [
  { bg: "#f0e6ff", text: "#6b21a8", border: "#d8b4fe" },
  { bg: "#fce7f3", text: "#9d174d", border: "#fbcfe8" },
  { bg: "#e0f2fe", text: "#0c4a6e", border: "#bae6fd" },
  { bg: "#dcfce7", text: "#14532d", border: "#bbf7d0" },
  { bg: "#fff7ed", text: "#7c2d12", border: "#fed7aa" },
  { bg: "#f1f5f9", text: "#1e293b", border: "#cbd5e1" },
  { bg: "#fef9c3", text: "#713f12", border: "#fde68a" },
  { bg: "#ffe4e6", text: "#881337", border: "#fecdd3" },
];

function TagPill({ tag, score, index, onCopy }) {
  const color = TAG_COLORS[index % TAG_COLORS.length];
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    onCopy(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      onClick={handleClick}
      title="Click to copy"
      style={{
        background: color.bg,
        color: color.text,
        border: `1.5px solid ${color.border}`,
        borderRadius: "999px",
        padding: "6px 14px",
        fontSize: "13px",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        transition: "all 0.15s ease",
        transform: copied ? "scale(0.95)" : "scale(1)",
        opacity: 1,
        letterSpacing: "0.01em",
      }}
    >
      #{tag}
      {score !== undefined && (
        <span style={{
          background: color.border,
          color: color.text,
          borderRadius: "999px",
          padding: "1px 7px",
          fontSize: "11px",
          fontWeight: 700,
          opacity: 0.85,
        }}>
          {score}
        </span>
      )}
      {copied && <span style={{ fontSize: "11px" }}>✓</span>}
    </button>
  );
}

function CopyAllButton({ tags, onCopy }) {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    const allTags = tags.map(t => `#${t.tag}`).join(" ");
    onCopy(allTags);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleClick}
      style={{
        background: copied ? "#1a1a2e" : "#f8f8f8",
        color: copied ? "#fff" : "#1a1a2e",
        border: "1.5px solid #1a1a2e",
        borderRadius: "8px",
        padding: "8px 18px",
        fontSize: "13px",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        letterSpacing: "0.03em",
      }}
    >
      {copied ? "✓ Copied all!" : "Copy all tags"}
    </button>
  );
}

export default function FashionTrendTagger() {
  const [category, setCategory] = useState("All");
  const [season, setSeason] = useState("Spring/Summer 2026");
  const [region, setRegion] = useState("Global");
  const [tags, setTags] = useState([]);
  const [trendNames, setTrendNames] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clipboardMsg, setClipboardMsg] = useState("");

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setClipboardMsg(`Copied: ${text.slice(0, 40)}${text.length > 40 ? "…" : ""}`);
      setTimeout(() => setClipboardMsg(""), 2000);
    });
  };

  // Extracts the outermost JSON object from a string by tracking brace depth,
  // avoiding the greedy-regex trap where {[\s\S]*} consumes too much content.
  const extractJSON = (text) => {
    const start = text.indexOf("{");
    if (start === -1) return null;
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) return text.slice(start, i + 1);
      }
    }
    return null;
  };

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    setError("");
    setTags([]);
    setTrendNames([]);
    setSummary("");

    try {
      const headers = { "Content-Type": "application/json" };
      const appToken = import.meta.env.VITE_APP_SECRET;
      if (appToken) headers["X-App-Token"] = appToken;

      const res = await fetch("/api/claude", {
        method: "POST",
        headers,
        // Only send validated params — the server constructs the prompt and
        // controls the model, max_tokens, and tools.
        body: JSON.stringify({ category, season, region }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `API error ${res.status}`);
      }

      // Extract the final text response from content blocks
      const textBlocks = (data.content || []).filter(b => b.type === "text");
      const rawText = textBlocks.map(b => b.text).join("");

      const jsonStr = extractJSON(rawText);
      if (!jsonStr) throw new Error("No JSON found in response");

      const parsed = JSON.parse(jsonStr);
      setSummary(parsed.summary || "");
      setTrendNames(parsed.trendNames || []);
      setTags(parsed.tags || []);
    } catch (e) {
      setError("Failed to fetch trends. Please try again. " + e.message);
    } finally {
      setLoading(false);
    }
  }, [category, season, region]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fafaf8",
      fontFamily: "'DM Sans', sans-serif",
      padding: "0",
    }}>
      {/* Google Font Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Playfair+Display:ital,wght@0,700;1,500&display=swap');

        * { box-sizing: border-box; }

        .filter-btn {
          background: #fff;
          border: 1.5px solid #e2e2e2;
          border-radius: 999px;
          padding: 6px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #555;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .filter-btn:hover { border-color: #1a1a2e; color: #1a1a2e; }
        .filter-btn.active {
          background: #1a1a2e;
          border-color: #1a1a2e;
          color: #fff;
        }

        select.filter-select {
          background: #fff;
          border: 1.5px solid #e2e2e2;
          border-radius: 8px;
          padding: 8px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #333;
          cursor: pointer;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 32px;
          min-width: 180px;
        }
        select.filter-select:focus { border-color: #1a1a2e; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease forwards; }

        .trend-card {
          background: #fff;
          border: 1.5px solid #ebebeb;
          border-radius: 12px;
          padding: 14px 18px;
          transition: border-color 0.15s;
        }
        .trend-card:hover { border-color: #bbb; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "#1a1a2e",
        padding: "40px 32px 32px",
        borderBottom: "1px solid #2a2a4e",
      }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <p style={{
            color: "#a78bfa",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            margin: "0 0 10px",
          }}>
            AI-Powered · Web Search Grounded
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            color: "#fff",
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 700,
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}>
            Fashion Trend Tagger
          </h1>
          <p style={{
            color: "#94a3b8",
            fontSize: "15px",
            margin: 0,
            fontWeight: 400,
            maxWidth: "520px",
            lineHeight: 1.6,
          }}>
            Claude searches the web in real time to surface current trend names and ranked hashtags by category, season, and region.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #ebebeb",
        padding: "20px 32px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          {/* Category pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`filter-btn ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Season + Region selects + Generate */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            <select className="filter-select" value={season} onChange={e => setSeason(e.target.value)}>
              {SEASONS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={region} onChange={e => setRegion(e.target.value)}>
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
            <button
              onClick={fetchTrends}
              disabled={loading}
              style={{
                background: loading ? "#e2e8f0" : "#1a1a2e",
                color: loading ? "#94a3b8" : "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "9px 22px",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
                letterSpacing: "0.02em",
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: "14px", height: "14px",
                    border: "2px solid #94a3b8",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  Searching web…
                </>
              ) : "↗ Generate Trends"}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "28px 32px 60px" }}>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fff1f2",
            border: "1.5px solid #fecdd3",
            borderRadius: "10px",
            padding: "14px 18px",
            color: "#be123c",
            fontSize: "14px",
            marginBottom: "24px",
          }}>
            {error}
          </div>
        )}

        {/* Clipboard toast */}
        {clipboardMsg && (
          <div style={{
            position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
            background: "#1a1a2e", color: "#fff",
            padding: "10px 20px", borderRadius: "999px",
            fontSize: "13px", fontWeight: 500,
            zIndex: 100, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}>
            {clipboardMsg}
          </div>
        )}

        {/* Empty state */}
        {!loading && tags.length === 0 && !error && (
          <div style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "#94a3b8",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✦</div>
            <p style={{ fontSize: "16px", fontWeight: 500, color: "#64748b", marginBottom: "8px" }}>
              Select your filters and generate
            </p>
            <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
              Claude will search the web for current fashion trend data
            </p>
          </div>
        )}

        {/* Results */}
        {(summary || trendNames.length > 0 || tags.length > 0) && (
          <div className="fade-in">

            {/* Summary */}
            {summary && (
              <div style={{
                background: "#f8f5ff",
                border: "1.5px solid #e9d5ff",
                borderRadius: "12px",
                padding: "18px 22px",
                marginBottom: "28px",
              }}>
                <p style={{
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "#4c1d95",
                  fontStyle: "italic",
                }}>
                  {summary}
                </p>
                <p style={{
                  margin: "10px 0 0",
                  fontSize: "11px",
                  color: "#7c3aed",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  {category} · {season} · {region}
                </p>
              </div>
            )}

            {/* Trend Names */}
            {trendNames.length > 0 && (
              <div style={{ marginBottom: "28px" }}>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#1a1a2e",
                  margin: "0 0 14px",
                  letterSpacing: "-0.01em",
                }}>
                  Trend Names
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                  {trendNames.map((t, i) => (
                    <div key={i} className="trend-card">
                      <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "14px", color: "#1a1a2e" }}>
                        {t.name}
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                        {t.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
                  <h2 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#1a1a2e",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}>
                    Ranked Hashtags
                  </h2>
                  <CopyAllButton tags={tags} onCopy={copyToClipboard} />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {tags.map((t, i) => (
                    <TagPill
                      key={t.tag}
                      tag={t.tag}
                      score={t.score}
                      index={i}
                      onCopy={copyToClipboard}
                    />
                  ))}
                </div>
                <p style={{ marginTop: "14px", fontSize: "12px", color: "#94a3b8" }}>
                  Score = estimated trend velocity (100 = peak). Click any tag to copy · "Copy all" for bulk paste.
                </p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

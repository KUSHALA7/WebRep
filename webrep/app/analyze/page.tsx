"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Strength = { label: string; detail: string };
type Gap = { label: string; detail: string; severity: "high" | "medium" | "low" };

type AnalysisResult = {
  title: string;
  industry: string;
  summary: string;
  score: number | null;
  scoreBreakdown: {
    cta: number;
    socialProof: number;
    clarity: number;
    contact: number;
    trust: number;
    seo: number;
  } | null;
  strengths: Strength[];
  gaps: Gap[];
};

const severityStyle: Record<string, string> = {
  high:   "color:#f87171;border-color:rgba(239,68,68,0.35);background:rgba(239,68,68,0.08)",
  medium: "color:#fbbf24;border-color:rgba(245,158,11,0.35);background:rgba(245,158,11,0.08)",
  low:    "color:#38bdf8;border-color:rgba(14,165,233,0.35);background:rgba(14,165,233,0.08)",
};

const scoreColor = (s: number) =>
  s >= 70 ? "#10b981" : s >= 45 ? "#f59e0b" : "#f43f5e";

const scoreLabel = (s: number) =>
  s >= 70 ? "Good" : s >= 45 ? "Needs Work" : "Critical";

const breakdownLabels: Record<string, string> = {
  cta: "CTA",
  socialProof: "Social Proof",
  clarity: "Clarity",
  contact: "Contact",
  trust: "Trust",
  seo: "SEO",
};

const breakdownMax: Record<string, number> = {
  cta: 15, socialProof: 20, clarity: 20, contact: 15, trust: 15, seo: 15,
};

const barColor = (pct: number) =>
  pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#f43f5e";

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data: AnalysisResult & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze website");
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch or analyze the website.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Website Analyzer</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Paste any business URL. WebRep audits it across 6 dimensions and surfaces specific, actionable improvements.
        </p>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          placeholder="https://example.com"
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
          style={{
            background: "var(--input-bg)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        />
        <button
          onClick={handleAnalyze}
          disabled={!url || loading}
          className="shrink-0 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200"
          style={{
            background: !url || loading ? "var(--surface-3)" : "var(--accent-indigo)",
            boxShadow: !url || loading ? "none" : "0 0 24px rgba(99,102,241,0.4)",
          }}
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-8 text-center text-sm"
          style={{ border: "1px solid var(--border-default)", background: "var(--card-bg)", color: "var(--text-secondary)" }}
        >
          <div className="flex justify-center gap-1.5 mb-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: "var(--accent-indigo)", animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          Fetching and auditing the website…
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && !result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ border: "1px solid var(--border-default)", background: "var(--card-bg)" }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>What this audits</p>
          <ul className="space-y-1.5" style={{ color: "var(--text-secondary)" }}>
            {["CTA presence and effectiveness", "Social proof (testimonials, logos, reviews)", "Value proposition clarity", "Contact info and trust signals", "SEO basics (headings, descriptions)", "Pricing transparency and FAQ coverage"].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs">
                <span style={{ color: "var(--accent-indigo)" }}>›</span> {item}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Score + summary row */}
          <div className="grid gap-4 md:grid-cols-[140px,1fr]">
            {result.score !== null && (
              <div
                className="flex flex-col items-center justify-center rounded-2xl p-5 gap-0.5"
                style={{ border: "1px solid var(--border-default)", background: "var(--card-bg)" }}
              >
                <span className="text-5xl font-bold tabular-nums" style={{ color: scoreColor(result.score) }}>
                  {result.score}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>/ 100</span>
                <span className="text-xs font-semibold mt-1" style={{ color: scoreColor(result.score) }}>
                  {scoreLabel(result.score)}
                </span>
              </div>
            )}
            <div
              className="rounded-2xl p-4"
              style={{
                border: "1px solid rgba(16,185,129,0.25)",
                background: "rgba(16,185,129,0.05)",
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--accent-emerald)" }}>
                  Analysis complete
                </span>
                <span
                  className="text-[10px] rounded-full px-2 py-0.5 border"
                  style={{ color: "var(--text-muted)", borderColor: "var(--border-default)" }}
                >
                  {result.industry}
                </span>
              </div>
              <h2 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>{result.title}</h2>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{result.summary}</p>
            </div>
          </div>

          {/* Score breakdown */}
          {result.scoreBreakdown && (
            <div
              className="rounded-2xl p-5"
              style={{ border: "1px solid var(--border-default)", background: "var(--card-bg)" }}
            >
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Score breakdown</p>
              <div className="grid gap-2.5">
                {Object.entries(result.scoreBreakdown).map(([key, val]) => {
                  const max = breakdownMax[key] ?? 20;
                  const pct = Math.round((val / max) * 100);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-[11px] w-24 shrink-0" style={{ color: "var(--text-secondary)" }}>
                        {breakdownLabels[key]}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                          className="h-full rounded-full"
                          style={{ background: barColor(pct) }}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums w-10 text-right" style={{ color: "var(--text-muted)" }}>
                        {val}/{max}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strengths + Gaps */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border-default)", background: "var(--card-bg)" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--accent-emerald)" }}>Strengths</p>
              <ul className="space-y-3">
                {result.strengths.map((s, i) => (
                  <li key={i}>
                    <span className="text-xs font-semibold block" style={{ color: "var(--text-primary)" }}>{s.label}</span>
                    <span className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-4" style={{ border: "1px solid var(--border-default)", background: "var(--card-bg)" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--accent-rose)" }}>Gaps to fix</p>
              <ul className="space-y-3">
                {result.gaps.map((g, i) => (
                  <li key={i}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{g.label}</span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5"
                        style={Object.fromEntries(severityStyle[g.severity].split(";").map(s => s.split(":")))}
                      >
                        {g.severity}
                      </span>
                    </div>
                    <span className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{g.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <a
            href={`/proposal?url=${encodeURIComponent(url)}`}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px"
            style={{ background: "var(--accent-indigo)", boxShadow: "0 0 24px rgba(99,102,241,0.4)" }}
          >
            Generate full proposal →
          </a>
        </motion.div>
      )}
    </div>
  );
}

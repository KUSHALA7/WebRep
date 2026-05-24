"use client";

import { motion, type Transition } from "framer-motion";
import Link from "next/link";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.55, ease: "easeOut" } as Transition,
});

const features = [
  {
    icon: "⚡",
    title: "Instant Audit",
    desc: "Paste any URL. WebRep fetches, parses, and scores the site across 6 dimensions in seconds.",
  },
  {
    icon: "📄",
    title: "AI Proposal",
    desc: "A real LLM-written proposal — not templates. Specific to the business, their gaps, and their goals.",
  },
  {
    icon: "🤖",
    title: "Live AI Agent",
    desc: "Chat with an agent that knows the business inside out. Deploy it on any site with one script.",
  },
];

const steps = [
  { num: "01", label: "Paste a URL" },
  { num: "02", label: "Get a scored audit" },
  { num: "03", label: "Generate a proposal" },
  { num: "04", label: "Chat with the agent" },
];

export default function Home() {
  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center py-16 px-4 text-center overflow-hidden">

      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="absolute left-1/4 bottom-0 w-[400px] h-[300px] bg-sky-500/10 blur-[100px] rounded-full" />
        <div className="absolute right-1/4 bottom-0 w-[400px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full" />
      </div>

      {/* Badge */}
      <motion.div {...fade(0)} className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-[11px] font-medium text-indigo-300 mb-8">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
        AI-powered website intelligence
      </motion.div>

      {/* Headline */}
      <motion.h1 {...fade(0.08)} className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl">
        Turn any website into an{" "}
        <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
          intelligent AI agent
        </span>
      </motion.h1>

      {/* Sub */}
      <motion.p {...fade(0.16)} className="mt-6 max-w-xl text-base md:text-lg text-gray-400 leading-relaxed">
        WebRep scans any business site, scores it across 6 dimensions, writes a tailored proposal, and deploys a context-aware AI representative — in minutes.
      </motion.p>

      {/* CTAs */}
      <motion.div {...fade(0.22)} className="mt-10 flex flex-wrap gap-4 justify-center">
        <Link
          href="/proposal"
          className="group rounded-xl px-7 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-px"
          style={{ background: "var(--accent-indigo)", boxShadow: "0 0 30px rgba(99,102,241,0.45)" }}
        >
          Generate a proposal
          <span className="ml-2 group-hover:translate-x-0.5 inline-block transition-transform">→</span>
        </Link>
        <Link
          href="/analyze"
          className="rounded-xl px-7 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-px"
          style={{
            border: "1px solid var(--border-default)",
            background: "var(--surface-2)",
            color: "var(--text-primary)",
          }}
        >
          Quick site audit
        </Link>
      </motion.div>

      {/* Steps */}
      <motion.div {...fade(0.3)} className="mt-20 flex flex-wrap justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ border: "1px solid var(--border-default)", background: "var(--surface-2)" }}
            >
              <span className="text-[10px] font-mono" style={{ color: "var(--accent-indigo)" }}>{s.num}</span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>→</span>
            )}
          </div>
        ))}
      </motion.div>

      {/* Feature cards */}
      <motion.div {...fade(0.38)} className="mt-20 grid gap-4 md:grid-cols-3 w-full max-w-4xl">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl p-6 text-left transition-all duration-300 group cursor-default"
            style={{ border: "1px solid var(--border-default)", background: "var(--card-bg)" }}
          >
            <span className="text-2xl">{f.icon}</span>
            <h3 className="mt-3 text-sm font-semibold transition-colors" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

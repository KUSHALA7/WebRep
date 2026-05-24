"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Strength = { label: string; detail: string };
type Gap = { label: string; detail: string; severity: "high" | "medium" | "low" };

type AnalysisResult = {
  title: string;
  industry: string;
  summary: string;
  score: number | null;
  scoreBreakdown: Record<string, number> | null;
  strengths: Strength[];
  gaps: Gap[];
};

type Proposal = {
  overview: string;
  currentState: string;
  keyFindings: string[];
  recommendedImprovements: string[];
  nextSteps: string[];
  agentUseCases: string[];
};

type AgentContext = {
  url: string;
  businessName: string;
  goal: string;
  audience: string;
  analysis: AnalysisResult;
  proposal: Proposal;
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.36, ease: "easeOut" },
  }),
};

function ProposalForm() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") ?? "");
  const [businessName, setBusinessName] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "analyzing" | "proposing" | "done">("idle");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  const handleGenerate = async () => {
    if (!url || !businessName) {
      alert("Please provide a URL and business name.");
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setProposal(null);
    setStep("analyzing");

    try {
      // Step 1: Analyze website
      const analysisRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const analysisData: AnalysisResult & { error?: string } = await analysisRes.json();
      if (!analysisRes.ok) throw new Error(analysisData.error || "Failed to analyze website");
      setAnalysis(analysisData);

      // Step 2: Generate LLM proposal
      setStep("proposing");
      const proposalRes = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: analysisData,
          businessName,
          goal,
          audience,
        }),
      });
      const proposalData: Proposal & { error?: string } = await proposalRes.json();
      if (!proposalRes.ok) throw new Error(proposalData.error || "Failed to generate proposal");
      setProposal(proposalData);
      setStep("done");

      // Save to Supabase if logged in
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (user) {
          const { data: project, error: projErr } = await supabase
            .from("projects")
            .insert({ user_id: user.id, website_url: url, business_name: businessName, goal, audience })
            .select()
            .single();

          if (!projErr && project) {
            await supabase.from("analyses").insert({
              project_id: project.id,
              summary: analysisData.summary,
              strengths: analysisData.strengths,
              gaps: analysisData.gaps,
              score: analysisData.score,
            });
            await supabase.from("proposals").insert({
              project_id: project.id,
              overview: proposalData.overview,
              current_state: proposalData.currentState,
              key_findings: proposalData.keyFindings,
              recommended_improvements: proposalData.recommendedImprovements,
              next_steps: proposalData.nextSteps,
              agent_use_cases: proposalData.agentUseCases,
            });
          }
        }
      } catch (dbErr) {
        console.error("Supabase save failed:", dbErr);
      }

      // Store context for agent
      const ctx: AgentContext = { url, businessName, goal, audience, analysis: analysisData, proposal: proposalData };
      if (typeof window !== "undefined") {
        localStorage.setItem("webrep-current-context", JSON.stringify(ctx));
      }
    } catch (err) {
      console.error("Generation error:", err);
      setStep("idle");
      alert(err instanceof Error ? err.message : "Failed to generate proposal.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = {
    idle: "",
    analyzing: "Step 1/2 — Auditing website…",
    proposing: "Step 2/2 — Writing proposal with AI…",
    done: "",
  }[step];

  return (
    <main className="py-6">
      <motion.div initial="hidden" animate="show" className="grid gap-6 md:grid-cols-[1fr,380px]">
        <div>
          <motion.div variants={fadeUp} custom={0}>
            <h1 className="text-2xl font-semibold">Generate Proposal</h1>
            <p className="text-sm text-gray-400 mt-1">
              WebRep audits the website and writes a tailored AI-agent proposal.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="mt-5 space-y-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business name (e.g. Acme Co.)"
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Primary goal (e.g. increase leads)"
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </div>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Target audience (e.g. small agencies)"
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />

            <div className="flex items-center gap-4">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-400 disabled:bg-gray-700 transition"
              >
                {loading ? stepLabel || "Working…" : "Generate proposal"}
              </button>
              <Link href="/projects" className="text-xs text-gray-400 hover:text-gray-200 transition">
                View projects
              </Link>
            </div>
          </motion.div>

          {/* Loading progress steps */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-xl border border-white/10 bg-black/60 p-4 space-y-2"
            >
              <StepIndicator label="Fetching & auditing website" done={step === "proposing" || step === "done"} active={step === "analyzing"} />
              <StepIndicator label="Writing proposal with AI" done={step === "done"} active={step === "proposing"} />
            </motion.div>
          )}

          {/* Proposal output */}
          {proposal && analysis && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-4"
            >
              {/* Score badge */}
              {analysis.score !== null && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Website score:</span>
                  <span className={`text-sm font-bold tabular-nums ${analysis.score >= 70 ? "text-emerald-400" : analysis.score >= 45 ? "text-amber-400" : "text-rose-400"}`}>
                    {analysis.score}/100
                  </span>
                  <span className="text-[11px] text-gray-500">({analysis.industry})</span>
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-black/60 p-5 text-sm space-y-5">
                <ProposalSection title="Overview" text={proposal.overview} />
                <ProposalSection title="Current State" text={proposal.currentState} />
                <ProposalList title="Key Findings" items={proposal.keyFindings} color="text-sky-300" />
                <ProposalList title="Recommended Improvements" items={proposal.recommendedImprovements} color="text-indigo-300" />
                {proposal.agentUseCases?.length > 0 && (
                  <ProposalList title="AI Agent Use Cases" items={proposal.agentUseCases} color="text-emerald-300" />
                )}
                <ProposalList title="Next Steps" items={proposal.nextSteps} color="text-amber-300" />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Link
                  href="/agent"
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-400 transition"
                >
                  Chat as this Agent →
                </Link>
                <p className="text-[11px] text-gray-500">The agent will use this proposal as context.</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right sidebar */}
        <motion.aside variants={fadeUp} custom={1} className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/60 p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">How it works</p>
            <ol className="list-decimal list-inside text-[11px] text-gray-300 space-y-1.5">
              <li>WebRep fetches and audits the website across 6 dimensions</li>
              <li>AI writes a tailored proposal based on the specific gaps found</li>
              <li>An AI agent is configured with the proposal as its knowledge base</li>
              <li>Embed the agent on the website with a single script</li>
            </ol>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/60 p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">Tips</p>
            <ul className="list-disc list-inside text-[11px] text-gray-300 space-y-1">
              <li>Use the company homepage or main domain</li>
              <li>Be specific with the goal for better proposals</li>
              <li>Audience details personalise the agent&apos;s tone</li>
            </ul>
          </div>
        </motion.aside>
      </motion.div>
    </main>
  );
}

function StepIndicator({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full shrink-0 ${done ? "bg-emerald-400" : active ? "bg-indigo-400 animate-pulse" : "bg-white/10"}`} />
      <span className={`text-xs ${done ? "text-emerald-300" : active ? "text-gray-100" : "text-gray-500"}`}>{label}</span>
      {done && <span className="text-[10px] text-emerald-500">✓</span>}
    </div>
  );
}

function ProposalSection({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-sm text-gray-200 leading-relaxed">{text}</p>
    </section>
  );
}

function ProposalList({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{title}</h3>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className={`${color} shrink-0`}>›</span>
            <span className="text-gray-200 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ProposalPage() {
  return (
    <Suspense fallback={<div className="py-6 text-sm text-gray-400">Loading…</div>}>
      <ProposalForm />
    </Suspense>
  );
}

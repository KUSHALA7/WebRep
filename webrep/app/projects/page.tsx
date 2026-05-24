"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Project = {
  id: string;
  website_url: string;
  business_name: string;
  goal: string | null;
  audience: string | null;
  created_at: string;
};

type ProposalRow = {
  overview: string;
  current_state: string;
  key_findings: string[];
  recommended_improvements: string[];
  next_steps: string[];
  agent_use_cases: string[] | null;
};

type AnalysisRow = {
  summary: string;
  strengths: { label: string; detail: string }[];
  gaps: { label: string; detail: string; severity: string }[];
  score: number | null;
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setMessage(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        setMessage("Error getting user. Try signing in again.");
        setLoading(false);
        return;
      }

      if (!user) {
        setMessage("Sign in to view your saved WebRep projects.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Could not load projects.");
      } else {
        setProjects(data as Project[]);
      }

      setLoading(false);
    };

    fetchProjects();
  }, []);

  const loadIntoAgent = async (project: Project) => {
    setLoadingId(project.id);
    try {
      const [proposalRes, analysisRes] = await Promise.all([
        supabase.from("proposals").select("*").eq("project_id", project.id).single(),
        supabase.from("analyses").select("*").eq("project_id", project.id).single(),
      ]);

      const proposal = proposalRes.data as ProposalRow | null;
      const analysis = analysisRes.data as AnalysisRow | null;

      const ctx = {
        url: project.website_url,
        businessName: project.business_name,
        goal: project.goal ?? "",
        audience: project.audience ?? "",
        analysis: analysis
          ? {
              title: project.business_name,
              industry: "General",
              summary: analysis.summary,
              score: analysis.score,
              scoreBreakdown: null,
              strengths: analysis.strengths,
              gaps: analysis.gaps,
            }
          : null,
        proposal: proposal
          ? {
              overview: proposal.overview,
              currentState: proposal.current_state,
              keyFindings: proposal.key_findings,
              recommendedImprovements: proposal.recommended_improvements,
              nextSteps: proposal.next_steps,
              agentUseCases: proposal.agent_use_cases ?? [],
            }
          : null,
      };

      localStorage.setItem("webrep-current-context", JSON.stringify(ctx));
      router.push("/agent");
    } catch (err) {
      console.error("Failed to load project:", err);
      alert("Could not load project into agent.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Link
          href="/proposal"
          className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-400 transition"
        >
          New proposal
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading your projects…</p>}

      {!loading && message && <p className="text-sm text-gray-400">{message}</p>}

      {!loading && !message && projects.length === 0 && (
        <p className="text-sm text-gray-400">
          No projects yet. Generate a proposal to create your first WebRep project.
        </p>
      )}

      {!loading && projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-start justify-between rounded-xl border border-white/10 bg-black/60 px-4 py-3 hover:border-indigo-400/50 transition"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{p.business_name}</p>
                <p className="text-xs text-indigo-300 truncate">{p.website_url}</p>
                <p className="mt-1 text-xs text-gray-400">Goal: {p.goal || "—"}</p>
                {p.audience && (
                  <p className="text-[11px] text-gray-500">Audience: {p.audience}</p>
                )}
                <p className="mt-1 text-[11px] text-gray-500">
                  {new Date(p.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                <span className="text-[10px] text-gray-600">#{p.id.slice(0, 6)}</span>
                <button
                  onClick={() => loadIntoAgent(p)}
                  disabled={loadingId === p.id}
                  className="rounded-md border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-[11px] text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400 disabled:opacity-50 transition"
                >
                  {loadingId === p.id ? "Loading…" : "Load → Agent"}
                </button>
                <Link
                  href={`/proposal?url=${encodeURIComponent(p.website_url)}`}
                  className="text-[11px] text-gray-500 hover:text-gray-300 transition"
                >
                  Re-run
                </Link>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

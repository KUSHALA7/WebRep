import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { analysis, businessName, goal, audience } = await req.json();

    if (!analysis || !businessName) {
      return NextResponse.json({ error: "Missing analysis or businessName." }, { status: 400 });
    }

    const strengthsList = analysis.strengths
      .map((s: { label: string; detail: string }) => `- ${s.label}: ${s.detail}`)
      .join("\n");

    const gapsList = analysis.gaps
      .map((g: { label: string; detail: string; severity: string }) => `- [${g.severity.toUpperCase()}] ${g.label}: ${g.detail}`)
      .join("\n");

    const prompt = `You are a senior digital strategy consultant writing a professional proposal for a business.

Business: ${businessName}
Industry: ${analysis.industry || "General"}
Website: analyzed
Goal: ${goal || "improve online presence"}
Target audience: ${audience || "general users"}
Current web presence score: ${analysis.score ?? "N/A"}/100

Website summary:
${analysis.summary}

Current strengths:
${strengthsList}

Gaps identified (by severity):
${gapsList}

Write a professional proposal in this EXACT JSON format (no markdown, no extra text):
{
  "overview": "2-3 sentences: what WebRep proposes to do for this business and why it matters now",
  "currentState": "2-3 sentences: honest assessment of where the business stands online today based on the analysis",
  "keyFindings": [
    "finding 1 (specific, references actual content from analysis)",
    "finding 2",
    "finding 3",
    "finding 4"
  ],
  "recommendedImprovements": [
    "improvement 1 (actionable, specific to their gaps)",
    "improvement 2",
    "improvement 3",
    "improvement 4",
    "improvement 5"
  ],
  "nextSteps": [
    "step 1 (concrete immediate action)",
    "step 2",
    "step 3"
  ],
  "agentUseCases": [
    "use case 1: how an AI agent specifically helps this business (e.g. answer pricing questions 24/7)",
    "use case 2",
    "use case 3"
  ]
}

Be specific to this business. Do not use generic filler. Reference their actual industry and gaps.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 1200,
    });

    let responseText = completion.choices[0].message?.content || "";

    responseText = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to generate proposal." }, { status: 500 });
    }

    const proposal = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      overview: proposal.overview || "",
      currentState: proposal.currentState || "",
      keyFindings: proposal.keyFindings || [],
      recommendedImprovements: proposal.recommendedImprovements || [],
      nextSteps: proposal.nextSteps || [],
      agentUseCases: proposal.agentUseCases || [],
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Proposal API error:", error.message);
    return NextResponse.json({ error: "Failed to generate proposal." }, { status: 500 });
  }
}

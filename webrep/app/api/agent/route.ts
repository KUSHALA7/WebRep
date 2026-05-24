import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { context, messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing messages array." }, { status: 400 });
    }

    const chatMessages = messages.map((m: { role: string; content: string }) => ({
      role: (m.role === "agent" ? "assistant" : m.role) as "user" | "assistant",
      content: m.content,
    }));

    const sysPrompt = `You are a helpful AI assistant for WebRep.
${context?.businessName ? `Business: ${context.businessName}` : ""}
${context?.goal ? `Goal: ${context.goal}` : ""}
${context?.audience ? `Audience: ${context.audience}` : ""}
${context?.proposal?.overview ? `Proposal Overview: ${context.proposal.overview}` : ""}
${context?.proposal?.currentState ? `Current State: ${context.proposal.currentState}` : ""}

Be helpful, concise, and professional. Answer questions about the business, its goals, and how to improve their web presence.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: sysPrompt },
        ...chatMessages,
      ],
      temperature: 0.4,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message?.content || "Sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Agent API error:", error.message);
    return NextResponse.json(
      { error: "Failed to get AI response", details: error.message },
      { status: 500 }
    );
  }
}

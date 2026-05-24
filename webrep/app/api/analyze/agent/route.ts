import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!messages) {
      return NextResponse.json(
        { error: "Missing messages." },
        { status: 400 }
      );
    }

    const sysPrompt = `
You are WebRep AI assistant. Use the following context to answer:
Business: ${context?.businessName}
Goal: ${context?.goal}
Audience: ${context?.audience}

Be helpful, structured, and professional.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: sysPrompt },
        ...messages,
      ],
      temperature: 0.3,
    });

    const reply = completion.choices[0].message?.content || "Sorry, I have no response.";

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Agent API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

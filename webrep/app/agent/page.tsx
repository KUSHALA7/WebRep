"use client";

import { useEffect, useRef, useState } from "react";

export interface Message {
  role: "agent" | "user";
  content: string;
}

export interface AgentContext {
  url: string;
  businessName: string;
  goal: string;
  audience: string;
  proposal: unknown; // FIXED
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([]); // FIXED
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [context, setContext] = useState<AgentContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* -------------------------------------------
      AUTO SCROLL
  --------------------------------------------*/
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------------------------------------------
      LOAD CONTEXT ON MOUNT
  --------------------------------------------*/
  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem("webrep-current-context");
    if (!raw) {
      setMessages([
        {
          role: "agent",
          content: "Hi! To personalize your chat experience, please generate a proposal first.",
        },
      ]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as AgentContext;
      setContext(parsed);

      setMessages([
        {
          role: "agent",
          content: `Hi! I'm the assistant for **${parsed.businessName}** — how can I help with your proposal or site analysis?`,
        },
      ]);
    } catch {
      console.warn("Failed to parse agent context");
      setMessages([
        {
          role: "agent",
          content: "Hi! I couldn't load your last context — feel free to ask anything.",
        },
      ]);
    }
  }, []);

  /* -------------------------------------------
      SEND MESSAGE
  --------------------------------------------*/
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          messages: updatedMessages,
        }),
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        { role: "agent", content: data.reply || "Sorry, I couldn't process that." },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "agent", content: "Something went wrong contacting the AI." },
      ]);
    } finally {
      setSending(false);
    }
  };

  /* -------------------------------------------
      ENTER KEY HANDLER
  --------------------------------------------*/
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !sending) {
      sendMessage();
    }
  };

  /* -------------------------------------------
      UI
  --------------------------------------------*/
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-10 px-4">

      {/* HEADER */}
      <div className="w-full max-w-3xl mb-6">
        <h1 className="text-2xl font-bold">Agent Chat</h1>
        <p className="text-gray-400 text-sm">
          {context?.businessName} • {context?.goal}
        </p>
      </div>

      {/* CHAT BOX */}
      <div className="w-full max-w-3xl bg-[#0d0d0d] rounded-xl border border-gray-800 p-6 flex flex-col h-[70vh] overflow-y-auto">

        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "self-end bg-indigo-600 text-white px-4 py-2 rounded-lg max-w-xs my-2"
                : "self-start bg-gray-800 text-gray-200 px-4 py-2 rounded-lg max-w-xl my-2"
            }
          >
            {m.content}
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div className="w-full max-w-3xl mt-4 flex gap-3">
        <input
          className="flex-1 px-4 py-2 rounded-lg bg-[#111] border border-gray-700 focus:outline-none focus:border-indigo-500"
          placeholder="Ask something…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />

        <button
          onClick={sendMessage}
          disabled={sending}
          className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

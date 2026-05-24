"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";

type AuthMode = "signin" | "signup";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.28 } }),
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email to confirm the account.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          router.push("/projects");
        }
      }
    } catch (err) {
      if (err instanceof Error) setMessage(err.message);
      else setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setMessage(error.message);
  };

  return (
    <main className="py-6">
      <motion.div initial="hidden" animate="show" className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-black/60 p-6">
        <motion.h1 variants={fadeUp} custom={0} className="text-lg font-semibold text-center">
          {mode === "signin" ? "Sign in" : "Create account"}
        </motion.h1>

        <motion.div variants={fadeUp} custom={1} className="mt-4 space-y-3">
          <label className="text-[11px] text-gray-400">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-white/6 bg-black/70 px-3 py-2 text-sm" placeholder="you@example.com" />

          <label className="text-[11px] text-gray-400">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded-md border border-white/6 bg-black/70 px-3 py-2 text-sm" placeholder="••••••••" />

          <button onClick={handleAuth} disabled={loading || !email || !password} className="w-full rounded-md bg-indigo-500 py-2 text-xs font-medium text-white disabled:bg-gray-700">
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>

          <button onClick={handleGoogle} className="w-full rounded-md border border-white/10 py-2 text-xs font-medium text-gray-200 hover:bg-gray-900">
            Continue with Google
          </button>

          {message && <p className="text-xs text-center text-gray-400 mt-2">{message}</p>}
        </motion.div>

        <motion.p variants={fadeUp} custom={2} className="text-[11px] text-center text-gray-500 mt-4">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button className="text-indigo-400" onClick={() => setMode("signup")}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Have an account?{" "}
              <button className="text-indigo-400" onClick={() => setMode("signin")}>
                Sign in
              </button>
            </>
          )}
        </motion.p>
      </motion.div>
    </main>
  );
}

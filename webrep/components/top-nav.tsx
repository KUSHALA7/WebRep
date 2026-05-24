"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/analyze", label: "Analyze" },
  { href: "/proposal", label: "Proposal" },
  { href: "/agent", label: "Agent" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <nav className="flex items-center gap-1 text-xs">
      {navItems.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative px-3 py-1.5 rounded-lg transition-colors duration-150"
            style={{
              color: active ? "var(--accent-indigo)" : "var(--text-secondary)",
              background: active ? "rgba(99,102,241,0.08)" : "transparent",
            }}
          >
            <span className="font-medium">{item.label}</span>
            {active && (
              <motion.div
                layoutId="active-nav-pill"
                className="absolute bottom-0 left-2 right-2 h-px rounded-full"
                style={{ background: "var(--accent-indigo)" }}
              />
            )}
          </Link>
        );
      })}

      {user ? (
        <div className="ml-2 flex items-center gap-2 pl-2 border-l border-[var(--border-default)]">
          <span
            className="text-[11px] max-w-[110px] truncate"
            style={{ color: "var(--text-muted)" }}
            title={user.email ?? ""}
          >
            {user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="rounded-full border px-3 py-1 text-[11px] font-medium transition"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--text-secondary)",
            }}
          >
            Sign out
          </button>
        </div>
      ) : (
        <Link
          href="/auth"
          className="ml-2 rounded-full border px-3 py-1 text-[11px] font-medium transition"
          style={{
            borderColor: "var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

/* ── Animation helper ─────────────────────────────────────────────────────── */
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE, delay },
});

/* ── Feature pills ────────────────────────────────────────────────────────── */
const PILLS = ["Runtime Flow Graph", "AI Bug Archaeology", "Complexity Analytics"];

/* ── Fake dashboard mockup ────────────────────────────────────────────────── */
function MockupCard() {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[#1c2128] bg-[#0D1117] shadow-[0_0_60px_rgba(45,126,247,0.08)]">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1c2128] bg-[#090e18]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="ml-3 text-[11px] font-spacemono text-slate-600 tracking-wide">
          deeptrace — github.com/vercel/next.js
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-spacemono">
            ✓ Analysis complete
          </span>
        </div>
      </div>

      {/* Dashboard body */}
      <div className="flex h-72 text-[11px] font-spacemono overflow-hidden">

        {/* File tree */}
        <div className="w-44 border-r border-[#1c2128] p-3 shrink-0 space-y-1 overflow-hidden">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2.5">Explorer</p>
          {[
            { label: "src/",              indent: 0, active: false },
            { label: "├─ index.ts",       indent: 0, active: false },
            { label: "├─ auth.ts",        indent: 0, active: true  },
            { label: "├─ middleware.ts",   indent: 0, active: false },
            { label: "├─ api/",           indent: 0, active: false },
            { label: "│  ├─ routes.ts",   indent: 0, active: false },
            { label: "│  └─ handlers.ts", indent: 0, active: false },
            { label: "└─ utils/",         indent: 0, active: false },
            { label: "   └─ helpers.ts",  indent: 0, active: false },
          ].map((item) => (
            <p
              key={item.label}
              className={`truncate leading-5 ${
                item.active
                  ? "text-blue-400 bg-blue-500/10 rounded px-1.5 -mx-1.5"
                  : "text-slate-500"
              }`}
            >
              {item.label}
            </p>
          ))}
        </div>

        {/* Code panel */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] text-slate-600 uppercase tracking-widest">auth.ts</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              complexity 14
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/10 text-red-400 border border-red-500/20">
              2 bugs
            </span>
          </div>
          <div className="space-y-1 leading-5">
            <p>
              <span className="text-slate-600">1  </span>
              <span className="text-purple-400">export</span>
              <span className="text-slate-400"> async </span>
              <span className="text-blue-400">function</span>
              <span className="text-yellow-300"> authenticate</span>
              <span className="text-slate-300">(</span>
            </p>
            <p>
              <span className="text-slate-600">2  </span>
              <span className="text-slate-500">  </span>
              <span className="text-orange-300">token</span>
              <span className="text-slate-500">: string</span>
            </p>
            <p>
              <span className="text-slate-600">3  </span>
              <span className="text-slate-300">): </span>
              <span className="text-cyan-400">Promise</span>
              <span className="text-slate-300">&lt;User&gt; &#123;</span>
            </p>
            <p>
              <span className="text-slate-600">4  </span>
              <span className="text-slate-500">  </span>
              <span className="text-blue-400">const </span>
              <span className="text-slate-200">session </span>
              <span className="text-slate-500">= </span>
              <span className="text-blue-400">await </span>
              <span className="text-yellow-300">verify</span>
              <span className="text-slate-300">(token);</span>
            </p>
            <p className="bg-red-500/8 border-l-2 border-red-500/60 pl-1 -ml-1 rounded-r">
              <span className="text-slate-600">5  </span>
              <span className="text-slate-500">  </span>
              <span className="text-purple-400">return </span>
              <span className="text-slate-200">session</span>
              <span className="text-red-400">.</span>
              <span className="text-slate-200">user</span>
              <span className="text-slate-500">.id;</span>
              <span className="ml-2 text-[9px] text-red-400">⚠ null dereference</span>
            </p>
            <p>
              <span className="text-slate-600">6  </span>
              <span className="text-slate-300">&#125;</span>
            </p>
          </div>

          {/* AI suggestion */}
          <div className="mt-4 p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5">
            <p className="text-blue-400 text-[10px] font-semibold mb-0.5">
              ✦ AI Fix Suggestion
            </p>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              Add null guard:{" "}
              <span className="text-slate-300">if (!session) throw new AuthError()</span>
            </p>
          </div>
        </div>

        {/* Metrics panel */}
        <div className="w-44 border-l border-[#1c2128] p-3 shrink-0 space-y-4 overflow-hidden">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest">Metrics</p>

          {[
            { label: "Coverage",    value: "87%",  bar: 87,  color: "bg-emerald-500", text: "text-emerald-400" },
            { label: "Duplication", value: "3.2%", bar: 3,   color: "bg-blue-500",    text: "text-blue-400"   },
            { label: "Cyclomatic",  value: "14",   bar: 56,  color: "bg-yellow-500",  text: "text-yellow-400" },
            { label: "Bugs Found",  value: "2",    bar: 20,  color: "bg-red-500",     text: "text-red-400"    },
          ].map((m) => (
            <div key={m.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] text-slate-600">{m.label}</span>
                <span className={`text-xs font-bold ${m.text}`}>{m.value}</span>
              </div>
              <div className="h-1 w-full rounded-full bg-[#1c2128] overflow-hidden">
                <div
                  className={`h-full rounded-full ${m.color}/70`}
                  style={{ width: `${m.bar}%` }}
                />
              </div>
            </div>
          ))}

          {/* Mini flow graph hint */}
          <div className="mt-2 pt-3 border-t border-[#1c2128]">
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-2">
              Flow Graph
            </p>
            <svg viewBox="0 0 120 70" className="w-full opacity-60">
              <circle cx="60" cy="12" r="6" fill="#2D7EF7" fillOpacity="0.7" />
              <circle cx="30" cy="40" r="5" fill="#a855f7" fillOpacity="0.7" />
              <circle cx="90" cy="40" r="5" fill="#a855f7" fillOpacity="0.7" />
              <circle cx="20" cy="62" r="4" fill="#6b7280" fillOpacity="0.5" />
              <circle cx="50" cy="62" r="4" fill="#ef4444" fillOpacity="0.6" />
              <circle cx="90" cy="62" r="4" fill="#6b7280" fillOpacity="0.5" />
              <line x1="60" y1="18" x2="30" y2="35" stroke="#2D7EF7" strokeOpacity="0.3" strokeWidth="1" />
              <line x1="60" y1="18" x2="90" y2="35" stroke="#2D7EF7" strokeOpacity="0.3" strokeWidth="1" />
              <line x1="30" y1="45" x2="20" y2="58" stroke="#a855f7" strokeOpacity="0.3" strokeWidth="1" />
              <line x1="30" y1="45" x2="50" y2="58" stroke="#a855f7" strokeOpacity="0.3" strokeWidth="1" />
              <line x1="90" y1="45" x2="90" y2="58" stroke="#a855f7" strokeOpacity="0.3" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Radar / trace icon ───────────────────────────────────────────────────── */
function RadarIcon() {
  return (
    <svg className="w-7 h-7 text-blue-500" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
      <circle cx="14" cy="14" r="8"  stroke="currentColor" strokeOpacity="0.32" strokeWidth="1" />
      <circle cx="14" cy="14" r="4"  stroke="currentColor" strokeOpacity="0.55" strokeWidth="1" />
      <circle cx="14" cy="14" r="1.8" fill="currentColor" />
      {/* Sweep arm */}
      <line x1="14" y1="14" x2="14" y2="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.85" />
      <line x1="14" y1="14" x2="23" y2="14" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
    </svg>
  );
}

/* ── GitHub icon ──────────────────────────────────────────────────────────── */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207 11.387.6.11.793-.26.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [repoUrl, setRepoUrl] = useState("");

  return (
    <div className="flex flex-col min-h-screen bg-[#050810] overflow-x-hidden">

      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/7 rounded-full blur-[130px]" />
        <div className="absolute top-1/3 -left-48 w-[500px] h-[400px] bg-violet-700/6 rounded-full blur-[110px]" />
        <div className="absolute top-1/3 -right-48 w-[500px] h-[400px] bg-blue-500/5 rounded-full blur-[110px]" />
      </div>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-14 bg-[#050810]/80 backdrop-blur-md border-b border-[#1c2128]/60">
        <div className="h-full max-w-5xl mx-auto px-6 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <RadarIcon />
            <span className="font-syne text-sm font-bold tracking-wide text-slate-100 group-hover:text-blue-400 transition-colors">
              Deep<span className="text-blue-400">Trace</span>
            </span>
          </Link>

          {/* Ghost CTA */}
          <button className="flex items-center gap-2 px-4 py-1.5 text-sm border border-slate-700/80 rounded-full text-slate-300 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 transition-all font-medium">
            <GitHubIcon className="w-3.5 h-3.5" />
            Connect GitHub
          </button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <main className="relative flex-1">
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center">

          {/* Badge */}
          <motion.div {...fadeUp(0)} className="mb-7">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/8 text-xs font-spacemono text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              AI-Powered Code Intelligence
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fadeUp(0)}
            className="font-syne text-5xl md:text-[4.25rem] font-extrabold tracking-tight leading-[1.05] mb-5"
          >
            <span className="text-gradient-hero">
              Dig Deep Into Any Codebase.
            </span>
            <br />
            <span className="text-slate-100">Instantly.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeUp(0.1)}
            className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10"
          >
            DeepTrace maps execution flows, detects bugs, and scores code quality using AI —{" "}
            <span className="text-slate-200">like an X-ray for your code</span>
          </motion.p>

          {/* Input row */}
          <motion.div {...fadeUp(0.25)} className="w-full max-w-2xl">
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#0D1117] border border-[#1c2128] focus-within:border-blue-500/40 focus-within:shadow-[0_0_0_3px_rgba(45,126,247,0.07)] transition-all">
              <div className="pl-2.5 text-slate-600 shrink-0">
                <GitHubIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="github.com/owner/repository"
                className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-600 text-sm outline-none font-spacemono py-2.5 px-1.5 min-w-0"
              />
              <Link
                href={repoUrl ? `/import?url=${encodeURIComponent(repoUrl)}` : "/import"}
                className="shrink-0 px-5 py-2.5 bg-[#2D7EF7] hover:bg-[#1a6ee0] active:bg-[#1560cc] text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shadow-[0_0_20px_rgba(45,126,247,0.3)]"
              >
                Trace Now →
              </Link>
            </div>
            <p className="text-xs text-slate-600 mt-2.5 font-spacemono">
              Paste any public GitHub URL · no sign-in required
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            {...fadeUp(0.3)}
            className="flex flex-wrap justify-center gap-2 mt-6"
          >
            {PILLS.map((pill) => (
              <span
                key={pill}
                className="px-3.5 py-1 text-xs rounded-full border border-[#252d3d] bg-[#0D1117]/80 text-slate-400 font-spacemono tracking-wide hover:border-blue-500/30 hover:text-slate-300 transition-colors cursor-default"
              >
                {pill}
              </span>
            ))}
          </motion.div>

          {/* Mockup preview */}
          <motion.div {...fadeUp(0.4)} className="w-full mt-14 relative">
            <MockupCard />
            {/* Bottom fade-out so the card bleeds into the page background */}
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#050810] to-transparent pointer-events-none rounded-b-2xl" />
          </motion.div>

        </div>
      </main>
    </div>
  );
}

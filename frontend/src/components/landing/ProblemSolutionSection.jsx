import { XCircle, CheckCircle2, AlertTriangle, ShieldCheck, Shuffle, Scale, Zap, UserCheck } from 'lucide-react';

export function ProblemSolutionSection() {
  return (
    <section className="border-t border-slate-200/80 bg-slate-100/40 py-16 dark:border-white/[0.08] dark:bg-ink-900/30 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="eyebrow block">The Teammate Challenge</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Why finding hackathon teammates is broken.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Great ideas fail at hackathons not because of lack of ambition, but because of unbalanced teams, chaotic group chats, and awkward overfill rejections.
          </p>
        </div>

        {/* 2-Column Comparison Grid: Problem vs Solution */}
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Column 1: The Old Way (Friction) */}
          <div className="rounded-2xl border border-rose-500/20 bg-white/80 p-6 shadow-sm dark:border-rose-500/15 dark:bg-ink-950/60 sm:p-8">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <span className="grid size-9 place-items-center rounded-xl bg-rose-500/10">
                <XCircle size={20} />
              </span>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                The Traditional Hackathon Struggle
              </h3>
            </div>

            <ul className="mt-6 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mt-0.5">
                  ✕
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Chaotic Spam in Discord & WhatsApp:</strong> Endless message boards with no structured way to filter developers by tech stack or experience level.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mt-0.5">
                  ✕
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Severely Unbalanced Skill Sets:</strong> Ending up with 4 frontend developers and zero backend or AI engineers, leading to incomplete demos.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mt-0.5">
                  ✕
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Race Condition Overfills:</strong> Creators accepting multiple people simultaneously, exceeding team limits and forcing awkward last-minute drops.
                </div>
              </li>
            </ul>
          </div>

          {/* Column 2: The HackBuddy Way (Engineered Solution) */}
          <div className="rounded-2xl border border-emerald-500/30 bg-white/90 p-6 shadow-card dark:border-emerald-500/20 dark:bg-ink-950/80 sm:p-8">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 size={20} />
              </span>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                The HackBuddy Architecture
              </h3>
            </div>

            <ul className="mt-6 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mt-0.5">
                  ✓
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Skill-Based Complementary Matching:</strong> Discover team openings specifically looking for your programming languages, frameworks, or design skills.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mt-0.5">
                  ✓
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Atomic Concurrency Lock:</strong> Database-level `$expr` conditional writes guarantee no team ever exceeds its capacity limit under concurrent requests.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mt-0.5">
                  ✓
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white">Verified Builder Credentials:</strong> Verified email accounts, academic department, and GitHub links ensure reliable teammates who show up ready to ship.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

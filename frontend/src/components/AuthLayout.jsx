import { Sparkles, Users2, ShieldCheck, Zap, Award, Star } from 'lucide-react';
import { Layout } from './Layout';

export function AuthLayout({ children, title, subtitle }) {
  return (
    <Layout>
      <section className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Big-Tech Pitch & Live Stat Badges */}
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-sm dark:border-brand-400/25 dark:bg-brand-400/10 dark:text-brand-300">
            <Sparkles size={14} className="animate-pulse" />
            <span>The Teammate Platform for Hackathon Makers</span>
          </div>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Build your dream crew. <br />
            <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent dark:from-brand-400 dark:via-indigo-300 dark:to-purple-400">
              Ship winning software.
            </span>
          </h1>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-300">
            HackBuddy matches full-stack developers, AI practitioners, and product designers based on complementary tech stacks and hackathon ambitions.
          </p>

          {/* Feature Grid */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="glass-panel p-4 transition duration-150 hover:border-brand-300 dark:hover:border-white/20">
              <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900 dark:text-white">
                <span className="grid size-7 place-items-center rounded-lg bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400">
                  <Zap size={15} />
                </span>
                <span>Atomic Concurrency</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Database-level capacity enforcement guarantees zero overfilled team rosters.
              </p>
            </div>

            <div className="glass-panel p-4 transition duration-150 hover:border-brand-300 dark:hover:border-white/20">
              <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900 dark:text-white">
                <span className="grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                  <Users2 size={15} />
                </span>
                <span>Real-Time Sync</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Instant Socket.IO handshake delivery for applicant alerts and decisions.
              </p>
            </div>
          </div>

          {/* Social Proof / Stats Box */}
          <div className="mt-8 flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="flex -space-x-2 overflow-hidden">
              {['A', 'M', 'S', 'K'].map((letter, i) => (
                <div
                  key={letter}
                  className={`grid size-8 place-items-center rounded-full border-2 border-white text-xs font-bold text-white dark:border-ink-950 ${
                    i === 0 ? 'bg-indigo-600' : i === 1 ? 'bg-purple-600' : i === 2 ? 'bg-emerald-600' : 'bg-brand-500'
                  }`}
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="text-xs">
              <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Verified Builder Network</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400">Collaborating across active hackathon projects</p>
            </div>
          </div>
        </div>

        {/* Right Column: Floating Auth Card */}
        <div className="mx-auto w-full max-w-md">
          <div className="glass-card border-slate-200/90 p-6 shadow-xl sm:p-8 dark:border-white/10 dark:bg-ink-900/90">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
            {children}
          </div>
        </div>
      </section>
    </Layout>
  );
}

import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Terminal,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function HeroSection({ featuredTeam, stats, loading }) {
  const { user } = useAuth();

  const creatorName = featuredTeam?.creator?.name || 'Verified Creator';
  const creatorInitials = creatorName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const memberCount = featuredTeam?.members?.length || 1;
  const capacityLimit = featuredTeam?.teamSizeLimit || 4;
  const openSpots = Math.max(0, capacityLimit - memberCount);
  const capacityPercent = Math.min(100, Math.round((memberCount / capacityLimit) * 100));

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24">
      {/* Background Subtle Mesh Glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[500px] w-full -translate-x-1/2 max-w-6xl bg-radial-glow opacity-80 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column: SaaS Pitch & CTAs */}
          <div>
            {/* Live Platform Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-sm dark:border-brand-400/25 dark:bg-brand-400/10 dark:text-brand-300">
              <Sparkles size={14} className="animate-pulse text-brand-600 dark:text-brand-400" />
              <span>Skill-Based Hackathon Matchmaking</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.25rem]">
              Find the right people <br />
              <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent dark:from-brand-400 dark:via-indigo-300 dark:to-purple-400">
                to build with.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              The teammate discovery platform for ambitious hackathon makers. Connect with full-stack engineers, AI practitioners, and product designers based on complementary tech stacks — with verified credentials and atomic capacity limits.
            </p>

            {/* CTA Action Row */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                to={user ? '/app' : '/register'}
                className="primary-button text-sm py-3 px-6 shadow-glow"
              >
                <span>{user ? 'Go to Your Dashboard' : 'Find Your Teammates'}</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/explore"
                className="secondary-button text-sm py-3 px-5"
              >
                <Compass size={16} />
                <span>Explore Live Openings</span>
              </Link>
            </div>

            {/* Feature Highlights Pills */}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-6 border-t border-slate-200/70 dark:border-white/[0.08]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>Verified Builder Profiles</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={16} className="text-amber-500" />
                <span>Atomic Concurrency</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-brand-500" />
                <span>Real-Time WebSocket Sync</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Live Opening or Active Builder Stream Card */}
          <div className="relative">
            <div className="glass-card overflow-hidden border-slate-200/90 shadow-2xl dark:border-white/10 dark:bg-ink-900/90">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-100/60 px-4 py-3 dark:border-white/10 dark:bg-ink-950/60">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-rose-500/80" />
                  <span className="size-3 rounded-full bg-amber-500/80" />
                  <span className="size-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <Terminal size={12} />
                  <span>hackbuddy.match/stream</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Database</span>
                </div>
              </div>

              {/* Card Body: Dynamic Live Opening Preview */}
              <div className="p-5 space-y-4">
                {featuredTeam ? (
                  <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-md border border-brand-500/20 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
                        {featuredTeam.hackathonName}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {openSpots > 0 ? `${openSpots} open spot${openSpots === 1 ? '' : 's'}` : 'Full'}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 font-display text-xs font-bold text-white shadow-sm">
                        {creatorInitials}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {creatorName}'s Team
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {featuredTeam.creator?.branch || 'Maker'}
                          {featuredTeam.creator?.year ? ` · Year ${featuredTeam.creator.year}` : ''}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {featuredTeam.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {featuredTeam.requiredSkills?.map((skill) => (
                        <span key={skill} className="skill-badge text-[10px] py-0.5">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Seat Allocation Visualizer */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3 dark:border-white/[0.08]">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: capacityLimit }).map((_, idx) => {
                          const isFilled = idx < memberCount;
                          return (
                            <span
                              key={idx}
                              className={`size-2.5 rounded-full ${
                                isFilled
                                  ? 'bg-brand-600 dark:bg-brand-400'
                                  : 'border border-dashed border-slate-300 bg-slate-100 dark:border-white/20 dark:bg-white/5'
                              }`}
                              title={isFilled ? `Seat ${idx + 1} (Filled)` : `Seat ${idx + 1} (Open)`}
                            />
                          );
                        })}
                        <span className="ml-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {memberCount}/{capacityLimit} seats ({capacityPercent}%)
                        </span>
                      </div>

                      <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                        Atomic Mutex Locked
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200/80 bg-white/80 p-6 text-center shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
                    <UsersRound className="mx-auto text-brand-500 mb-2" size={32} />
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Live Matching Engine Active
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Publish a team or match skills with builders across upcoming hackathons.
                    </p>
                    <Link to="/explore" className="primary-button mt-3 text-xs py-1.5 px-3">
                      Browse Feed
                    </Link>
                  </div>
                )}

                {/* Real Database Telemetry Mini-Banner */}
                <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-3 text-xs text-slate-700 dark:border-white/10 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold text-brand-600 dark:text-brand-400">
                      <Zap size={14} /> Live Telemetry:
                    </span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {stats ? `${stats.totalTeams} team${stats.totalTeams === 1 ? '' : 's'} · ${stats.totalOpenings} open seat${stats.totalOpenings === 1 ? '' : 's'}` : 'Synchronized'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

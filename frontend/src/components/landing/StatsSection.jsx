import { UsersRound, Layers, CheckCircle2, Sparkles, UserCheck } from 'lucide-react';

export function StatsSection({ stats, loading }) {
  const statItems = [
    {
      label: 'Verified Builders',
      value: stats?.totalUsers ?? 0,
      description: 'Active makers across campuses',
      icon: UsersRound,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-500/10 dark:bg-brand-400/10',
    },
    {
      label: 'Team Openings',
      value: stats?.totalTeams ?? 0,
      description: 'Hackathon project rosters',
      icon: Layers,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 dark:bg-indigo-400/10',
    },
    {
      label: 'Matches Formed',
      value: stats?.totalMatches ?? 0,
      description: 'Accepted teammate requests',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    },
    {
      label: 'Open Seats Available',
      value: stats?.totalOpenings ?? 0,
      description: 'Ready to join today',
      icon: Sparkles,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10 dark:bg-purple-400/10',
    },
  ];

  return (
    <section id="stats" className="border-y border-slate-200/80 bg-slate-100/50 py-16 dark:border-white/[0.08] dark:bg-ink-900/40 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end mb-10">
          <div>
            <span className="eyebrow block">Live Database Telemetry</span>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Platform Activity at a Glance.
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Updated live from MongoDB</span>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="stat-card flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {item.label}
                  </span>
                  <span className={`grid size-8 place-items-center rounded-xl ${item.bg} ${item.color}`}>
                    <Icon size={16} />
                  </span>
                </div>

                <div className="mt-4">
                  {loading ? (
                    <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
                  ) : (
                    <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                      {item.value}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

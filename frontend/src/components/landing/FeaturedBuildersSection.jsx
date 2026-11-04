import { UserCheck, Code2, ExternalLink, GraduationCap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FeaturedBuildersSection({ builders, loading }) {
  if (!loading && (!builders || builders.length === 0)) {
    return null;
  }

  const getInitials = (name) => {
    if (!name) return 'HB';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <section className="border-t border-slate-200/80 bg-slate-100/40 py-16 dark:border-white/[0.08] dark:bg-ink-900/30 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="eyebrow block">Maker Directory</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Meet Verified Builders.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Engineers, designers, and AI practitioners ready to collaborate on high-impact hackathon projects.
          </p>
        </div>

        {/* Builder Cards Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-2xl border border-slate-200/80 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5"
                />
              ))
            : builders.map((builder) => (
                <div
                  key={builder._id}
                  className="glass-card flex flex-col justify-between p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-400/40 hover:shadow-card-hover dark:hover:border-brand-400/30"
                >
                  <div>
                    {/* Header: Initials + Branch */}
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500/15 to-indigo-500/20 font-display text-sm font-bold text-brand-600 dark:from-brand-400/20 dark:to-indigo-400/25 dark:text-brand-300 shadow-sm">
                        {getInitials(builder.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {builder.name}
                        </h3>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {builder.branch || 'Maker'} · Year {builder.year || '1'}
                        </p>
                      </div>
                    </div>

                    {/* Bio Snippet */}
                    {builder.bio && (
                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300 italic">
                        "{builder.bio}"
                      </p>
                    )}

                    {/* Skills Chips */}
                    <div className="mt-4 flex flex-wrap gap-1">
                      {builder.skills &&
                        builder.skills.slice(0, 4).map((skill) => (
                          <span key={skill} className="skill-badge text-[10px] py-0.5">
                            {skill}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Card Footer: Experience Level Badge */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200/70 pt-3 dark:border-white/[0.08] text-[11px]">
                    <span className="capitalize font-semibold text-slate-500 dark:text-slate-400">
                      {builder.experienceLevel || 'Intermediate'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <UserCheck size={13} /> Verified
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

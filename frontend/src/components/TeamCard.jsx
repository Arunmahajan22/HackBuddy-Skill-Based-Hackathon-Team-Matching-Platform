import { memo } from 'react';
import { Users, Zap, Check, Shield, ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';

export const TeamCard = memo(function TeamCard({ team, currentUserId, onRequest }) {
  const creatorId = team.creator?._id || team.creator;
  const isCreator = String(creatorId) === String(currentUserId);
  const isMember = team.members?.some(
    (member) => String(member._id || member) === String(currentUserId),
  );
  const memberCount = team.members?.length || 0;
  const openSpots = Math.max(0, team.teamSizeLimit - memberCount);

  const getCreatorInitials = (name) => {
    if (!name) return 'CR';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <article
      className="glass-card group flex h-full flex-col justify-between p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-400/40 hover:shadow-card-hover dark:hover:border-brand-400/30"
      aria-labelledby={`team-title-${team._id}`}
    >
      <div>
        {/* Top Header: Hackathon Name Badge & Open Spots Indicator */}
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-md border border-brand-500/20 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
            {team.hackathonName}
          </span>

          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              openSpots > 0
                ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                : 'bg-slate-200/80 text-slate-600 dark:bg-white/10 dark:text-slate-400',
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                openSpots > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400',
              )}
            />
            {openSpots > 0 ? `${openSpots} open` : 'Full'}
          </span>
        </div>

        {/* Creator Info */}
        <div className="mt-4 flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 font-display text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">
            {getCreatorInitials(team.creator?.name)}
          </span>
          <div className="min-w-0">
            <h2
              id={`team-title-${team._id}`}
              className="truncate text-sm font-bold text-slate-900 dark:text-white"
            >
              {team.creator?.name ? `${team.creator.name}’s Team` : 'Hackathon Crew'}
            </h2>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {team.creator?.branch || 'Builder'} {team.creator?.year ? `· Year ${team.creator.year}` : ''}
            </p>
          </div>
        </div>

        {/* Project Description */}
        <p className="mt-3.5 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {team.description}
        </p>

        {/* Required Skills Chips */}
        <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Required skills">
          {team.requiredSkills?.map((skill) => (
            <span key={skill} className="skill-badge text-[11px] py-0.5">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer: Visual Member Seats + Action Button */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-200/80 pt-4 dark:border-white/10">
        {/* Visual Seat Indicator */}
        <div className="flex items-center gap-1">
          {Array.from({ length: team.teamSizeLimit }).map((_, idx) => {
            const isFilled = idx < memberCount;
            return (
              <div
                key={idx}
                title={isFilled ? 'Seat Filled' : 'Open Seat'}
                className={cn(
                  'size-2.5 rounded-full transition-all',
                  isFilled
                    ? 'bg-brand-600 dark:bg-brand-400'
                    : 'border border-dashed border-slate-300 bg-slate-100 dark:border-white/20 dark:bg-white/5',
                )}
              />
            );
          })}
          <span className="ml-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {memberCount}/{team.teamSizeLimit}
          </span>
        </div>

        {/* Context-aware Action Controls */}
        {isCreator ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400">
            <Shield size={13} /> Your Team
          </span>
        ) : isMember ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Check size={14} /> You're in
          </span>
        ) : (
          <button
            type="button"
            disabled={openSpots <= 0}
            onClick={() => onRequest(team)}
            aria-label={`Request to join ${team.hackathonName}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-glow active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Zap size={13} />
            <span>Apply to Join</span>
            <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        )}
      </div>
    </article>
  );
});

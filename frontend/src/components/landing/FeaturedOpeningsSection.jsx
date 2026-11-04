import { Link } from 'react-router-dom';
import { Compass, Plus, Users, ArrowRight, Sparkles } from 'lucide-react';
import { TeamCard } from '../TeamCard';
import { useAuth } from '../../contexts/AuthContext';

export function FeaturedOpeningsSection({ teams, loading, onRequestTeam }) {
  const { user } = useAuth();

  return (
    <section id="openings" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
              <Sparkles size={13} />
              <span>Live Opportunities</span>
            </div>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Recent Hackathon Team Openings.
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              Discover real hackathon projects actively recruiting teammates. Match your skills and submit a request.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/explore" className="secondary-button text-xs py-2 px-3.5">
              <Compass size={14} />
              <span>View All Openings</span>
            </Link>
            <Link to="/teams/new" className="primary-button text-xs py-2 px-3.5 shadow-glow">
              <Plus size={14} />
              <span>Post Opening</span>
            </Link>
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl border border-slate-200/80 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5"
                />
              ))}
            </div>
          ) : teams && teams.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <TeamCard
                  key={team._id}
                  team={team}
                  currentUserId={user?._id}
                  onRequest={onRequestTeam}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card grid min-h-64 place-items-center p-8 text-center">
              <div className="max-w-md">
                <Users className="mx-auto text-brand-500" size={36} />
                <h3 className="mt-3 font-display text-base font-bold text-slate-900 dark:text-white">
                  No active team openings yet
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Be the first maker to publish a hackathon project concept and assemble your dream build crew.
                </p>
                <Link to="/teams/new" className="primary-button mt-4 text-xs">
                  <Plus size={14} />
                  <span>Post the First Opening</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

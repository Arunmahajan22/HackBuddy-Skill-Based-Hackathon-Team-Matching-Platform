import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  AlertCircle,
  Check,
  Sparkles,
  UsersRound,
  Calendar,
  Clock,
  MessageCircle,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import api from '../lib/api';

function MatchRing({ score }) {
  return (
    <div
      className="grid size-16 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(#6366f1 ${score * 3.6}deg, #e2e8f0 0deg)` }}
    >
      <div className="grid size-12 place-items-center rounded-full bg-white text-sm font-extrabold text-brand-600 dark:bg-ink-900 dark:text-brand-300">
        {score}%
      </div>
    </div>
  );
}

const statusBadgeStyles = {
  open: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300',
  weekends: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-300',
  evenings: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300',
  limited: 'bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-300',
  unavailable: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300',
};

const statusLabels = {
  open: 'Open to collaborate',
  weekends: 'Weekends only',
  evenings: 'Evenings only',
  limited: 'Limited availability',
  unavailable: 'Unavailable',
};

export default function MatchesPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users/recommendations', { params: { limit: 30 } });
      setRecommendations(data.recommendations || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load smart matches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return recommendations;
    return recommendations.filter((item) => {
      const status = item.availabilityMatch?.status || item.user?.availability?.status || item.user?.availability;
      return status === statusFilter;
    });
  }, [recommendations, statusFilter]);

  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow inline-flex items-center gap-1">
              <Sparkles size={13} /> Smart compatibility
            </span>
            <h1 className="mt-2 font-display text-3xl font-extrabold">Find complementary teammates.</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ranked dynamically by technical skill complementarity, shared interests, and schedule availability.
            </p>
          </div>

          {/* Schedule Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Filter size={12} /> Schedule:
            </span>
            {[
              { id: 'all', label: 'All schedules' },
              { id: 'open', label: 'Open' },
              { id: 'weekends', label: 'Weekends' },
              { id: 'evenings', label: 'Evenings' },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  statusFilter === filter.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6 flex gap-2 rounded-xl bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/5" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ user, matchScore, reasons, strongestComplementarySkills, availabilityMatch }) => {
              const statusKey = availabilityMatch?.status || 'open';
              const availDays =
                availabilityMatch?.sharedDays?.length
                  ? availabilityMatch.sharedDays
                  : user.availability?.availableDays || [];
              const timeSlots =
                availabilityMatch?.sharedTimeSlots?.length
                  ? availabilityMatch.sharedTimeSlots
                  : user.availability?.timeSlots || [];

              return (
                <article key={user._id} className="glass-card flex flex-col justify-between p-5">
                  <div>
                    {/* Top Maker Header */}
                    <div className="flex items-start gap-3">
                      <MatchRing score={matchScore} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h2 className="truncate font-display text-lg font-bold">{user.name}</h2>
                        </div>
                        <p className="text-xs text-slate-500">
                          {user.branch} · Year {user.year} · <span className="capitalize">{user.experienceLevel}</span>
                        </p>
                        {/* Availability Status Badge */}
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                              statusBadgeStyles[statusKey] || statusBadgeStyles.open
                            }`}
                          >
                            <Calendar size={11} />
                            {statusLabels[statusKey] || statusLabels.open}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {user.bio || 'Builder profile ready for hackathon team collaboration.'}
                    </p>

                    {/* Schedule Pills */}
                    {(availDays.length > 0 || timeSlots.length > 0) && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-white/5">
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Clock size={11} /> Schedule:
                        </span>
                        {availDays.slice(0, 3).map((day) => (
                          <span
                            key={day}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300"
                          >
                            {day.slice(0, 3)}
                          </span>
                        ))}
                        {timeSlots.slice(0, 2).map((slot) => (
                          <span
                            key={slot}
                            className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-600 dark:text-brand-300"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Why this match? */}
                    <div className="mt-4 border-t border-slate-200/80 pt-3 dark:border-white/10">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Why this match?</p>
                      <ul className="mt-2 space-y-1.5">
                        {reasons.length ? (
                          reasons.map((reason) => (
                            <li key={reason} className="flex gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                              <Check size={14} className="shrink-0 text-emerald-500 mt-0.5" />
                              <span>{reason}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-slate-500">
                            Complete your skills and availability to strengthen recommendations.
                          </li>
                        )}
                      </ul>

                      {strongestComplementarySkills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {strongestComplementarySkills.map((skill) => (
                            <span className="skill-badge text-[10px]" key={skill}>
                              + {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 border-t border-slate-100 pt-3 dark:border-white/5">
                    <Link
                      to={`/chat?user=${user._id}`}
                      className="secondary-button w-full justify-center text-xs py-2"
                    >
                      <MessageCircle size={14} />
                      <span>Message Teammate</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="glass-card mt-7 grid min-h-64 place-items-center p-8 text-center">
            <div>
              <UsersRound className="mx-auto text-brand-500" size={38} />
              <h2 className="mt-3 font-bold">No teammates matched this filter</h2>
              <p className="mt-1 text-sm text-slate-500">
                Try selecting "All schedules" or invite more builders to your network.
              </p>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}

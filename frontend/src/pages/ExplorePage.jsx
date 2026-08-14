import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, SlidersHorizontal, UsersRound, ChevronLeft, ChevronRight, RotateCcw, Sparkles, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Layout } from '../components/Layout';
import { TeamCard } from '../components/TeamCard';
import { JoinRequestModal } from '../components/JoinRequestModal';
import { useAuth } from '../contexts/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { useSocket } from '../contexts/SocketContext';

const POPULAR_SKILL_PILLS = [
  'React',
  'Node.js',
  'Python',
  'TypeScript',
  'UI/UX',
  'AI / ML',
  'Next.js',
  'Rust',
  'Solidity',
];

export default function ExplorePage() {
  const { user } = useAuth();
  const { toast } = useSocket();
  const [teams, setTeams] = useState([]);
  const [queryInput, setQueryInput] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce search input to avoid excessive network traffic
  const debouncedQuery = useDebounce(queryInput, 350);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/teams', {
        params: {
          q: debouncedQuery.trim() || undefined,
          skill: selectedSkill.trim() || undefined,
          page,
          limit: 8,
        },
      });

      if (data.success) {
        setTeams(data.teams || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (_error) {
      setError('Unable to load teams at this moment. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedSkill, page]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Reset to page 1 on query/skill change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, selectedSkill]);

  const handleRequestTeam = useCallback((team) => {
    setSelectedTeam(team);
  }, []);

  const handleClearFilters = () => {
    setQueryInput('');
    setSelectedSkill('');
    setPage(1);
  };

  const handleRequestSuccess = () => {
    const teamName = selectedTeam?.hackathonName || 'the team';
    setSelectedTeam(null);
    toast('success', `Join request submitted for ${teamName}!`);
    fetchTeams();
  };

  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Page Hero Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
              <Sparkles size={13} />
              <span>Team Discovery Feed</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Find your next build crew.
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Explore live hackathon team rosters, match your skill set, and ship together.
            </p>
          </div>

          <Link to="/teams/new" className="primary-button shrink-0 shadow-glow">
            <Plus size={16} />
            <span>Post Team Opening</span>
          </Link>
        </div>

        {/* Search & Quick Skill Filters Bar */}
        <div className="glass-card mt-8 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Main Search Input */}
            <div className="relative flex-1">
              <input
                id="explore-search"
                className="field-input mt-0 pl-10 text-sm"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Search by hackathon name, topic, or idea (e.g. MIT HackMIT, AI Agent, Web3)…"
              />
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            </div>

            {/* Clear Filters CTA */}
            {(queryInput || selectedSkill) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="secondary-button shrink-0 text-xs py-2.5"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Quick Skill Filter Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-200/60 dark:border-white/[0.06]">
            <span className="mr-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Filter size={11} /> Filter Skill:
            </span>

            <button
              type="button"
              onClick={() => setSelectedSkill('')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                !selectedSkill
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              All Skills
            </button>

            {POPULAR_SKILL_PILLS.map((skill) => {
              const isSelected = selectedSkill.toLowerCase() === skill.toLowerCase();
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setSelectedSkill(isSelected ? '' : skill)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Toolbar */}
        <div className="mt-6 flex items-center justify-between px-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Showing <span className="font-bold text-slate-900 dark:text-white">{teams.length}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{pagination.total}</span> open opportunities
          </p>
        </div>

        {/* Teams Grid */}
        <div className="mt-4">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl border border-slate-200/80 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5"
                />
              ))}
            </div>
          ) : teams.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                {teams.map((team) => (
                  <TeamCard
                    key={team._id}
                    team={team}
                    currentUserId={user?._id}
                    onRequest={handleRequestTeam}
                  />
                ))}
              </div>

              {/* Linear-Style Pagination Toolbar */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between border-t border-slate-200/80 pt-5 dark:border-white/10">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Page <span className="font-bold text-slate-900 dark:text-white">{pagination.page}</span> of{' '}
                    <span className="font-bold text-slate-900 dark:text-white">{pagination.totalPages}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-label="Go to previous page"
                      className="secondary-button text-xs py-1.5 px-3 disabled:opacity-40"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="hidden items-center gap-1 sm:flex">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setPage(num)}
                          className={`size-8 rounded-lg text-xs font-bold transition ${
                            pagination.page === num
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={!pagination.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                      aria-label="Go to next page"
                      className="secondary-button text-xs py-1.5 px-3 disabled:opacity-40"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card grid min-h-80 place-items-center p-8 text-center">
              <div className="max-w-sm">
                <UsersRound className="mx-auto text-brand-500" size={40} />
                <h2 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">
                  No matching team openings found
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Try clearing your search query or skill filter, or create a team opening to attract developers to your idea.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="primary-button mt-5 text-xs"
                >
                  Reset all filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Join Request Dialog Modal */}
      {selectedTeam && (
        <JoinRequestModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </Layout>
  );
}

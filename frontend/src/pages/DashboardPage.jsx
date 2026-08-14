import { useEffect, useState, useCallback, useMemo } from 'react';
import { Check, Inbox, Plus, UsersRound, X, Layers, Clock, CheckCircle2, XCircle, Sparkles, RefreshCw, ArrowRight, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const { eventVersion, toast } = useSocket();
  const [teams, setTeams] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load creator teams and incoming requests in parallel
  const loadDashboardData = useCallback(async () => {
    setError('');

    try {
      const [teamsRes, requestsRes] = await Promise.all([
        api.get('/teams/mine'),
        api.get('/requests/incoming'),
      ]);

      if (teamsRes.data.success) {
        setTeams(teamsRes.data.teams || []);
      }
      if (requestsRes.data.success) {
        setRequests(requestsRes.data.requests || []);
      }
    } catch (_error) {
      setError('Unable to synchronize your dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDashboardData();
  }, [loadDashboardData, eventVersion]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  // Handle Accept / Reject Decision
  const handleUpdateStatus = async (requestId, status) => {
    setActionLoadingId(requestId);
    try {
      const { data } = await api.patch(`/requests/${requestId}`, { status });
      if (data.success) {
        toast(
          status === 'accepted' ? 'success' : 'info',
          `Applicant successfully ${status}.`,
        );
        await loadDashboardData();
      }
    } catch (requestError) {
      const message =
        requestError.response?.data?.message || 'Unable to process this application.';
      toast('error', message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Derived Analytics Stats
  const filteredRequests = useMemo(() => {
    if (activeTab === 'all') return requests;
    return requests.filter((r) => r.status === activeTab);
  }, [requests, activeTab]);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === 'pending').length,
    [requests],
  );

  const acceptedCount = useMemo(
    () => requests.filter((r) => r.status === 'accepted').length,
    [requests],
  );

  const totalMembers = useMemo(
    () => teams.reduce((acc, t) => acc + (t.members?.length || 0), 0),
    [teams],
  );

  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Creator Dashboard Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
              <Shield size={13} />
              <span>Creator Command Center</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Your Teams & Applications.
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Welcome back, {user?.name?.split(' ')[0]}. Review candidate applications and monitor your team capacity.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleManualRefresh}
              aria-label="Refresh dashboard data"
              className="icon-button"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>

            <Link to="/teams/new" className="primary-button shrink-0 shadow-glow">
              <Plus size={16} />
              <span>Post Team Opening</span>
            </Link>
          </div>
        </div>

        {/* 4 Overview Stat Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Posted Teams</span>
              <span className="grid size-7 place-items-center rounded-lg bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400">
                <Layers size={15} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold text-slate-900 dark:text-white">
              {teams.length}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Active team rosters</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
              <span className="grid size-7 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                <Clock size={15} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Awaiting your decision</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Accepted</span>
              <span className="grid size-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                <CheckCircle2 size={15} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {acceptedCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Teammates recruited</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Members</span>
              <span className="grid size-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                <UsersRound size={15} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalMembers}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Across all posted teams</p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Main 2-Column Content */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Column 1: Posted Teams with Capacity Progress */}
          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400">
                  <UsersRound size={16} />
                </span>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Your Posted Teams
                </h2>
              </div>
              <span className="skill-badge text-[11px] py-0.5">
                {teams.length} {teams.length === 1 ? 'team' : 'teams'}
              </span>
            </div>

            <div className="mt-5 space-y-3.5">
              {loading ? (
                <div className="h-32 animate-pulse rounded-xl bg-slate-200/80 dark:bg-white/5" />
              ) : teams.length > 0 ? (
                teams.map((team) => {
                  const memberCount = team.members?.length || 1;
                  const capacityPercent = Math.min(100, Math.round((memberCount / team.teamSizeLimit) * 100));
                  const openSpots = Math.max(0, team.teamSizeLimit - memberCount);

                  return (
                    <div
                      key={team._id}
                      className="rounded-xl border border-slate-200/80 bg-white/70 p-4 transition hover:border-brand-400/40 hover:shadow-sm dark:border-white/[0.07] dark:bg-white/[0.02]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {team.hackathonName}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                            {team.description}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            openSpots > 0
                              ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                          }`}
                        >
                          {openSpots > 0 ? `${openSpots} open` : 'Full'}
                        </span>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="mt-3.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Roster Capacity</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {memberCount} / {team.teamSizeLimit} members ({capacityPercent}%)
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              capacityPercent >= 100
                                ? 'bg-slate-400'
                                : 'bg-gradient-to-r from-brand-500 to-indigo-600'
                            }`}
                            style={{ width: `${capacityPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {team.requiredSkills.map((skill) => (
                          <span key={skill} className="skill-badge text-[10px] py-0.5">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No teams posted yet</p>
                  <p className="mt-1">Post a team opportunity to start recruiting candidates.</p>
                  <Link
                    to="/teams/new"
                    className="primary-button mt-4 text-xs"
                  >
                    <Plus size={14} /> Post Team Opening
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Applicant Review Pipeline */}
          <div className="glass-card p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400">
                  <Inbox size={16} />
                </span>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Applicant Pipeline
                </h2>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex rounded-xl border border-slate-200/90 bg-slate-100/90 p-0.5 text-xs font-semibold dark:border-white/10 dark:bg-white/[0.04]">
                {[
                  { id: 'pending', label: 'Pending', count: pendingCount },
                  { id: 'accepted', label: 'Accepted', count: acceptedCount },
                  { id: 'rejected', label: 'Rejected', count: requests.filter((r) => r.status === 'rejected').length },
                  { id: 'all', label: 'All', count: requests.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition ${
                      activeTab === tab.id
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-ink-950 dark:text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      activeTab === tab.id
                        ? 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
                        : 'bg-transparent text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Requests List */}
            <div className="mt-5 space-y-3.5">
              {loading ? (
                <div className="h-32 animate-pulse rounded-xl bg-slate-200/80 dark:bg-white/5" />
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((request) => {
                  const sender = request.sender || {};
                  const isPending = request.status === 'pending';
                  const isAccepted = request.status === 'accepted';
                  const isRejected = request.status === 'rejected';

                  return (
                    <div
                      key={request._id}
                      className="rounded-xl border border-slate-200/80 bg-white/70 p-4.5 transition hover:border-slate-300 dark:border-white/[0.07] dark:bg-white/[0.02]"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500/15 to-indigo-500/20 font-display text-sm font-bold text-brand-600 dark:from-brand-400/20 dark:to-indigo-400/25 dark:text-brand-300">
                          {sender.name?.[0]?.toUpperCase() || 'U'}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {sender.name || 'Anonymous Builder'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {sender.branch} · Year {sender.year} ·{' '}
                                <span className="capitalize">{sender.experienceLevel || 'beginner'}</span>
                              </p>
                            </div>

                            {/* Status Pill */}
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                                isPending
                                  ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                  : isAccepted
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                  : 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                              }`}
                            >
                              {isPending && <Clock size={12} />}
                              {isAccepted && <CheckCircle2 size={12} />}
                              {isRejected && <XCircle size={12} />}
                              {request.status}
                            </span>
                          </div>

                          <p className="mt-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
                            Applied for: {request.teamName}
                          </p>

                          {/* Candidate Skills */}
                          {sender.skills && sender.skills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {sender.skills.map((s) => (
                                <span key={s} className="skill-badge text-[10px] py-0.5">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Note message */}
                          {request.message && (
                            <div className="mt-3 rounded-lg border border-slate-200/70 bg-slate-50/80 p-3 text-xs italic text-slate-700 dark:border-white/5 dark:bg-black/25 dark:text-slate-300">
                              “{request.message}”
                            </div>
                          )}

                          {/* Action Buttons with Loading Spinners */}
                          {isPending && (
                            <div className="mt-4 flex items-center gap-2.5">
                              <button
                                type="button"
                                disabled={actionLoadingId === request._id}
                                onClick={() => handleUpdateStatus(request._id, 'accepted')}
                                className="action-accept"
                              >
                                <Check size={14} />
                                <span>{actionLoadingId === request._id ? 'Accepting…' : 'Accept Applicant'}</span>
                              </button>

                              <button
                                type="button"
                                disabled={actionLoadingId === request._id}
                                onClick={() => handleUpdateStatus(request._id, 'rejected')}
                                className="action-reject"
                              >
                                <X size={14} />
                                <span>{actionLoadingId === request._id ? 'Rejecting…' : 'Decline'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <Inbox className="mx-auto mb-2 text-slate-400" size={28} />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No {activeTab === 'all' ? '' : activeTab} applications
                  </p>
                  <p className="mt-1">When builders request to join your teams, they will appear here in real-time.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

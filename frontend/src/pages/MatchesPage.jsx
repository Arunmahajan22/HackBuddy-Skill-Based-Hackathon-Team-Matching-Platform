import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, Sparkles, UsersRound } from 'lucide-react';
import { Layout } from '../components/Layout';
import api from '../lib/api';

function MatchRing({ score }) {
  return <div className="grid size-16 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#6366f1 ${score * 3.6}deg, #e2e8f0 0deg)` }}><div className="grid size-12 place-items-center rounded-full bg-white text-sm font-extrabold text-brand-600 dark:bg-ink-900 dark:text-brand-300">{score}%</div></div>;
}

export default function MatchesPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/users/recommendations', { params: { limit: 20 } }); setRecommendations(data.recommendations || []); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load smart matches.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return <Layout><section className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><div className="flex items-end justify-between gap-4"><div><span className="eyebrow inline-flex items-center gap-1"><Sparkles size={13} /> Smart compatibility</span><h1 className="mt-2 font-display text-3xl font-extrabold">Find complementary teammates.</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ranked server-side by complementary strengths, shared interests, and experience—not just identical skills.</p></div></div>
    {error && <div className="mt-6 flex gap-2 rounded-xl bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300"><AlertCircle size={17} />{error}</div>}
    {loading ? <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/5" />)}</div> : recommendations.length ? <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{recommendations.map(({ user, matchScore, reasons, strongestComplementarySkills }) => <article key={user._id} className="glass-card p-5"><div className="flex items-start gap-3"><MatchRing score={matchScore} /><div className="min-w-0"><h2 className="truncate font-display text-lg font-bold">{user.name}</h2><p className="text-xs text-slate-500">{user.branch} · Year {user.year} · <span className="capitalize">{user.experienceLevel}</span></p><p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{user.bio || 'Builder profile ready for a hackathon collaboration.'}</p></div></div><div className="mt-4 border-t border-slate-200/80 pt-3 dark:border-white/10"><p className="text-xs font-bold text-slate-700 dark:text-slate-200">Why this match?</p><ul className="mt-2 space-y-1.5">{reasons.length ? reasons.map((reason) => <li key={reason} className="flex gap-1.5 text-xs text-slate-600 dark:text-slate-300"><Check size={14} className="shrink-0 text-emerald-500" />{reason}</li>) : <li className="text-xs text-slate-500">Complete your skills and interests to improve recommendations.</li>}</ul>{strongestComplementarySkills.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{strongestComplementarySkills.map((skill) => <span className="skill-badge text-[10px]" key={skill}>+ {skill}</span>)}</div>}</div></article>)}</div> : <div className="glass-card mt-7 grid min-h-64 place-items-center p-8 text-center"><div><UsersRound className="mx-auto text-brand-500" size={38} /><h2 className="mt-3 font-bold">No teammates to compare yet</h2><p className="mt-1 text-sm text-slate-500">Invite more builders or complete your profile to strengthen recommendations.</p></div></div>}</section></Layout>;
}

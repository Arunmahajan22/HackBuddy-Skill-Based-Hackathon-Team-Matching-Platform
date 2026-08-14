import { useState } from 'react';
import { ArrowRight, Sparkles, AlertCircle, Users, Eye, Plus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const SUGGESTED_SKILLS = [
  'React',
  'Node.js',
  'TypeScript',
  'Python',
  'UI/UX',
  'PyTorch',
  'Next.js',
  'Tailwind CSS',
  'Docker',
  'Go',
  'Solidity',
  'Figma',
];

export default function CreateTeamPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useSocket();
  const [form, setForm] = useState({
    hackathonName: '',
    description: '',
    requiredSkills: '',
    teamSizeLimit: 4,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleAddSkillChip = (skill) => {
    const current = form.requiredSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!current.includes(skill)) {
      const updated = [...current, skill].join(', ');
      setForm({ ...form, requiredSkills: updated });
    }
  };

  const parsedSkills = form.requiredSkills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.hackathonName.trim()) {
      setError('Please provide the hackathon name.');
      return;
    }

    if (form.description.trim().length < 20) {
      setError('Project description must be at least 20 characters.');
      return;
    }

    if (!parsedSkills.length) {
      setError('Please specify at least one required skill for your team opening.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/teams', {
        hackathonName: form.hackathonName.trim(),
        description: form.description.trim(),
        requiredSkills: parsedSkills,
        teamSizeLimit: Number(form.teamSizeLimit),
      });

      if (data.success) {
        toast('success', `Team opening for "${form.hackathonName}" published!`);
        navigate('/app');
      }
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.response?.data?.errors?.[0]?.message ||
        'Unable to create team opening. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
              <Sparkles size={13} />
              <span>Team Builder</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Post a Team Opportunity.
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Set the hackathon goal, target tech stack, and open seats for ambitious collaborators.
            </p>
          </div>
        </div>

        {/* 2-Column Layout: Form + Live Card Preview */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Column 1: Creation Form */}
          <div className="glass-card p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-xs font-medium text-rose-700 dark:text-rose-300"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="team-hackathon" className="field-label">
                  Hackathon Name *
                </label>
                <input
                  id="team-hackathon"
                  className="field-input"
                  name="hackathonName"
                  required
                  value={form.hackathonName}
                  onChange={updateField}
                  placeholder="e.g. MIT HackMIT 2026, CalHacks, ETHGlobal Tokyo"
                />
              </div>

              <div>
                <label htmlFor="team-description" className="field-label">
                  What are you building? (min 20 characters) *
                </label>
                <textarea
                  id="team-description"
                  className="field-input min-h-32 resize-y text-xs leading-relaxed"
                  name="description"
                  required
                  value={form.description}
                  onChange={updateField}
                  placeholder="Describe your project concept, target problem, architecture ideas, and what kind of teammate will thrive here…"
                />
              </div>

              <div>
                <label htmlFor="team-skills" className="field-label">
                  Required Skills <span className="font-normal text-slate-400 normal-case">(comma-separated)</span> *
                </label>
                <input
                  id="team-skills"
                  className="field-input"
                  name="requiredSkills"
                  value={form.requiredSkills}
                  onChange={updateField}
                  placeholder="React, TypeScript, PyTorch, Node.js"
                />

                {/* Quick Add Suggested Skills */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Quick add:</span>
                  {SUGGESTED_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleAddSkillChip(skill)}
                      className="rounded-md border border-slate-200 bg-slate-100/70 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-brand-400/30 dark:hover:bg-brand-400/10 dark:hover:text-brand-300"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Size Limit Selector */}
              <div>
                <label htmlFor="team-size" className="field-label">
                  Total Team Capacity *
                </label>
                <select
                  id="team-size"
                  className="field-input"
                  name="teamSizeLimit"
                  value={form.teamSizeLimit}
                  onChange={updateField}
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((size) => (
                    <option key={size} value={size}>
                      {size} members max ({size - 1} open {size - 1 === 1 ? 'seat' : 'seats'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/5 p-3.5 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                <ShieldCheck size={16} className="shrink-0 text-brand-600 dark:text-brand-400" />
                <span>
                  As creator, you take seat #1. The atomic concurrency lock will prevent candidates from exceeding {form.teamSizeLimit} members.
                </span>
              </div>

              <div className="pt-2">
                <button
                  disabled={loading}
                  className="primary-button w-full sm:w-auto"
                  type="submit"
                >
                  {loading ? (
                    'Publishing opening…'
                  ) : (
                    <>
                      <span>Publish Team Opening</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Column 2: Live Interactive Card Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                <Eye size={14} />
                <span>Live Feed Card Preview</span>
              </div>

              <div className="glass-card p-6 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-md border border-brand-500/20 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
                    {form.hackathonName || 'Hackathon Name'}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {form.teamSizeLimit - 1} open
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 font-display text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {user?.name ? `${user.name}’s Team` : 'Your Team'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user?.branch || 'Department'} · Year {user?.year || '1'}
                    </p>
                  </div>
                </div>

                <p className="mt-3.5 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {form.description || 'Your project description and builder profile will appear here as you type…'}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {parsedSkills.length > 0 ? (
                    parsedSkills.map((skill) => (
                      <span key={skill} className="skill-badge text-[11px] py-0.5">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs italic text-slate-400">Required skills will appear here</span>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-200/80 pt-4 dark:border-white/10">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: form.teamSizeLimit }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`size-2.5 rounded-full ${
                          idx === 0
                            ? 'bg-brand-600 dark:bg-brand-400'
                            : 'border border-dashed border-slate-300 bg-slate-100 dark:border-white/20 dark:bg-white/5'
                        }`}
                      />
                    ))}
                    <span className="ml-1.5 text-[11px] font-medium text-slate-500">
                      1/{form.teamSizeLimit} members
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400">
                    Your Team
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

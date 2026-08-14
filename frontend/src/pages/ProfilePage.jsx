import { useEffect, useState } from 'react';
import { Code2, Save, UserRound, AlertCircle, Sparkles, ExternalLink, X, Check } from 'lucide-react';
import api from '../lib/api';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'UI/UX',
  'PyTorch',
  'Next.js',
  'Tailwind CSS',
  'GraphQL',
  'Docker',
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useSocket();
  const [form, setForm] = useState(null);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/users/me');
        if (isMounted && data.success && data.user) {
          setForm(data.user);
        }
      } catch (_error) {
        if (isMounted && user) {
          setForm(user);
        }
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!form) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-white/5" />
        </div>
      </Layout>
    );
  }

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || newSkillInput).trim();
    if (trimmed && !form.skills?.includes(trimmed)) {
      setForm({
        ...form,
        skills: [...(form.skills || []), trimmed],
      });
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setForm({
      ...form,
      skills: (form.skills || []).filter((s) => s !== skillToRemove),
    });
  };

  const handleKeyDownSkill = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        name: form.name?.trim(),
        branch: form.branch?.trim(),
        year: Number(form.year),
        bio: form.bio?.trim(),
        github: form.github?.trim(),
        experienceLevel: form.experienceLevel,
        skills: form.skills || [],
      };

      const { data } = await api.patch('/users/me', payload);

      if (data.success && data.user) {
        updateUser(data.user);
        setForm(data.user);
        toast('success', 'Profile updated successfully!');
      }
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.response?.data?.errors?.[0]?.message ||
        'Unable to update profile. Please try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // Calculate profile strength
  const calculateStrength = () => {
    let score = 0;
    if (form.name) score += 20;
    if (form.branch && form.year) score += 20;
    if (form.skills?.length > 0) score += 25;
    if (form.bio) score += 20;
    if (form.github) score += 15;
    return score;
  };

  const strength = calculateStrength();

  return (
    <Layout>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="glass-card overflow-hidden shadow-xl">
          {/* Top Profile Banner */}
          <div className="border-b border-slate-200/80 bg-brand-500/[0.06] p-6 dark:border-white/10 sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-xl font-bold text-white shadow-md shadow-brand-500/25">
                  {form.name?.[0]?.toUpperCase() || 'U'}
                </span>
                <div>
                  <span className="eyebrow block">Maker Profile</span>
                  <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {form.name || 'Your Profile'}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {form.branch || 'Department'} · Year {form.year || '1'} · <span className="capitalize">{form.experienceLevel || 'Beginner'}</span>
                  </p>
                </div>
              </div>

              {/* Profile Strength Widget */}
              <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-4 text-xs font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">Profile Strength</span>
                  <span className="text-brand-600 dark:text-brand-400">{strength}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-32 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${strength}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Name and Branch */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-name" className="field-label">
                  Full Name
                </label>
                <input
                  id="profile-name"
                  className="field-input"
                  name="name"
                  value={form.name || ''}
                  onChange={updateField}
                />
              </div>
              <div>
                <label htmlFor="profile-branch" className="field-label">
                  Branch / Department
                </label>
                <input
                  id="profile-branch"
                  className="field-input"
                  name="branch"
                  value={form.branch || ''}
                  onChange={updateField}
                />
              </div>
            </div>

            {/* Year and Experience */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-year" className="field-label">
                  Academic Year
                </label>
                <select
                  id="profile-year"
                  className="field-input"
                  name="year"
                  value={form.year || ''}
                  onChange={updateField}
                >
                  {[1, 2, 3, 4, 5].map((yr) => (
                    <option key={yr} value={yr}>
                      Year {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="profile-exp" className="field-label">
                  Experience Level
                </label>
                <select
                  id="profile-exp"
                  className="field-input"
                  name="experienceLevel"
                  value={form.experienceLevel || 'beginner'}
                  onChange={updateField}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Interactive Skills Chip Manager */}
            <div>
              <label htmlFor="profile-skills-input" className="field-label">
                Skills & Tech Stack <span className="font-normal text-slate-400 normal-case">(press Enter or comma to add)</span>
              </label>

              {/* Active Skill Chips */}
              <div className="mt-2 flex flex-wrap gap-1.5 min-h-8">
                {form.skills && form.skills.length > 0 ? (
                  form.skills.map((skill) => (
                    <span
                      key={skill}
                      className="skill-badge text-xs py-1 pl-2.5 pr-1.5 flex items-center gap-1.5 group"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="rounded-full p-0.5 hover:bg-brand-500/20 text-slate-400 hover:text-rose-600"
                        aria-label={`Remove ${skill}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic text-slate-400">No skills added yet</span>
                )}
              </div>

              {/* Skill Input */}
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  id="profile-skills-input"
                  className="field-input mt-0 text-xs"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={handleKeyDownSkill}
                  placeholder="Type a skill and press Enter…"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="secondary-button text-xs py-2 px-3 shrink-0"
                >
                  Add Skill
                </button>
              </div>

              {/* Suggested Skills */}
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="text-[11px] text-slate-400">Quick add:</span>
                {POPULAR_SKILLS.filter((s) => !form.skills?.includes(s)).slice(0, 6).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    className="rounded-md border border-slate-200 bg-slate-100/70 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-brand-400/30 dark:hover:bg-brand-400/10 dark:hover:text-brand-300"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="profile-bio" className="field-label">
                Bio / About You <span className="font-normal text-slate-400 normal-case">(max 500 characters)</span>
              </label>
              <textarea
                id="profile-bio"
                className="field-input min-h-28 resize-y text-xs leading-relaxed"
                name="bio"
                maxLength={500}
                value={form.bio || ''}
                onChange={updateField}
                placeholder="Share your background, recent hackathon projects, and what roles you excel at…"
              />
            </div>

            {/* GitHub */}
            <div>
              <label htmlFor="profile-github" className="field-label">
                <span className="inline-flex items-center gap-1.5">
                  <Code2 size={14} /> GitHub Profile URL
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="profile-github"
                  className="field-input text-xs"
                  name="github"
                  value={form.github || ''}
                  onChange={updateField}
                  placeholder="https://github.com/your-username"
                />
                {form.github && (
                  <a
                    href={form.github.startsWith('http') ? form.github : `https://${form.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="icon-button shrink-0"
                    title="Open GitHub profile in new tab"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                disabled={saving}
                className="primary-button w-full sm:w-auto"
                type="submit"
              >
                <Save size={15} />
                <span>{saving ? 'Saving changes…' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
}

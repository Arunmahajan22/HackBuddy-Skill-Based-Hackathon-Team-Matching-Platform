import { useEffect, useState } from 'react';
import { Code2, Save, AlertCircle, Sparkles, ExternalLink, X, UsersRound, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [teams, setTeams] = useState([]);

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
    api.get('/teams/joined').then(({ data }) => { if (isMounted) setTeams(data.teams || []); }).catch(() => {});
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

  const updateProject = (index, field, value) => setForm({ ...form, projects: (form.projects || []).map((project, projectIndex) => projectIndex === index ? { ...project, [field]: value } : project) });
  const addProject = () => setForm({ ...form, projects: [...(form.projects || []), { title: '', description: '', url: '', technologies: [] }] });
  const removeProject = (index) => setForm({ ...form, projects: (form.projects || []).filter((_, projectIndex) => projectIndex !== index) });

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
        interests: form.interests || [],
        preferredRoles: form.preferredRoles || [],
        avatarUrl: form.avatarUrl?.trim(),
        linkedin: form.linkedin?.trim(),
        portfolio: form.portfolio?.trim(),
        hackathonExperience: Number(form.hackathonExperience || 0),
        availability: form.availability || 'open',
        preferredTeamSize: Number(form.preferredTeamSize || 4),
        projects: (form.projects || []).map((project) => ({ ...project, technologies: Array.isArray(project.technologies) ? project.technologies : String(project.technologies || '').split(',').map((item) => item.trim()).filter(Boolean) })).filter((project) => project.title?.trim()),
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
    if (form.projects?.length) score += 10;
    if (form.linkedin || form.portfolio) score += 10;
    return Math.min(100, score);
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
                {form.avatarUrl ? <img src={form.avatarUrl} alt="Profile avatar" className="size-14 rounded-2xl object-cover shadow-md" /> : <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-xl font-bold text-white shadow-md shadow-brand-500/25">{form.name?.[0]?.toUpperCase() || 'U'}</span>}
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

            <section>
            <h2 className="mb-3 font-display text-base font-bold">Profile header</h2>
            <div className="mb-4"><label htmlFor="profile-avatar" className="field-label">Profile photo URL</label><input id="profile-avatar" className="field-input" name="avatarUrl" value={form.avatarUrl || ''} onChange={updateField} placeholder="https://images.example.com/avatar.jpg" /></div>
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
            </section>

            <section><h2 className="mb-3 font-display text-base font-bold">Experience & availability</h2>
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
            <div className="mt-4 grid gap-4 sm:grid-cols-3"><div><label className="field-label">Hackathons completed</label><input className="field-input" type="number" min="0" max="100" name="hackathonExperience" value={form.hackathonExperience ?? 0} onChange={updateField} /></div><div><label className="field-label">Availability</label><select className="field-input" name="availability" value={form.availability || 'open'} onChange={updateField}><option value="open">Open to collaborate</option><option value="weekends">Weekends</option><option value="evenings">Evenings</option><option value="limited">Limited</option><option value="unavailable">Unavailable</option></select></div><div><label className="field-label">Ideal team size</label><input className="field-input" type="number" min="2" max="20" name="preferredTeamSize" value={form.preferredTeamSize ?? 4} onChange={updateField} /></div></div>
            </section>

            <section>
            <h2 className="mb-3 font-display text-base font-bold">Skills</h2>
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
            </section>

            <section><h2 className="mb-3 font-display text-base font-bold">Hackathon interests & preferred role</h2>
            {/* Bio */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-interests" className="field-label">Hackathon interests <span className="font-normal text-slate-400 normal-case">(comma separated)</span></label>
                <input id="profile-interests" className="field-input" value={(form.interests || []).join(', ')} onChange={(event) => setForm({ ...form, interests: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="AI, climate, fintech" />
              </div>
              <div>
                <label htmlFor="profile-roles" className="field-label">Preferred roles <span className="font-normal text-slate-400 normal-case">(comma separated)</span></label>
                <input id="profile-roles" className="field-input" value={(form.preferredRoles || []).join(', ')} onChange={(event) => setForm({ ...form, preferredRoles: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Frontend, product" />
              </div>
            </div>
            </section>

            <section><h2 className="mb-3 font-display text-base font-bold">About</h2>
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
            </section>

            <section><h2 className="mb-3 font-display text-base font-bold">Professional links</h2>
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
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="field-label"><ExternalLink size={14} className="mr-1 inline" />LinkedIn URL</label><input className="field-input" name="linkedin" value={form.linkedin || ''} onChange={updateField} placeholder="https://linkedin.com/in/you" /></div><div><label className="field-label"><ExternalLink size={14} className="mr-1 inline" />Portfolio URL</label><input className="field-input" name="portfolio" value={form.portfolio || ''} onChange={updateField} placeholder="https://your-site.dev" /></div></div>
            </section>

            <section><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-base font-bold">Projects</h2><button type="button" onClick={addProject} className="secondary-button px-3 py-1.5 text-xs"><Plus size={13} /> Add project</button></div><div className="space-y-3">{(form.projects || []).map((project, index) => <div key={project._id || index} className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className="flex gap-2"><input className="field-input" value={project.title || ''} onChange={(event) => updateProject(index, 'title', event.target.value)} placeholder="Project name" /><button type="button" onClick={() => removeProject(index)} className="icon-button shrink-0 text-rose-500"><X size={15} /></button></div><textarea className="field-input mt-2 min-h-20 text-xs" value={project.description || ''} onChange={(event) => updateProject(index, 'description', event.target.value)} maxLength={500} placeholder="What did you build and what was your contribution?" /><div className="mt-2 grid gap-2 sm:grid-cols-2"><input className="field-input text-xs" value={project.url || ''} onChange={(event) => updateProject(index, 'url', event.target.value)} placeholder="https://project.example" /><input className="field-input text-xs" value={Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies || ''} onChange={(event) => updateProject(index, 'technologies', event.target.value)} placeholder="React, Node.js, MongoDB" /></div></div>)}{!(form.projects || []).length && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500 dark:border-white/10">Showcase a project to make your portfolio more convincing.</p>}</div></section>

            <section className="grid gap-4 lg:grid-cols-2"><div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4"><div className="flex items-center gap-2 text-brand-700 dark:text-brand-300"><Sparkles size={16} /><h2 className="font-bold text-sm">Match compatibility</h2></div><p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Your skills, interests, role, and experience power complementary teammate recommendations.</p><Link to="/matches" className="mt-3 inline-flex text-xs font-bold text-brand-600 hover:underline">View smart matches →</Link></div><div className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className="flex items-center gap-2"><UsersRound size={16} className="text-brand-600" /><h2 className="font-bold text-sm">Team information</h2></div>{teams.length ? <div className="mt-2 space-y-1.5">{teams.slice(0, 3).map((team) => <p key={team._id} className="text-xs text-slate-600 dark:text-slate-300"><b>{team.hackathonName}</b> · {team.members?.length || 0}/{team.teamSizeLimit} members</p>)}</div> : <p className="mt-2 text-xs text-slate-500">You have not joined a team yet.</p>}</div></section>

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

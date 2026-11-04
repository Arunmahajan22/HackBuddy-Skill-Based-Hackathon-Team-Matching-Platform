import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, User, Mail, Lock, GraduationCap, Briefcase, Sparkles } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

const parseErrorMessage = (error) => {
  if (!error.response) {
    return 'Unable to connect to the backend server. Please verify the backend is running on port 5000 (run: cd backend && npm run dev).';
  }
  if (error.response.data?.message) {
    if (error.response.data.errors && error.response.data.errors.length > 0) {
      return `${error.response.data.message}: ${error.response.data.errors.map((e) => e.message || e.msg).join(', ')}`;
    }
    return error.response.data.message;
  }
  return error.response.data?.errors?.[0]?.message || 'We could not create your account. Please check the fields and try again.';
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    branch: '',
    year: '',
    bio: '',
    github: '',
    skills: '',
    experienceLevel: 'beginner',
  });
  const [error, setError] = useState('');

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.password || !form.branch.trim() || !form.year) {
      setError('Please complete all required fields marked with * to continue.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      const skillsArray = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const result = await register({
        ...form,
        year: Number(form.year),
        skills: skillsArray,
      });

      if (result?.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}&status=sent`, { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    } catch (requestError) {
      setError(parseErrorMessage(requestError));
    }
  };

  return (
    <AuthLayout
      title="Create your builder profile"
      subtitle="Join HackBuddy to find teams, post openings, and ship winning projects."
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-700 dark:text-rose-300 animate-fade-in"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Name and Email */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-name" className="field-label">
              Full Name *
            </label>
            <div className="relative mt-1">
              <input
                id="reg-name"
                className="field-input mt-0 pl-9 text-xs"
                name="name"
                required
                value={form.name}
                onChange={updateField}
                placeholder="Alex Chen"
              />
              <User size={14} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="field-label">
              Email Address *
            </label>
            <div className="relative mt-1">
              <input
                id="reg-email"
                className="field-input mt-0 pl-9 text-xs"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={updateField}
                placeholder="alex@university.edu"
              />
              <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Branch and Year */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-branch" className="field-label">
              Major / Department *
            </label>
            <div className="relative mt-1">
              <input
                id="reg-branch"
                className="field-input mt-0 pl-9 text-xs"
                name="branch"
                required
                value={form.branch}
                onChange={updateField}
                placeholder="Computer Science"
              />
              <GraduationCap size={14} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <label htmlFor="reg-year" className="field-label">
              Academic Year *
            </label>
            <select
              id="reg-year"
              className="field-input text-xs"
              name="year"
              required
              value={form.year}
              onChange={updateField}
            >
              <option value="">Select year</option>
              {[1, 2, 3, 4, 5].map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="field-label">
            Password (min 8 chars) *
          </label>
          <div className="relative mt-1">
            <input
              id="reg-password"
              className="field-input mt-0 pl-9 text-xs"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={updateField}
              placeholder="At least 8 secure characters"
            />
            <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
          </div>
        </div>

        {/* Experience and Skills */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-exp" className="field-label">
              Experience Level *
            </label>
            <select
              id="reg-exp"
              className="field-input text-xs"
              name="experienceLevel"
              value={form.experienceLevel}
              onChange={updateField}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label htmlFor="reg-skills" className="field-label">
              Skills <span className="font-normal text-slate-400 normal-case">(comma-separated)</span>
            </label>
            <input
              id="reg-skills"
              className="field-input text-xs"
              name="skills"
              value={form.skills}
              onChange={updateField}
              placeholder="React, Python, Node.js, UI/UX"
            />
          </div>
        </div>

        {/* GitHub URL */}
        <div>
          <label htmlFor="reg-github" className="field-label">
            GitHub profile URL <span className="font-normal text-slate-400 normal-case">(optional)</span>
          </label>
          <input
            id="reg-github"
            className="field-input text-xs"
            name="github"
            value={form.github}
            onChange={updateField}
            placeholder="https://github.com/your-handle"
          />
        </div>

        <button
          disabled={isLoading}
          className="primary-button w-full mt-3 shadow-glow"
          type="submit"
        >
          {isLoading ? (
            'Creating your profile…'
          ) : (
            <>
              <span>Create Builder Account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200/80 pt-5 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
        Already a HackBuddy member?{' '}
        <Link
          className="font-bold text-brand-600 hover:underline dark:text-brand-400"
          to="/login"
        >
          Sign in to your account →
        </Link>
      </div>
    </AuthLayout>
  );
}

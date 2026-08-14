import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, AlertCircle, Lock, Mail, Sparkles } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';

const parseErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.errors?.[0]?.message ||
  'We could not sign you in. Please verify your credentials and try again.';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Please enter both your email address and password.');
      return;
    }

    try {
      await login(form);
      navigate('/app', { replace: true });
    } catch (requestError) {
      setError(parseErrorMessage(requestError));
    }
  };

  return (
    <AuthLayout
      title="Welcome back to HackBuddy"
      subtitle="Sign in to manage your teams, track incoming requests, and connect."
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

        <div>
          <label htmlFor="login-email" className="field-label">
            Email Address
          </label>
          <div className="relative mt-1">
            <input
              id="login-email"
              className="field-input mt-0 pl-10"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@university.edu"
            />
            <Mail size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="field-label">
              Password
            </label>
          </div>
          <div className="relative mt-1">
            <input
              id="login-password"
              className="field-input mt-0 pl-10 pr-11"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
            />
            <Lock size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-brand-500"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          disabled={isLoading}
          className="primary-button w-full mt-3 shadow-glow"
          type="submit"
        >
          {isLoading ? (
            'Authenticating…'
          ) : (
            <>
              <span>Sign in to Dashboard</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200/80 pt-5 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
        New to HackBuddy?{' '}
        <Link
          className="font-bold text-brand-600 hover:underline dark:text-brand-400"
          to="/register"
        >
          Create your maker profile →
        </Link>
      </div>
    </AuthLayout>
  );
}

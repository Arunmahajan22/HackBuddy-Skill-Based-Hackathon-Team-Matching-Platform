import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, AlertCircle, Lock, Mail, Send, CheckCircle2, Clock } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const timerRef = useRef(null);

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setResendSuccess('');

    if (!form.email.trim() || !form.password) {
      setError('Please enter both your email address and password.');
      return;
    }

    try {
      await login(form);
      navigate('/app', { replace: true });
    } catch (requestError) {
      if (!requestError.response) {
        setError(
          'Unable to connect to the backend server. Please verify the backend is running on port 5000 (run: cd backend && npm run dev).',
        );
        return;
      }

      const responseData = requestError.response?.data;
      if (responseData?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(responseData.email || form.email.trim());
        setError(
          responseData.message ||
            'Your email address has not been verified yet. Please check your inbox or request a new verification email below.',
        );
        return;
      }

      setError(
        responseData?.message ||
          responseData?.errors?.[0]?.message ||
          'We could not sign you in. Please verify your credentials and try again.',
      );
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail || cooldown > 0 || resending) return;

    setResending(true);
    setResendSuccess('');

    try {
      const { data } = await api.post('/auth/resend-verification', {
        email: unverifiedEmail,
      });

      if (data.alreadyVerified) {
        setResendSuccess('This account has already been verified! Please sign in again.');
        setUnverifiedEmail('');
      } else {
        setResendSuccess('Verification email sent! Please check your inbox and spam folder.');
        setCooldown(60);
      }
    } catch (err) {
      if (err.response?.data?.cooldownSeconds) {
        setCooldown(err.response.data.cooldownSeconds);
      }
      setError(
        err.response?.data?.message || 'Unable to send verification email. Please try again later.',
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back to HackBuddy"
      subtitle="Sign in to manage your teams, track incoming requests, and connect."
    >
      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {/* Unverified Email Warning Box */}
        {unverifiedEmail && (
          <div
            role="alert"
            className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs font-medium text-amber-800 dark:text-amber-200 animate-fade-in"
          >
            <div className="flex items-start gap-2">
              <Clock size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-100">
                  Email Verification Required
                </p>
                <p className="mt-1 leading-relaxed text-amber-700 dark:text-amber-300">
                  We need to verify your email before you can access the dashboard.
                </p>
              </div>
            </div>

            {resendSuccess && (
              <div className="mt-3 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                <CheckCircle2 size={14} />
                <span>{resendSuccess}</span>
              </div>
            )}

            <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-amber-500/20">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition active:scale-95 disabled:opacity-50"
              >
                <Send size={12} />
                <span>
                  {resending
                    ? 'Sending…'
                    : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : 'Resend Verification Email'}
                </span>
              </button>
              <Link
                to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}&status=sent`}
                className="text-xs text-amber-800 dark:text-amber-200 underline hover:opacity-80"
              >
                Manual code verification →
              </Link>
            </div>
          </div>
        )}

        {/* General Error Alert */}
        {error && !unverifiedEmail && (
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

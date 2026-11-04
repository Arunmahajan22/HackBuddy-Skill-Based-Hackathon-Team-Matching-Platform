import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  ArrowRight,
  RefreshCw,
  Send,
  AlertCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import api from '../lib/api';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

export default function VerifyEmailPage() {
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { persistAuth } = useAuth();

  const queryToken = searchParams.get('token');
  const token = paramToken || queryToken;
  const initialEmail = searchParams.get('email') || '';
  const initialStatus = searchParams.get('status');

  const [status, setStatus] = useState(token ? 'verifying' : initialStatus === 'sent' ? 'sent' : 'idle');
  const [message, setMessage] = useState('');
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const timerRef = useRef(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  // Execute verification if token is present
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const executeVerification = async () => {
      setStatus('verifying');
      setMessage('');

      try {
        const { data } = await api.get(`/auth/verify-email/${token}`);
        if (!isMounted) return;

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Your email address has been verified successfully.');
          if (data.token && data.user && persistAuth) {
            persistAuth(data);
          }
        }
      } catch (error) {
        if (!isMounted) return;

        const errorCode = error.response?.data?.code;
        const errorMsg =
          error.response?.data?.message ||
          'Failed to verify email address. The link may be invalid or expired.';

        if (errorCode === 'TOKEN_EXPIRED') {
          setStatus('expired');
        } else {
          setStatus('invalid');
        }

        setMessage(errorMsg);
        if (error.response?.data?.email) {
          setEmailInput(error.response.data.email);
        }
      }
    };

    executeVerification();

    return () => {
      isMounted = false;
    };
  }, [token, persistAuth]);

  // Resend verification email handler
  const handleResend = async (e) => {
    if (e) e.preventDefault();
    if (!emailInput.trim() || cooldown > 0 || resending) return;

    setResending(true);
    setResendError('');
    setResendSuccess('');

    try {
      const { data } = await api.post('/auth/resend-verification', {
        email: emailInput.trim(),
      });

      if (data.alreadyVerified) {
        setResendSuccess('This email is already verified. You can sign in directly.');
      } else {
        setResendSuccess('Verification email sent! Please check your inbox and spam folder.');
        setCooldown(60); // 60s cooldown
      }
    } catch (error) {
      if (error.response?.data?.cooldownSeconds) {
        setCooldown(error.response.data.cooldownSeconds);
      }
      setResendError(
        error.response?.data?.message ||
          'Unable to send verification email. Please verify your connection or try again later.',
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <Layout>
      <section className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-lg items-center justify-center px-4 py-12 sm:px-6">
        <div className="glass-card w-full border-slate-200/90 p-6 shadow-2xl sm:p-8 dark:border-white/10 dark:bg-ink-900/90 animate-scale-up">
          {/* 1. VERIFYING STATE */}
          {status === 'verifying' && (
            <div className="text-center py-6">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400">
                <RefreshCw size={28} className="animate-spin text-brand-600 dark:text-brand-400" />
              </div>
              <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Verifying your email…
              </h1>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Validating your cryptographic token with the HackBuddy authentication authority.
              </p>
            </div>
          )}

          {/* 2. SUCCESS STATE */}
          {status === 'success' && (
            <div className="text-center py-4">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <CheckCircle2 size={36} />
              </div>

              <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                <Sparkles size={13} />
                <span>Account Activated</span>
              </div>

              <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Email Verified Successfully!
              </h1>

              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {message ||
                  'Your builder account is now verified and active. You have full access to discover hackathons, post team openings, and review applicants.'}
              </p>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                <Link
                  to="/app"
                  className="primary-button text-xs py-2.5 px-5 shadow-glow"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight size={15} />
                </Link>
                <Link
                  to="/explore"
                  className="secondary-button text-xs py-2.5 px-5"
                >
                  <span>Explore Teams</span>
                </Link>
              </div>
            </div>
          )}

          {/* 3. EXPIRED STATE */}
          {status === 'expired' && (
            <div className="py-2">
              <div className="text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <Clock size={36} />
                </div>
                <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Verification Link Expired
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  For your security, verification links expire after 24 hours. Request a new link below to activate your account.
                </p>
              </div>

              {/* Resend Box */}
              <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-white/10">
                <ResendForm
                  email={emailInput}
                  setEmail={setEmailInput}
                  onSubmit={handleResend}
                  resending={resending}
                  success={resendSuccess}
                  error={resendError}
                  cooldown={cooldown}
                />
              </div>
            </div>
          )}

          {/* 4. INVALID / USED STATE */}
          {status === 'invalid' && (
            <div className="py-2">
              <div className="text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                  <XCircle size={36} />
                </div>
                <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Invalid Verification Link
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {message ||
                    'This verification token is invalid or has already been used. If your account is already verified, you can sign in directly.'}
                </p>

                <div className="mt-4 flex justify-center gap-3">
                  <Link to="/login" className="secondary-button text-xs py-2 px-4">
                    Sign in to Account
                  </Link>
                </div>
              </div>

              {/* Resend Box */}
              <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-white/10">
                <ResendForm
                  email={emailInput}
                  setEmail={setEmailInput}
                  onSubmit={handleResend}
                  resending={resending}
                  success={resendSuccess}
                  error={resendError}
                  cooldown={cooldown}
                />
              </div>
            </div>
          )}

          {/* 5. SENT / IDLE STATE (Check Inbox Screen) */}
          {(status === 'sent' || status === 'idle') && (
            <div className="py-2">
              <div className="text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/10 dark:text-brand-400">
                  <Mail size={32} />
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
                  <ShieldCheck size={13} />
                  <span>Email Verification Sent</span>
                </div>
                <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Check Your Inbox
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  We've sent a verification link to{' '}
                  {initialEmail ? (
                    <span className="font-bold text-slate-900 dark:text-white">{initialEmail}</span>
                  ) : (
                    'your email address'
                  )}
                  . Please open the link to activate your HackBuddy builder profile.
                </p>
              </div>

              {/* Resend Form */}
              <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-white/10">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-3 text-center">
                  Didn’t receive the email? Check your spam folder or request a new link:
                </p>
                <ResendForm
                  email={emailInput}
                  setEmail={setEmailInput}
                  onSubmit={handleResend}
                  resending={resending}
                  success={resendSuccess}
                  error={resendError}
                  cooldown={cooldown}
                />
              </div>

              <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Already verified?{' '}
                <Link to="/login" className="font-bold text-brand-600 hover:underline dark:text-brand-400">
                  Sign in here →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function ResendForm({ email, setEmail, onSubmit, resending, success, error, cooldown }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs font-medium text-rose-700 dark:text-rose-300 animate-fade-in"
        >
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 animate-fade-in"
        >
          <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div>
        <label htmlFor="resend-email" className="field-label">
          Email Address
        </label>
        <div className="relative mt-1">
          <input
            id="resend-email"
            type="email"
            className="field-input mt-0 pl-9 text-xs"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
        </div>
      </div>

      <button
        type="submit"
        disabled={resending || cooldown > 0 || !email.trim()}
        className="secondary-button w-full text-xs py-2.5 disabled:opacity-50"
      >
        <Send size={13} />
        <span>
          {resending
            ? 'Sending link…'
            : cooldown > 0
            ? `Resend available in ${cooldown}s`
            : 'Resend Verification Email'}
        </span>
      </button>
    </form>
  );
}

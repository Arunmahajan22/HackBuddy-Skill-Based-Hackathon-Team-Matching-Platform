import { useState, useEffect, useRef } from 'react';
import { Send, X, AlertCircle, Sparkles, Users } from 'lucide-react';
import api from '../lib/api';

const QUICK_ROLE_CHIPS = [
  'Full-Stack Developer',
  'Frontend & UI/UX',
  'Backend & Database',
  'AI / ML Engineer',
  'Mobile Developer',
];

export function JoinRequestModal({ team, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChipClick = (role) => {
    const textToAdd = `I can contribute as a ${role}. `;
    if (!message.includes(textToAdd)) {
      setMessage((prev) => (prev ? `${prev} ${textToAdd}` : textToAdd));
    }
    textareaRef.current?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post(`/requests/teams/${team._id}`, { message: message.trim() });
      onSuccess();
    } catch (requestError) {
      const errorMessage =
        requestError.response?.data?.message ||
        requestError.response?.data?.errors?.[0]?.message ||
        'Unable to send join request. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openSpots = Math.max(0, (team.teamSizeLimit || 4) - (team.members?.length || 1));

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className="glass-card w-full max-w-lg overflow-hidden border-slate-200/90 p-0 shadow-2xl animate-scale-up dark:border-white/10 dark:bg-ink-900/95"
      >
        {/* Modal Banner Header */}
        <div className="border-b border-slate-200/80 bg-brand-500/[0.06] p-6 dark:border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="eyebrow flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Join Request</span>
              </span>
              <h2 id="modal-title" className="mt-1 font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Join {team.hackathonName}
              </h2>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Users size={13} /> {openSpots} {openSpots === 1 ? 'spot remaining' : 'spots remaining'}
                </span>
                <span>·</span>
                <span>Creator: {team.creator?.name || 'HackBuddy Builder'}</span>
              </div>
            </div>

            <button
              type="button"
              className="icon-button -mr-2 -mt-2"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs font-medium text-rose-700 dark:text-rose-300"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="join-message" className="field-label">
                A short note to the creator <span className="font-normal text-slate-400 normal-case">(optional)</span>
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                {message.length} / 500
              </span>
            </div>

            {/* Quick Helper Role Chips */}
            <div className="my-2.5 flex flex-wrap gap-1.5" aria-label="Suggested quick roles">
              {QUICK_ROLE_CHIPS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleChipClick(role)}
                  className="rounded-lg border border-slate-200/80 bg-slate-100/70 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-brand-400/40 dark:hover:bg-brand-400/10 dark:hover:text-brand-300"
                >
                  + {role}
                </button>
              ))}
            </div>

            <textarea
              id="join-message"
              ref={textareaRef}
              className="field-input min-h-28 resize-y text-xs leading-relaxed"
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce your background, tech stack experience, and what you're excited to build with this crew…"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-200/80 pt-4 dark:border-white/10">
            <span className="text-[11px] text-slate-400">
              Press <kbd className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono dark:bg-white/10">Esc</kbd> to cancel
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="secondary-button text-xs py-2 px-3.5"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                disabled={loading}
                className="primary-button text-xs py-2 px-4"
                type="submit"
              >
                <Send size={13} />
                <span>{loading ? 'Sending…' : 'Send Join Request'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

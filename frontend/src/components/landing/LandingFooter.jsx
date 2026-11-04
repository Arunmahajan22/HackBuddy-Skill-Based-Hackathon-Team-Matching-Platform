import { Link } from 'react-router-dom';
import { Code2, Sparkles, ExternalLink } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/70 pt-14 pb-10 backdrop-blur-md dark:border-white/[0.08] dark:bg-ink-950/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="group flex items-center gap-2.5 font-bold tracking-tight text-slate-900 transition hover:opacity-95 dark:text-white"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/25">
                <Code2 size={20} />
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight">
                Hack<span className="text-brand-600 dark:text-brand-400">Buddy</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              The skill-based teammate discovery platform for ambitious hackathon builders. Connect with designers, engineers, and AI practitioners to ship winning software.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://github.com/Arunmahajan22/HackBuddy-Skill-Based-Hackathon-Team-Matching-Platform"
                target="_blank"
                rel="noreferrer"
                className="icon-button"
                aria-label="View HackBuddy GitHub Repository"
              >
                <svg className="size-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 1: Product */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Product
            </h4>
            <ul className="mt-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/explore" className="hover:text-brand-600 dark:hover:text-white transition">
                  Explore Teams
                </Link>
              </li>
              <li>
                <Link to="/teams/new" className="hover:text-brand-600 dark:hover:text-white transition">
                  Post Team Opening
                </Link>
              </li>
              <li>
                <Link to="/app" className="hover:text-brand-600 dark:hover:text-white transition">
                  Creator Dashboard
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-brand-600 dark:hover:text-white transition">
                  Maker Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Architecture & Security */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Architecture
            </h4>
            <ul className="mt-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a href="#features" className="hover:text-brand-600 dark:hover:text-white transition">
                  Atomic Concurrency
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-brand-600 dark:hover:text-white transition">
                  Socket.IO Sync
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-brand-600 dark:hover:text-white transition">
                  Nodemailer Email Auth
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-brand-600 dark:hover:text-white transition">
                  Dual-Channel Auth
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Resources
            </h4>
            <ul className="mt-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a
                  href="https://github.com/Arunmahajan22/HackBuddy-Skill-Based-Hackathon-Team-Matching-Platform"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-brand-600 dark:hover:text-white transition"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink size={11} />
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-600 dark:hover:text-white transition">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-brand-600 dark:hover:text-white transition">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Status & Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-6 text-xs text-slate-500 dark:border-white/[0.08] dark:text-slate-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>HackBuddy Production API · All Systems Operational</span>
          </div>

          <p>© {new Date().getFullYear()} HackBuddy. Built for ambitious builders shipping winning hackathons.</p>
        </div>
      </div>
    </footer>
  );
}

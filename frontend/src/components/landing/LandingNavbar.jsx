import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Code2, Compass, LayoutDashboard, Moon, Sun, Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export function LandingNavbar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-sm dark:border-white/[0.08] dark:bg-ink-950/85'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Landing Navigation"
      >
        {/* Brand Logo */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 font-bold tracking-tight text-slate-900 transition hover:opacity-95 dark:text-white"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/25 transition-transform duration-200 group-hover:scale-105">
            <Code2 size={20} />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            Hack<span className="text-brand-600 dark:text-brand-400">Buddy</span>
          </span>
        </Link>

        {/* Desktop Anchor Links */}
        <div className="hidden items-center gap-6 md:flex" role="menubar">
          <a
            href="#how-it-works"
            className="text-xs font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            How It Works
          </a>
          <a
            href="#features"
            className="text-xs font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Platform Features
          </a>
          <a
            href="#openings"
            className="text-xs font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Live Openings
          </a>
          <a
            href="#stats"
            className="text-xs font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Live Metrics
          </a>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            <Compass size={14} />
            <span>Explore Feed</span>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="icon-button"
          >
            {theme === 'dark' ? (
              <Sun size={17} className="text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon size={17} className="text-slate-600 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* Conditional Auth CTA */}
          {user ? (
            <Link to="/app" className="primary-button text-xs py-2 px-3.5 shadow-glow">
              <LayoutDashboard size={14} />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="primary-button text-xs py-2 px-3.5 shadow-glow"
              >
                <span>Get Started</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
            className="icon-button md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200/80 bg-white/95 p-4 backdrop-blur-xl animate-fade-in md:hidden dark:border-white/10 dark:bg-ink-950/95">
          <div className="flex flex-col gap-2">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Platform Features
            </a>
            <a
              href="#openings"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Live Openings
            </a>
            <a
              href="#stats"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Live Metrics
            </a>
            <Link
              to="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-400/10"
            >
              <Compass size={16} /> Explore Feed
            </Link>
            <div className="my-1 border-t border-slate-200/70 dark:border-white/10" />
            {user ? (
              <Link
                to="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="primary-button text-xs"
              >
                <LayoutDashboard size={14} /> Go to Dashboard
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="secondary-button text-xs text-center"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="primary-button text-xs text-center"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

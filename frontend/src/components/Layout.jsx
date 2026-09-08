import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Code2,
  Compass,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Sun,
  UserRound,
  Menu,
  X,
  Sparkles,
  Shield,
  MessageCircle,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { NotificationBell } from './NotificationBell';

export function Layout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const getInitials = (name) => {
    if (!name) return 'HB';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-ink-950 dark:text-slate-100 flex flex-col justify-between">
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2.5 focus:text-white focus:shadow-glow focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Main Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-colors dark:border-white/[0.08] dark:bg-ink-950/80">
        <nav
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
          aria-label="Main Navigation"
        >
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-6">
            <Link
              to={user ? '/app' : '/login'}
              className="group flex items-center gap-2.5 font-bold tracking-tight text-slate-900 transition hover:opacity-95 dark:text-white"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/25 transition-transform duration-200 group-hover:scale-105">
                <Code2 size={20} />
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight">
                Hack<span className="text-brand-600 dark:text-brand-400">Buddy</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            {user && (
              <div className="hidden items-center gap-1 md:flex" role="menubar">
                <NavLink to="/explore" className="nav-link" role="menuitem">
                  <Compass size={16} />
                  <span>Explore</span>
                </NavLink>
                <NavLink to="/app" className="nav-link" role="menuitem">
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/teams/new" className="nav-link" role="menuitem">
                  <Plus size={16} />
                  <span>Create Team</span>
                </NavLink>
                <NavLink to="/profile" className="nav-link" role="menuitem">
                  <UserRound size={16} />
                  <span>Profile</span>
                </NavLink>
                <NavLink to="/chat" className="nav-link" role="menuitem">
                  <MessageCircle size={16} />
                  <span>Messages</span>
                </NavLink>
                <NavLink to="/matches" className="nav-link" role="menuitem">
                  <Sparkles size={16} />
                  <span>Smart Matches</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user && <NotificationBell />}
            {/* User Avatar Badge */}
            {user && (
              <Link
                to="/profile"
                className="hidden items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/70 py-1 pl-1.5 pr-3 text-xs font-semibold shadow-sm transition hover:border-brand-300 hover:bg-slate-50 sm:flex dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-brand-400/30"
              >
                <span className="grid size-6 place-items-center rounded-full bg-brand-500/15 text-[11px] font-bold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                  {getInitials(user.name)}
                </span>
                <span className="max-w-[100px] truncate text-slate-700 dark:text-slate-200">
                  {user.name.split(' ')[0]}
                </span>
              </Link>
            )}

            {/* Theme Toggle Button */}
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

            {/* Logout / Login CTA */}
            {user ? (
              <button
                type="button"
                onClick={logout}
                aria-label="Log out of HackBuddy"
                className="hidden items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50/80 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 sm:inline-flex dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
              >
                <LogOut size={14} />
                <span>Log out</span>
              </button>
            ) : (
              <NavLink
                to="/login"
                className="primary-button text-xs py-2 px-3.5"
              >
                Sign in
              </NavLink>
            )}

            {/* Mobile Menu Toggle Button */}
            {user && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
                className="icon-button md:hidden"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </nav>

        {/* Mobile Drawer Menu */}
        {user && mobileMenuOpen && (
          <div className="border-t border-slate-200/80 bg-white/95 p-4 backdrop-blur-xl animate-fade-in md:hidden dark:border-white/10 dark:bg-ink-950/95">
            <div className="flex flex-col gap-1">
              <NavLink
                to="/explore"
                className="nav-link"
              >
                <Compass size={16} /> Explore Teams
              </NavLink>
              <NavLink
                to="/app"
                className="nav-link"
              >
                <LayoutDashboard size={16} /> Creator Dashboard
              </NavLink>
              <NavLink
                to="/teams/new"
                className="nav-link"
              >
                <Plus size={16} /> Post Team Opening
              </NavLink>
              <NavLink
                to="/profile"
                className="nav-link"
              >
                <UserRound size={16} /> Maker Profile
              </NavLink>
              <NavLink to="/chat" className="nav-link">
                <MessageCircle size={16} /> Messages
              </NavLink>
              <NavLink to="/matches" className="nav-link"><Sparkles size={16} /> Smart Matches</NavLink>
              <div className="my-2 border-t border-slate-200/70 dark:border-white/10" />
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/40 py-8 backdrop-blur-sm dark:border-white/[0.06] dark:bg-ink-950/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500" />
            <span>HackBuddy Production API · Real-time Socket.IO Active</span>
          </div>

          <p>© {new Date().getFullYear()} HackBuddy — Built for ambitious teams shipping high-impact products.</p>
        </div>
      </footer>
    </div>
  );
}

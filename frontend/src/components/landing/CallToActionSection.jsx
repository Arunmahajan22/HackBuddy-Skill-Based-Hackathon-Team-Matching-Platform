import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Sparkles, Code2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function CallToActionSection() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 p-8 sm:p-14 text-white shadow-2xl">
          {/* Subtle Ambient Pattern */}
          <div
            className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-20"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles size={14} className="text-amber-300 animate-pulse" />
              <span>Join the Builder Community</span>
            </span>

            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to assemble your dream build crew?
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-indigo-100 sm:text-base">
              Create your verified profile today to discover hackathon opportunities, find engineers who complement your skillset, and start shipping.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to={user ? '/app' : '/register'}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-lg shadow-black/10 transition-all hover:bg-slate-50 hover:shadow-xl active:scale-95"
              >
                <span>{user ? 'Go to Your Dashboard' : 'Find Your Teammates'}</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
              >
                <Compass size={16} />
                <span>Explore Live Openings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

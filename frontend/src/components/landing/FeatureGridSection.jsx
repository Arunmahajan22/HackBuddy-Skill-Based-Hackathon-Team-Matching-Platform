import {
  Zap,
  Radio,
  ShieldCheck,
  Lock,
  Cpu,
  Contrast,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';

const FEATURES = [
  {
    title: 'Atomic Concurrency Mutex',
    description:
      'Database-level conditional writes ($expr size checks) guarantee team limits are strictly enforced under high concurrency with zero overfills.',
    icon: Zap,
    color: 'text-amber-500 bg-amber-500/10',
  },
  {
    title: 'Real-Time WebSocket Sync',
    description:
      'Socket.IO room isolation (user:<id>) instantly delivers join requests, acceptances, and roster updates without wasteful network polling.',
    icon: Radio,
    color: 'text-emerald-500 bg-emerald-500/10',
  },
  {
    title: 'Cryptographic Email Auth',
    description:
      'Production-style Nodemailer verification with SHA-256 hashed tokens, 24-hour expiration, and account protection against unverified spam.',
    icon: ShieldCheck,
    color: 'text-brand-500 bg-brand-500/10',
  },
  {
    title: 'Dual-Channel XSS Immunity',
    description:
      'Authentication tokens are securely issued in HTTP-only, SameSite=Lax cookies, completely neutralizing JavaScript token theft exploits.',
    icon: Lock,
    color: 'text-purple-500 bg-purple-500/10',
  },
  {
    title: 'N+1 Waterfall Elimination',
    description:
      'Batch dashboard APIs and Mongoose .lean() query pipelines reduce creator data load times from O(N) network roundtrips to 1 parallel indexed fetch.',
    icon: Cpu,
    color: 'text-blue-500 bg-blue-500/10',
  },
  {
    title: 'WCAG Accessible Design',
    description:
      'Full dark/light mode token parity, keyboard escape trap modals, visible skip links, and semantic typography tailored for modern builders.',
    icon: Contrast,
    color: 'text-indigo-500 bg-indigo-500/10',
  },
];

export function FeatureGridSection() {
  return (
    <section id="features" className="border-t border-slate-200/80 bg-slate-100/40 py-16 dark:border-white/[0.08] dark:bg-ink-900/30 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="eyebrow block">Engineered for Scale</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Built with Big-Tech Engineering Standards.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            HackBuddy is architected from the ground up for reliability, data integrity, and low-latency performance.
          </p>
        </div>

        {/* 6 Features Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand-400/40 hover:shadow-card-hover dark:hover:border-brand-400/30"
              >
                <div className="flex items-center gap-3">
                  <span className={`grid size-10 place-items-center rounded-xl ${feature.color}`}>
                    <Icon size={18} />
                  </span>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

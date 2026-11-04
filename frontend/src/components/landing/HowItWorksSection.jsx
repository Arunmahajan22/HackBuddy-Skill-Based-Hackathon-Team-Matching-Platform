import { UserPlus, Code2, Compass, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    step: '01',
    title: 'Create Your Profile',
    description:
      'Register with your name, university department, academic year, and verified email address to join the maker directory.',
    icon: UserPlus,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    step: '02',
    title: 'Declare Your Tech Stack',
    description:
      'Select your key programming languages, frameworks, and roles (React, PyTorch, Go, UI/UX) to power skill-based matching.',
    icon: Code2,
    color: 'from-indigo-500 to-purple-600',
  },
  {
    step: '03',
    title: 'Discover Compatible Openings',
    description:
      'Search live hackathon team openings with open seats or publish your own project concept and recruit members.',
    icon: Compass,
    color: 'from-purple-500 to-pink-600',
  },
  {
    step: '04',
    title: 'Match & Start Shipping',
    description:
      'Submit join requests with 1-click role chips. Team creators accept candidates in real-time with atomic concurrency guarantees.',
    icon: Zap,
    color: 'from-brand-500 to-emerald-600',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="eyebrow block">Workflow</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            How HackBuddy Works.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            From registration to confirmed team roster in four straightforward steps.
          </p>
        </div>

        {/* 4 Step Cards Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="glass-card group relative p-6 transition-all duration-200 hover:-translate-y-1 hover:border-brand-400/40 hover:shadow-card-hover dark:hover:border-brand-400/30"
              >
                {/* Step Number Badge */}
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-extrabold text-slate-300 transition-colors group-hover:text-brand-500 dark:text-slate-700 dark:group-hover:text-brand-400">
                    {item.step}
                  </span>
                  <span
                    className={`grid size-10 place-items-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-md shadow-brand-500/20 transition-transform group-hover:scale-110`}
                  >
                    <Icon size={18} />
                  </span>
                </div>

                <h3 className="mt-5 font-display text-base font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

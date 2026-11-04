import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Layers } from 'lucide-react';

export function SkillCategoriesSection({ skills, loading }) {
  const displaySkills =
    skills && skills.length > 0
      ? skills
      : [
          'React',
          'Node.js',
          'Python',
          'TypeScript',
          'UI/UX',
          'AI / ML',
          'Next.js',
          'Tailwind CSS',
          'Go',
          'Rust',
          'Solidity',
          'Docker',
        ];

  return (
    <section className="py-16 sm:py-20 border-t border-slate-200/80 dark:border-white/[0.08]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="eyebrow block">Skill-Based Discovery</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Explore Openings by Tech Stack.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Filter hackathon teams actively recruiting for your specific languages, frameworks, or design disciplines.
          </p>
        </div>

        {/* Skill Pills Cloud */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto">
          {displaySkills.map((skill) => (
            <Link
              key={skill}
              to={`/explore?skill=${encodeURIComponent(skill)}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50/70 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-brand-400/40 dark:hover:bg-brand-400/10 dark:hover:text-brand-300 active:scale-95"
            >
              <span>{skill}</span>
              <ArrowRight size={13} className="opacity-50 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

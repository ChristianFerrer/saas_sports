import { Shield, Star, Trophy, Zap } from 'lucide-react';

import type { AcademyTier } from '@/lib/academy/tier';

type Props = {
  tier: AcademyTier;
  label: string;
  caption: string;
};

const TIER_GRAD: Record<AcademyTier, string> = {
  bronze: 'from-amber-600 via-amber-500 to-amber-800',
  silver: 'from-slate-200 via-slate-400 to-slate-600',
  gold: 'from-gold-200 via-gold-400 to-gold-600',
  elite: 'from-cyan-200 via-gold-400 to-gold-600'
};

const TIER_ICON: Record<AcademyTier, typeof Star> = {
  bronze: Shield,
  silver: Shield,
  gold: Trophy,
  elite: Zap
};

/**
 * Tiny school-tier widget rendered inside the premium sidebar. Reads
 * the pre-computed tier + label and paints a gradient shield, the
 * tier name in uppercase, and a small caption (e.g. "28 sesiones
 * realizadas").
 */
export function AcademyTierCard({ tier, label, caption }: Props) {
  const Icon = TIER_ICON[tier];
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-center">
      <div
        className={`mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${TIER_GRAD[tier]} ${
          tier === 'gold' || tier === 'elite' ? 'shadow-gold-glow' : ''
        }`}
      >
        <Icon size={22} strokeWidth={2.2} className="text-navy-900" aria-hidden />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-300">
        {caption}
      </p>
      <p className="mt-0.5 font-display text-[15px] font-extrabold uppercase tracking-[0.16em] text-gradient-gold">
        {label}
      </p>
    </div>
  );
}

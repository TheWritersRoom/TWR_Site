import { Pencil, Eye, BadgeCheck, Crown, Repeat2, Users, Star, BookOpen } from "lucide-react";

export type AchievementKey =
  | "first_mark"
  | "sharp_eye"
  | "trusted_voice"
  | "master_editor"
  | "consistent_voice"
  | "collaborator"
  | "sought_after"
  | "published_credit";

export type Tier = "bronze" | "silver" | "gold" | "platinum";

export type Achievement = {
  key: AchievementKey;
  label: string;
  description: string;
  tier: Tier;
  earned: boolean;
};

// ── Tier visual config ───────────────────────────────────────────────────────

const TIER_STYLES: Record<Tier, { badge: string; dot: string; label: string }> = {
  bronze:   { badge: "bg-amber-50   border-amber-300  text-amber-800",  dot: "bg-amber-400",   label: "Bronze"   },
  silver:   { badge: "bg-slate-50   border-slate-300  text-slate-700",  dot: "bg-slate-400",   label: "Silver"   },
  gold:     { badge: "bg-[#E8B84B]/20 border-[#E8B84B] text-[#7A5A00]", dot: "bg-[#E8B84B]",   label: "Gold"     },
  platinum: { badge: "bg-[#1A1614]  border-[#E8B84B]  text-[#F9F6EE]",  dot: "bg-[#E8B84B]",   label: "Platinum" },
};

// ── Icon map ─────────────────────────────────────────────────────────────────

const ICONS: Record<AchievementKey, React.ElementType> = {
  first_mark:       Pencil,
  sharp_eye:        Eye,
  trusted_voice:    BadgeCheck,
  master_editor:    Crown,
  consistent_voice: Repeat2,
  collaborator:     Users,
  sought_after:     Star,
  published_credit: BookOpen,
};

// ── Helper: derive top earned achievement for compact display ────────────────

const TIER_RANK: Record<Tier, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4 };

export function topAchievement(achievements: Achievement[]): Achievement | null {
  return achievements
    .filter(a => a.earned)
    .sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier])[0] ?? null;
}

// ── Compute top badge from raw numbers (no API call) ────────────────────────

export function computeTopBadgeFromStats(
  totalSuggestions: number,
  acceptRate: number | null
): { key: AchievementKey; label: string; tier: Tier } | null {
  if (totalSuggestions >= 10 && acceptRate !== null && acceptRate >= 90) {
    return { key: "master_editor", label: "Master Editor", tier: "platinum" };
  }
  if (totalSuggestions >= 10 && acceptRate !== null && acceptRate >= 75) {
    return { key: "trusted_voice", label: "Trusted Voice", tier: "gold" };
  }
  if (totalSuggestions >= 5 && acceptRate !== null && acceptRate >= 60) {
    return { key: "sharp_eye", label: "Sharp Eye", tier: "silver" };
  }
  if (totalSuggestions > 0 && acceptRate !== null && acceptRate > 0) {
    return { key: "first_mark", label: "First Mark", tier: "bronze" };
  }
  return null;
}

// ── Single badge pill ────────────────────────────────────────────────────────

export function AchievementPill({
  achievement,
  size = "md",
  showDescription = false,
}: {
  achievement: Pick<Achievement, "key" | "label" | "description" | "tier" | "earned">;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}) {
  const style = TIER_STYLES[achievement.tier];
  const Icon = ICONS[achievement.key];
  const muted = !achievement.earned;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[9px] gap-1",
    md: "px-2.5 py-1 text-[10px] gap-1.5",
    lg: "px-3 py-1.5 text-xs gap-2",
  }[size];

  const iconSize = { sm: "w-2.5 h-2.5", md: "w-3 h-3", lg: "w-3.5 h-3.5" }[size];

  return (
    <div className={`group relative inline-flex items-center ${sizeClasses} border font-bold uppercase tracking-[0.1em] transition-all select-none
      ${muted ? "opacity-30 grayscale" : style.badge}
      ${!muted && showDescription ? "cursor-default" : ""}
    `}>
      <Icon className={iconSize} />
      <span>{achievement.label}</span>
      {!muted && showDescription && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 hidden group-hover:block w-52 bg-[#1A1614] text-[#F9F6EE] text-[10px] normal-case tracking-normal leading-snug px-3 py-2 shadow-xl pointer-events-none">
          {achievement.description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1614]" />
        </div>
      )}
    </div>
  );
}

// ── Reputation score ring ────────────────────────────────────────────────────

export function ReputationScore({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const tier: Tier =
    clamped >= 80 ? "platinum" :
    clamped >= 55 ? "gold" :
    clamped >= 30 ? "silver" : "bronze";
  const style = TIER_STYLES[tier];

  return (
    <div className={`inline-flex flex-col items-center justify-center w-16 h-16 border-2 ${style.badge}`}>
      <p className="text-2xl font-serif font-bold tabular-nums leading-none">{clamped}</p>
      <p className="text-[8px] uppercase tracking-[0.12em] font-bold mt-0.5 opacity-70">Score</p>
    </div>
  );
}

// ── Full achievement grid (for profile page) ─────────────────────────────────

export function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
  const earned = achievements.filter(a => a.earned);
  const locked = achievements.filter(a => !a.earned);

  return (
    <div className="space-y-3">
      {earned.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {earned.map(a => (
            <AchievementPill key={a.key} achievement={a} size="md" showDescription />
          ))}
        </div>
      )}
      {locked.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {locked.map(a => (
            <AchievementPill key={a.key} achievement={a} size="sm" showDescription />
          ))}
        </div>
      )}
    </div>
  );
}

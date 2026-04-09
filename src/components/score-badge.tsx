"use client";

import { cn } from "@/lib/utils";

export function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const getColor = (s: number) => {
    if (s >= 4.5) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    if (s >= 4.0) return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
    if (s >= 3.5) return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
  };

  const getLabel = (s: number) => {
    if (s >= 4.5) return "Strong Match";
    if (s >= 4.0) return "Good Match";
    if (s >= 3.5) return "Decent";
    return "Pass";
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        getColor(score),
        sizes[size]
      )}
    >
      <span className="font-bold">{score.toFixed(1)}</span>
      {size !== "sm" && <span className="opacity-75">· {getLabel(score)}</span>}
    </span>
  );
}

export function ScoreBar({ score, label, max = 5 }: { score: number; label: string; max?: number }) {
  const pct = (score / max) * 100;
  const getColor = (s: number) => {
    if (s >= 4.5) return "bg-emerald-500";
    if (s >= 4.0) return "bg-blue-500";
    if (s >= 3.5) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getColor(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

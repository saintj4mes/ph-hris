import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type Tone = "success" | "warning" | "neutral" | "info";

const toneClasses: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/15",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/10",
  info: "bg-blue-50 text-blue-700 ring-blue-600/15",
};

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", toneClasses[tone])}>
      {children}
    </span>
  );
}

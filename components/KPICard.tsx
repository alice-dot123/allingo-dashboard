"use client";

interface Props {
  label: string;
  value: string;
  sub?: string;
  prev?: number;  // previous period raw value
  curr?: number;  // current period raw value
  higherIsBetter?: boolean; // default true; CPA = false
}

function trendPct(curr: number, prev: number): number | null {
  if (!prev) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

export default function KPICard({ label, value, sub, prev, curr, higherIsBetter = true }: Props) {
  const pct = curr != null && prev != null ? trendPct(curr, prev) : null;

  let trendColor = "text-[var(--fg3)]";
  let arrow = "";
  if (pct != null) {
    const positive = pct > 0;
    const good     = higherIsBetter ? positive : !positive;
    trendColor = good ? "text-[var(--green)]" : "text-[var(--red)]";
    arrow = positive ? "↑" : "↓";
  }

  return (
    <div className="relative overflow-hidden rounded-[10px] bg-[var(--surface)] border border-[var(--border)] p-[14px_16px] flex flex-col gap-[6px] group">
      {/* top accent bar on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="text-[10.5px] font-semibold uppercase tracking-[.06em] text-[var(--fg3)]">
        {label}
      </div>

      <div className="text-[20px] font-bold text-[var(--fg)] font-mono leading-snug tracking-tight">
        {value}
      </div>

      <div className="flex items-center gap-[6px] mt-[2px]">
        {pct != null ? (
          <>
            <span className={`text-[11px] font-semibold flex items-center gap-[2px] ${trendColor}`}>
              {arrow} {Math.abs(pct).toFixed(1)}%
            </span>
            <span className="text-[10.5px] text-[var(--fg3)]">vs prev</span>
          </>
        ) : sub ? (
          <span className="text-[10.5px] text-[var(--fg3)]">{sub}</span>
        ) : null}
      </div>
    </div>
  );
}

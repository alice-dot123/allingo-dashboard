"use client";

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export default function KPICard({ label, value, sub, trend, trendValue }: KPICardProps) {
  const trendColor =
    trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-[#8b949e]";
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "";

  return (
    <div className="card p-5 flex flex-col gap-1 min-w-0">
      <span className="text-xs font-medium text-[#8b949e] uppercase tracking-wider">{label}</span>
      <span className="text-2xl font-semibold text-[#e6edf3] truncate">{value}</span>
      {(trendValue || sub) && (
        <div className="flex items-center gap-2 mt-0.5">
          {trendValue && (
            <span className={`text-xs font-medium ${trendColor}`}>
              {trendIcon} {trendValue}
            </span>
          )}
          {sub && <span className="text-xs text-[#8b949e]">{sub}</span>}
        </div>
      )}
    </div>
  );
}

"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface DailyRow { date: string; spend: number; impressions: number; clicks: number; conversions: number; }

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${parseInt(d)}/${parseInt(m)}`;
}

function fmtSpend(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000)     return Math.round(v / 1_000) + "K";
  return String(Math.round(v));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-[10px] text-[12px]" style={{ background: "#1c2236", border: "1px solid #2e3a56" }}>
      <p className="text-[var(--fg)] font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-[var(--fg2)]">
          {p.name === "spend"
            ? `Spend: ${fmtSpend(p.value)} ₫`
            : `Conv.: ${p.value}`}
        </p>
      ))}
    </div>
  );
};

export default function TrendChart({ data }: { data: DailyRow[] }) {
  const maxSpend = Math.max(...data.map((d) => d.spend), 1);
  const chart = data.map((d) => ({ ...d, date: fmtDate(d.date) }));

  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title">Daily Performance</span>
        <span className="text-[11px] text-[var(--fg3)]">{data.length} days</span>
      </div>
      <div className="px-[18px] pt-4 pb-0">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chart} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(46,58,86,0.4)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#505d7a", fontSize: 11 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#505d7a", fontSize: 11 }}
              axisLine={false} tickLine={false}
              tickFormatter={fmtSpend}
              width={48}
            />
            <YAxis
              yAxisId="right" orientation="right"
              tick={{ fill: "#505d7a", fontSize: 11 }}
              axisLine={false} tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(79,110,247,.06)" }} />
            <Bar yAxisId="left" dataKey="spend" fill="rgba(79,110,247,0.4)"
              stroke="#4f6ef7" strokeWidth={1} radius={[4,4,0,0]} maxBarSize={40} />
            <Line yAxisId="right" dataKey="conversions" type="monotone"
              stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
              activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 px-[18px] py-[10px] border-t border-[var(--border)]">
        <div className="flex items-center gap-[6px] text-[11px] text-[var(--fg2)]">
          <div className="w-2 h-2 rounded-full bg-[#4f6ef7]" />
          Ad Spend (₫)
        </div>
        <div className="flex items-center gap-[6px] text-[11px] text-[var(--fg2)]">
          <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
          Conversions
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DailyRow {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface Props {
  data: DailyRow[];
}

const fmt = (d: string) => {
  const [, m, day] = d.split("-");
  return `${parseInt(m)}/${parseInt(day)}`;
};

const fmtUSD = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;

export default function TrendChart({ data }: Props) {
  const formatted = data.map((r) => ({ ...r, dateLabel: fmt(r.date) }));

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-[#e6edf3] mb-4">Daily Performance</h2>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={formatted} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: "#8b949e", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="spend"
            tickFormatter={fmtUSD}
            tick={{ fill: "#8b949e", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={54}
          />
          <YAxis
            yAxisId="conv"
            orientation="right"
            tick={{ fill: "#8b949e", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#e6edf3", marginBottom: 4 }}
            formatter={(value: number, name: string) => {
              if (name === "Spend") return [`$${value.toFixed(2)}`, name];
              if (name === "Impressions") return [value.toLocaleString(), name];
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#8b949e", paddingTop: 12 }}
          />
          <Bar
            yAxisId="spend"
            dataKey="spend"
            name="Spend"
            fill="#1f6feb"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Line
            yAxisId="conv"
            type="monotone"
            dataKey="conversions"
            name="Conversions"
            stroke="#3fb950"
            strokeWidth={2}
            dot={{ r: 3, fill: "#3fb950", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

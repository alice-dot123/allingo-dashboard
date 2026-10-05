"use client";

import { useState } from "react";

interface AdsetRow {
  adset_name: string;
  campaign_name: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
}

type SortKey = keyof AdsetRow;

export default function AdsetTable({ data }: { data: AdsetRow[] }) {
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "spend", asc: false });

  const sorted = [...data].sort((a, b) => {
    const av = a[sort.key] as number | string;
    const bv = b[sort.key] as number | string;
    const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sort.asc ? cmp : -cmp;
  });

  const toggle = (key: SortKey) =>
    setSort((s) => s.key === key ? { key, asc: !s.asc } : { key, asc: false });

  const arrow = (key: SortKey) =>
    sort.key === key ? (sort.asc ? " ↑" : " ↓") : "";

  const th = (label: string, key: SortKey, align = "text-right") => (
    <th
      className={`px-3 py-2.5 text-xs font-medium text-[#8b949e] uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-[#e6edf3] transition-colors ${align}`}
      onClick={() => toggle(key)}
    >
      {label}{arrow(key)}
    </th>
  );

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-[#21262d]">
        <h2 className="text-sm font-semibold text-[#e6edf3]">Ad Sets</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0d1117]/50">
            <tr>
              <th className="px-3 py-2.5 text-xs font-medium text-[#8b949e] uppercase tracking-wider text-left">Ad Set</th>
              <th className="px-3 py-2.5 text-xs font-medium text-[#8b949e] uppercase tracking-wider text-left">Campaign</th>
              {th("Spend",  "spend")}
              {th("Impr.",  "impressions")}
              {th("Clicks", "clicks")}
              {th("CTR",    "ctr")}
              {th("Conv.",  "conversions")}
              {th("CPA",    "cpa")}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]">
            {sorted.map((a, i) => (
              <tr key={`${a.adset_name}-${i}`} className="hover:bg-[#161b22]/60 transition-colors">
                <td className="px-3 py-3 max-w-[200px] truncate text-[#e6edf3] text-xs">{a.adset_name}</td>
                <td className="px-3 py-3 max-w-[180px] truncate text-[#8b949e] text-xs">{a.campaign_name}</td>
                <td className="px-3 py-3 text-right text-[#e6edf3] font-medium">${a.spend.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-[#8b949e]">{a.impressions.toLocaleString()}</td>
                <td className="px-3 py-3 text-right text-[#8b949e]">{a.clicks.toLocaleString()}</td>
                <td className="px-3 py-3 text-right text-[#8b949e]">{a.ctr.toFixed(2)}%</td>
                <td className="px-3 py-3 text-right text-[#e6edf3]">{a.conversions.toFixed(0)}</td>
                <td className="px-3 py-3 text-right text-[#8b949e]">${a.cpa.toFixed(2)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-[#8b949e] text-xs">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

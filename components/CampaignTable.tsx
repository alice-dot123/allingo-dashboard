"use client";

import { useState } from "react";

interface CampaignRow {
  campaign_id: string;
  campaign_name: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
  roas: number;
}

type SortKey = keyof CampaignRow;

const objBadge: Record<string, string> = {
  "MT-Signup":  "bg-purple-500/20 text-purple-300",
  "MT-Traffic": "bg-blue-500/20   text-blue-300",
};

export default function CampaignTable({ data }: { data: CampaignRow[] }) {
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
        <h2 className="text-sm font-semibold text-[#e6edf3]">Campaigns</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0d1117]/50">
            <tr>
              <th className="px-3 py-2.5 text-xs font-medium text-[#8b949e] uppercase tracking-wider text-left">Campaign</th>
              {th("Spend",   "spend")}
              {th("Impr.",   "impressions")}
              {th("Clicks",  "clicks")}
              {th("CTR",     "ctr")}
              {th("Conv.",   "conversions")}
              {th("CPA",     "cpa")}
              {th("ROAS",    "roas")}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]">
            {sorted.map((c) => (
              <tr key={c.campaign_id} className="hover:bg-[#161b22]/60 transition-colors">
                <td className="px-3 py-3 max-w-[260px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                        objBadge[c.objective] ?? "bg-[#30363d] text-[#8b949e]"
                      }`}
                    >
                      {c.objective}
                    </span>
                    <span className="truncate text-[#e6edf3] text-xs">{c.campaign_name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-[#e6edf3] font-medium">${c.spend.toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-[#8b949e]">{c.impressions.toLocaleString()}</td>
                <td className="px-3 py-3 text-right text-[#8b949e]">{c.clicks.toLocaleString()}</td>
                <td className="px-3 py-3 text-right text-[#8b949e]">{c.ctr.toFixed(2)}%</td>
                <td className="px-3 py-3 text-right text-[#e6edf3]">{c.conversions.toFixed(0)}</td>
                <td className="px-3 py-3 text-right text-[#8b949e]">${c.cpa.toFixed(2)}</td>
                <td className="px-3 py-3 text-right">
                  <span className={c.roas >= 1 ? "text-green-400" : "text-red-400"}>
                    {c.roas.toFixed(2)}x
                  </span>
                </td>
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

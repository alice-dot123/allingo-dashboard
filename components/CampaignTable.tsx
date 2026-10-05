"use client";

import { useState } from "react";

interface CampaignRow {
  campaign_id: string; campaign_name: string; objective: string;
  spend: number; impressions: number; clicks: number; ctr: number;
  conversions: number; cpa: number; roas: number; spendPct: number;
}

function fmtVnd(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return Math.round(n / 1_000) + "K";
  return n.toLocaleString("en-US");
}
function fmtVndFull(n: number) {
  return n.toLocaleString("vi-VN");
}
function fmtN(n: number) { return n.toLocaleString("en-US", { maximumFractionDigits: 0 }); }

function CtrChip({ v }: { v: number }) {
  const cls = v >= 0.8 ? "ctr-hi" : v >= 0.5 ? "ctr-mid" : "ctr-lo";
  return <span className={`ctr-chip ${cls}`}>{v.toFixed(2)}%</span>;
}

type Col = "spend" | "impressions" | "clicks" | "ctr" | "conversions" | "cpa" | "roas";

export default function CampaignTable({ data }: { data: CampaignRow[] }) {
  const [sortCol, setSortCol] = useState<Col>("spend");
  const [asc, setAsc]         = useState(false);

  const maxSpend = Math.max(...data.map((r) => r.spend), 1);

  function sort(col: Col) {
    if (sortCol === col) setAsc((v) => !v);
    else { setSortCol(col); setAsc(false); }
  }

  const sorted = [...data].sort((a, b) => {
    const diff = a[sortCol] - b[sortCol];
    return asc ? diff : -diff;
  });

  const Th = ({ col, label }: { col: Col; label: string }) => (
    <th className="cursor-pointer select-none hover:text-[var(--fg2)] transition-colors" onClick={() => sort(col)}>
      {label}{sortCol === col ? (asc ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title">Campaigns</span>
        <span className="section-badge">{data.length} active</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="text-left px-[14px] py-[9px] text-[10.5px] font-semibold uppercase tracking-[.05em] text-[var(--fg3)] bg-black/20 border-b border-[var(--border)] whitespace-nowrap">
                Campaign
              </th>
              {(["spend","impressions","clicks","ctr","conversions","cpa","roas"] as Col[]).map((col) => (
                <Th key={col} col={col} label={
                  col === "spend" ? "Spend ₫" :
                  col === "impressions" ? "Impr." :
                  col === "cpa" ? "CPA ₫" :
                  col.toUpperCase()
                } />
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.campaign_id} className="border-b border-[var(--border)] last:border-0 hover:bg-[rgba(79,110,247,.04)] transition-colors">
                <td className="px-[14px] py-[10px] text-left text-[var(--fg)] max-w-[240px]">
                  <span className={`obj-badge ${r.objective.toLowerCase().includes("signup") ? "obj-signup" : "obj-traffic"}`}>
                    {r.objective.toLowerCase().includes("signup") ? "Signup" : "Traffic"}
                  </span>
                  <span className="align-middle">{r.campaign_name}</span>
                </td>
                <td className="px-[14px] py-[10px] text-right font-mono text-[var(--fg2)]">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-[3px] rounded-sm bg-[var(--accent)] opacity-50"
                      style={{ width: Math.round((r.spend / maxSpend) * 60) + "px" }} />
                    {fmtVnd(r.spend)}
                  </div>
                </td>
                <td className="px-[14px] py-[10px] text-right font-mono text-[var(--fg2)]">{fmtN(r.impressions)}</td>
                <td className="px-[14px] py-[10px] text-right font-mono text-[var(--fg2)]">{fmtN(r.clicks)}</td>
                <td className="px-[14px] py-[10px] text-right"><CtrChip v={r.ctr} /></td>
                <td className="px-[14px] py-[10px] text-right font-mono text-[var(--fg2)]">{fmtN(r.conversions)}</td>
                <td className="px-[14px] py-[10px] text-right font-mono text-[var(--fg2)]">{fmtVndFull(Math.round(r.cpa))}</td>
                <td className="px-[14px] py-[10px] text-right font-mono text-[var(--fg2)]">{r.roas.toFixed(2)}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

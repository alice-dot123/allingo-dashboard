"use client";

import { useState } from "react";
import Image from "next/image";

interface CreativeRow {
  ad_id: string; ad_name: string; adset_name: string;
  campaign_name: string; objective: string; image_url: string;
  spend: number; impressions: number; clicks: number; ctr: number;
  conversions: number; cpa: number;
}

type SortKey = "ctr" | "spend" | "conversions" | "cpa";

function fmtVnd(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return Math.round(n / 1_000) + "K";
  return n.toLocaleString("en-US");
}

const RANK_STYLE: Record<number, string> = {
  1: "bg-[#f59e0b] text-black",
  2: "bg-[#94a3b8] text-black",
  3: "bg-[#b45309] text-white",
};

export default function CreativeGrid({ data }: { data: CreativeRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("ctr");

  const sorted = [...data].sort((a, b) =>
    sortKey === "cpa" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]
  );

  const SORTS: { k: SortKey; l: string }[] = [
    { k: "ctr", l: "CTR" },
    { k: "spend", l: "Spend" },
    { k: "conversions", l: "Conv." },
    { k: "cpa", l: "CPA" },
  ];

  return (
    <div className="card">
      <div className="section-header">
        <span className="section-title">Creative Performance</span>
        <div className="flex items-center gap-[6px]">
          <span className="text-[11px] text-[var(--fg3)]">Sort by</span>
          <div className="flex border border-[var(--border2)] rounded-md overflow-hidden">
            {SORTS.map(({ k, l }) => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                className={`px-[10px] py-[4px] text-[11.5px] font-medium border-none cursor-pointer transition-all font-['Inter'] ${
                  sortKey === k
                    ? "bg-[var(--accent)] text-white"
                    : "bg-transparent text-[var(--fg2)] hover:text-[var(--fg)] hover:bg-[var(--surface2)]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {sorted.map((ad, idx) => {
          const rank = idx + 1;
          const ctrCls = ad.ctr >= 0.8 ? "bg-[rgba(34,197,94,.8)] text-white" :
                         ad.ctr >= 0.5 ? "bg-[rgba(245,158,11,.8)] text-white" :
                                         "bg-[rgba(244,63,94,.8)] text-white";

          return (
            <div key={ad.ad_id}
              className="rounded-[10px] overflow-hidden border border-[var(--border)] bg-[var(--surface2)] transition-all duration-150 cursor-pointer hover:border-[var(--accent)] hover:-translate-y-[1px]">
              {/* Thumbnail */}
              <div className="relative aspect-square bg-[var(--border)]">
                {ad.image_url ? (
                  <Image src={ad.image_url} alt={ad.ad_name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--fg3)]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}

                {/* Rank badge */}
                <div className={`absolute top-2 left-2 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold ${
                  RANK_STYLE[rank] ?? "bg-[var(--surface2)] text-[var(--fg3)] border border-[var(--border2)]"
                }`}>
                  {rank}
                </div>

                {/* CTR overlay */}
                <div className={`absolute bottom-2 right-2 px-[7px] py-[2px] rounded-full text-[10.5px] font-bold ${ctrCls}`}>
                  {ad.ctr.toFixed(2)}% CTR
                </div>
              </div>

              {/* Info */}
              <div className="p-[10px_12px] flex flex-col gap-1">
                <div className="text-[11.5px] font-semibold text-[var(--fg)] truncate">{ad.ad_name}</div>
                <div className="text-[10.5px] text-[var(--fg3)] truncate">{ad.adset_name}</div>
                <div className="flex justify-between mt-1">
                  <div>
                    <div className="text-[11.5px] font-bold text-[var(--fg)] font-mono">{fmtVnd(ad.spend)} ₫</div>
                    <div className="text-[9.5px] text-[var(--fg3)] uppercase tracking-wider">Spend</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[11.5px] font-bold font-mono ${
                      ad.conversions >= 50 ? "text-[var(--green)]" :
                      ad.conversions >= 20 ? "text-[var(--yellow)]" :
                      "text-[var(--red)]"
                    }`}>{Math.round(ad.conversions)}</div>
                    <div className="text-[9.5px] text-[var(--fg3)] uppercase tracking-wider">Conv.</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

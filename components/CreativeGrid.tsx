"use client";

import Image from "next/image";
import { useState } from "react";

interface CreativeRow {
  ad_id: string;
  ad_name: string;
  adset_name: string;
  campaign_name: string;
  objective: string;
  image_url: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
}

type SortBy = "ctr" | "spend" | "conversions" | "cpa";

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "ctr",         label: "CTR"          },
  { value: "spend",       label: "Spend"         },
  { value: "conversions", label: "Conversions"   },
  { value: "cpa",         label: "CPA (asc)"     },
];

export default function CreativeGrid({ data }: { data: CreativeRow[] }) {
  const [sortBy, setSortBy] = useState<SortBy>("ctr");

  const sorted = [...data].sort((a, b) =>
    sortBy === "cpa" ? a.cpa - b.cpa : b[sortBy] - a[sortBy]
  );

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-[#21262d] flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-sm font-semibold text-[#e6edf3]">Creative Performance</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8b949e]">Sort by</span>
          <div className="flex rounded-lg overflow-hidden border border-[#30363d]">
            {sortOptions.map((o) => (
              <button
                key={o.value}
                onClick={() => setSortBy(o.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  sortBy === o.value
                    ? "bg-[#1f6feb] text-white"
                    : "bg-transparent text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sorted.map((c, idx) => (
          <CreativeCard key={c.ad_id} creative={c} rank={idx + 1} />
        ))}
        {sorted.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#8b949e] text-sm">
            No creatives in this date range
          </div>
        )}
      </div>
    </div>
  );
}

function CreativeCard({ creative: c, rank }: { creative: CreativeRow; rank: number }) {
  const [imgErr, setImgErr] = useState(false);
  const rankColor =
    rank === 1 ? "bg-yellow-500 text-black" :
    rank === 2 ? "bg-[#8b949e] text-black" :
    rank === 3 ? "bg-amber-700 text-white" :
    "bg-[#21262d] text-[#8b949e]";

  return (
    <div className="flex flex-col gap-2 group">
      {/* Thumbnail */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-[#21262d] border border-[#30363d]">
        {/* Rank badge */}
        <span
          className={`absolute top-1.5 left-1.5 z-10 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold ${rankColor}`}
        >
          {rank}
        </span>

        {c.image_url && !imgErr ? (
          <Image
            src={c.image_url}
            alt={c.ad_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#30363d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* CTR pill overlay */}
        <div className="absolute bottom-1.5 right-1.5">
          <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
            {c.ctr.toFixed(2)}% CTR
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-xs text-[#e6edf3] font-medium truncate leading-tight" title={c.ad_name}>
          {c.ad_name}
        </p>
        <p className="text-[10px] text-[#8b949e] truncate" title={c.adset_name}>
          {c.adset_name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-[#e6edf3] font-semibold">${c.spend.toFixed(0)}</span>
          <span className="text-[10px] text-green-400 font-semibold">{c.conversions.toFixed(0)} conv</span>
        </div>
        {c.conversions > 0 && (
          <p className="text-[10px] text-[#8b949e]">CPA ${c.cpa.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
}

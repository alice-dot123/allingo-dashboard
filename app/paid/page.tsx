"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import KPICard from "@/components/KPICard";
import TrendChart from "@/components/TrendChart";
import CampaignTable from "@/components/CampaignTable";
import AdsetTable from "@/components/AdsetTable";
import CreativeGrid from "@/components/CreativeGrid";

// ── Types ──────────────────────────────────────────────────────────────────────
interface KPI {
  spend: number; reach: number; impressions: number; frequency: number;
  cpm: number; cpc: number; ctr: number; clicks: number;
  conversions: number; cpa: number; roas: number;
}
interface DailyRow   { date: string; spend: number; impressions: number; clicks: number; conversions: number; }
interface CampaignRow { campaign_id: string; campaign_name: string; objective: string; spend: number; impressions: number; clicks: number; ctr: number; conversions: number; cpa: number; roas: number; }
interface AdsetRow    { adset_name: string; campaign_name: string; objective: string; spend: number; impressions: number; clicks: number; ctr: number; conversions: number; cpa: number; }
interface CreativeRow { ad_id: string; ad_name: string; adset_name: string; campaign_name: string; objective: string; image_url: string; spend: number; impressions: number; clicks: number; ctr: number; conversions: number; cpa: number; }
interface DashboardData { kpi: KPI; daily: DailyRow[]; campaigns: CampaignRow[]; adsets: AdsetRow[]; creatives: CreativeRow[]; lastSynced: string; }

// ── Presets ────────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: "7D",  days: 7  },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
];
const OBJECTIVES = ["All", "MT-Signup", "MT-Traffic"];
const TABS       = ["Overview", "Campaigns", "Ad Sets", "Creatives"];

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt$ = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtN = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function PaidPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [since, setSince]       = useState(format(subDays(new Date(), 6), "yyyy-MM-dd"));
  const [until, setUntil]       = useState(today);
  const [preset, setPreset]     = useState<number>(7);
  const [objective, setObjective] = useState("All");
  const [tab, setTab]           = useState("Overview");
  const [data, setData]         = useState<DashboardData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ since, until });
      if (objective !== "All") params.set("objective", objective);
      const res = await fetch(`/api/metrics?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [since, until, objective]);

  useEffect(() => { load(); }, [load]);

  const applyPreset = (days: number) => {
    setPreset(days);
    setSince(format(subDays(new Date(), days - 1), "yyyy-MM-dd"));
    setUntil(today);
  };

  const kpi = data?.kpi;

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-[#21262d] sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[#e6edf3] font-bold text-lg tracking-tight">Allingo</span>
              <span className="text-[#30363d]">·</span>
              <span className="text-[#8b949e] text-sm">Ads Dashboard</span>
            </div>
            {data?.lastSynced && (
              <span className="text-[10px] text-[#8b949e] hidden sm:block">
                Last synced: {data.lastSynced}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-0 -mb-px">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === t ? "tab-active" : "tab-inactive"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3">
        {/* Preset buttons */}
        <div className="flex rounded-lg overflow-hidden border border-[#30363d]">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => applyPreset(p.days)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                preset === p.days
                  ? "bg-[#1f6feb] text-white"
                  : "bg-transparent text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <input
            type="date" value={since}
            onChange={(e) => { setSince(e.target.value); setPreset(0); }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
          />
          <span className="text-[#8b949e] text-xs">→</span>
          <input
            type="date" value={until}
            onChange={(e) => { setUntil(e.target.value); setPreset(0); }}
            className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
          />
        </div>

        {/* Objective filter */}
        <select
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-xs text-[#e6edf3] focus:outline-none focus:border-[#58a6ff]"
        >
          {OBJECTIVES.map((o) => <option key={o}>{o}</option>)}
        </select>

        <button
          onClick={load}
          className="px-4 py-1.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white text-xs font-medium rounded-lg transition-colors"
        >
          Apply
        </button>

        {loading && (
          <span className="text-xs text-[#8b949e] flex items-center gap-1.5">
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Loading…
          </span>
        )}
        {error && <span className="text-xs text-red-400">Error: {error}</span>}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 pb-12 space-y-6">
        {/* KPI Row — always visible */}
        {kpi && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard label="Spend"       value={fmt$(kpi.spend)}        />
            <KPICard label="Reach"       value={fmtN(kpi.reach)}        />
            <KPICard label="Impressions" value={fmtN(kpi.impressions)}  />
            <KPICard label="Clicks"      value={fmtN(kpi.clicks)}       />
            <KPICard label="Conversions" value={fmtN(kpi.conversions)}  />
            <KPICard label="ROAS"        value={`${kpi.roas.toFixed(2)}x`} />
          </div>
        )}
        {kpi && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KPICard label="CTR"       value={`${kpi.ctr.toFixed(2)}%`}  />
            <KPICard label="CPM"       value={fmt$(kpi.cpm)}             />
            <KPICard label="CPC"       value={fmt$(kpi.cpc)}             />
            <KPICard label="CPA"       value={fmt$(kpi.cpa)}             />
            <KPICard label="Frequency" value={kpi.frequency.toFixed(2)}  />
          </div>
        )}

        {/* Tab content */}
        {tab === "Overview" && data && (
          <>
            <TrendChart data={data.daily} />
            <CampaignTable data={data.campaigns} />
          </>
        )}

        {tab === "Campaigns" && data && (
          <CampaignTable data={data.campaigns} />
        )}

        {tab === "Ad Sets" && data && (
          <AdsetTable data={data.adsets} />
        )}

        {tab === "Creatives" && data && (
          <CreativeGrid data={data.creatives} />
        )}

        {/* Empty state */}
        {!loading && !error && !data && (
          <div className="card p-12 flex flex-col items-center gap-3 text-center">
            <svg className="w-10 h-10 text-[#30363d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-[#8b949e] text-sm">No data for this date range</p>
          </div>
        )}
      </main>
    </div>
  );
}

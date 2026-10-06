"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import KPICard      from "@/components/KPICard";
import TrendChart   from "@/components/TrendChart";
import CampaignTable from "@/components/CampaignTable";
import AdsetTable   from "@/components/AdsetTable";
import CreativeGrid from "@/components/CreativeGrid";
import CampaignChips from "@/components/CampaignChips";
import DatePicker   from "@/components/DatePicker";

// ── Types ──────────────────────────────────────────────────────────────────────
interface KPI {
  spend: number; reach: number; impressions: number; frequency: number;
  cpm: number; cpc: number; ctr: number; clicks: number;
  conversions: number; cpa: number; roas: number;
}
interface CampaignChip { campaign_id: string; campaign_name: string; objective: string; spend: number; pct: number; }
interface DashboardData {
  kpi: KPI; prevKpi: KPI;
  daily: { date: string; spend: number; impressions: number; clicks: number; conversions: number }[];
  campaigns: { campaign_id: string; campaign_name: string; objective: string; spend: number; impressions: number; clicks: number; ctr: number; conversions: number; cpa: number; roas: number; spendPct: number }[];
  adsets: { adset_name: string; campaign_name: string; objective: string; spend: number; impressions: number; clicks: number; ctr: number; conversions: number; cpa: number }[];
  creatives: { ad_id: string; ad_name: string; adset_name: string; campaign_name: string; objective: string; image_url: string; spend: number; impressions: number; clicks: number; ctr: number; conversions: number; cpa: number }[];
  campaignChips: CampaignChip[];
  lastSynced: string;
}

// ── Formatters ─────────────────────────────────────────────────────────────────
const fmtVnd = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M ₫";
  if (n >= 1_000)     return Math.round(n / 1_000) + "K ₫";
  return n.toLocaleString("vi-VN") + " ₫";
};
const fmtVndFull = (n: number) => n.toLocaleString("vi-VN") + " ₫";
const fmtN = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

// ── Conversion definitions ─────────────────────────────────────────────────────
const CONV_DEF: Record<string, { text: string; color: string }> = {
  "MT-Traffic": { text: "Landing Page View",      color: "#4f6ef7" },
  "MT-Signup":  { text: "Completed Registration", color: "#a855f7" },
  All:          { text: "Varies by objective",    color: "#22c55e" },
};

const TODAY = format(new Date(), "yyyy-MM-dd");

// ── Page ───────────────────────────────────────────────────────────────────────
export default function PaidPage() {
  const [since, setSince]           = useState(format(subDays(new Date(), 6), "yyyy-MM-dd"));
  const [until, setUntil]           = useState(TODAY);
  const [objective, setObjective]   = useState("All");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [data, setData]             = useState<DashboardData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ since, until });
      if (objective !== "All")  params.set("objective",   objective);
      if (campaignId)           params.set("campaign_id", campaignId);
      const res = await fetch(`/api/metrics?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [since, until, objective, campaignId]);

  useEffect(() => { load(); }, [load]);

  function handleDateApply(s: string, u: string) { setSince(s); setUntil(u); }

  function handleObjectiveChange(val: string) {
    setObjective(val);
    setCampaignId(null); // reset campaign filter when objective changes
  }

  function handleCampaignSelect(id: string | null) {
    setCampaignId(id);
    // infer objective from selected campaign chip
    if (id && data?.campaignChips) {
      const chip = data.campaignChips.find((c) => c.campaign_id === id);
      if (chip) setObjective(chip.objective);
    }
    if (!id) setObjective("All");
  }

  const kpi     = data?.kpi;
  const prevKpi = data?.prevKpi;
  const convDef = CONV_DEF[objective] ?? CONV_DEF["All"];

  // period label
  const days = Math.round((new Date(until + "T00:00:00").getTime() - new Date(since + "T00:00:00").getTime()) / 86_400_000) + 1;
  const periodLabel = days === 1 ? "vs. day before" : `vs. prev. ${days} days`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="max-w-screen-2xl mx-auto px-6 flex items-center justify-between h-[52px] gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-[var(--fg)] tracking-tight">Allingo</span>
            <span className="text-[var(--border2)]">·</span>
            <span className="text-[12px] text-[var(--fg3)]">Meta Ads Dashboard · {new Date().getFullYear()}</span>
          </div>
          {data?.lastSynced && (
            <div className="flex items-center gap-[6px] text-[11px] text-[var(--fg3)]">
              <div className="w-[6px] h-[6px] rounded-full bg-[var(--green)]" style={{ boxShadow: "0 0 6px var(--green)" }} />
              Synced {data.lastSynced}
            </div>
          )}
        </div>
      </header>

      {/* ── Campaign filter row ─────────────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-6 py-[10px]" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-[6px] flex-1 min-w-0">
            <div className="text-[10.5px] font-semibold uppercase tracking-[.07em] text-[var(--fg3)] mb-[2px]">
              Campaign
            </div>
            {data?.campaignChips ? (
              <CampaignChips
                chips={data.campaignChips}
                selected={campaignId}
                onSelect={handleCampaignSelect}
              />
            ) : (
              <div className="h-[28px] w-[200px] rounded-full bg-[var(--surface2)] animate-pulse" />
            )}
          </div>

          {/* Conversion definition */}
          <div className="flex flex-col items-end gap-1 shrink-0 pt-[2px]">
            <div className="text-[10px] font-bold uppercase tracking-[.08em] text-[var(--fg3)]">
              Conversion Definition
            </div>
            <div className="flex items-center gap-[6px] px-3 py-[5px] rounded-full text-[11.5px] text-[var(--fg)]"
              style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}>
              <div className="w-[7px] h-[7px] rounded-full shrink-0 transition-colors duration-300"
                style={{ background: convDef.color }} />
              <span className="whitespace-nowrap transition-all duration-200">{convDef.text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-6 py-[10px] flex flex-wrap items-center gap-3"
        style={{ borderBottom: "1px solid var(--border)" }}>

        {/* Date picker */}
        <DatePicker since={since} until={until} onApply={handleDateApply} />

        {/* Objective */}
        <select
          value={objective}
          onChange={(e) => handleObjectiveChange(e.target.value)}
          className="rounded-lg px-3 py-[6px] text-[12.5px] text-[var(--fg)] cursor-pointer appearance-none pr-7 font-['Inter']"
          style={{
            background: `var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238a97b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 8px center`,
            border: "1px solid var(--border2)",
          }}
        >
          <option value="All">All objectives</option>
          <option value="MT-Signup">MT-Signup</option>
          <option value="MT-Traffic">MT-Traffic</option>
        </select>

        {/* Status */}
        {loading && (
          <span className="text-[12px] text-[var(--fg3)] flex items-center gap-[6px]">
            <svg className="animate-spin w-[14px] h-[14px]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Loading…
          </span>
        )}
        {error && <span className="text-[12px] text-[var(--red)]">Error: {error}</span>}

        <span className="text-[11px] text-[var(--fg3)] ml-auto">{periodLabel}</span>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-6 py-6 flex flex-col gap-6">

        {/* ── KPI cards ──────────────────────────────────────────────────── */}
        {kpi && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[10px]">
            <KPICard label="Ad Spend"    value={fmtVnd(kpi.spend)}
              curr={kpi.spend}       prev={prevKpi?.spend}       higherIsBetter={false} />
            <KPICard label="Impressions" value={fmtN(kpi.impressions)}
              curr={kpi.impressions} prev={prevKpi?.impressions} />
            <KPICard label="Clicks"      value={fmtN(kpi.clicks)}
              curr={kpi.clicks}      prev={prevKpi?.clicks} />
            <KPICard label="CTR"         value={kpi.ctr.toFixed(2) + "%"}
              curr={kpi.ctr}         prev={prevKpi?.ctr} />
            <KPICard label="Conversions" value={fmtN(kpi.conversions)}
              curr={kpi.conversions} prev={prevKpi?.conversions} />
            <KPICard label="CPA"         value={fmtVndFull(Math.round(kpi.cpa))}
              curr={kpi.cpa}         prev={prevKpi?.cpa}         higherIsBetter={false} />
          </div>
        )}

        {/* ── Secondary KPIs ─────────────────────────────────────────────── */}
        {kpi && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-[10px]">
            <KPICard label="Reach"     value={fmtN(kpi.reach)}
              curr={kpi.reach}      prev={prevKpi?.reach} />
            <KPICard label="CPM"       value={fmtVndFull(Math.round(kpi.cpm))}
              curr={kpi.cpm}        prev={prevKpi?.cpm}   higherIsBetter={false} />
            <KPICard label="CPC"       value={fmtVndFull(Math.round(kpi.cpc))}
              curr={kpi.cpc}        prev={prevKpi?.cpc}   higherIsBetter={false} />
            <KPICard label="Frequency" value={kpi.frequency.toFixed(2)}
              curr={kpi.frequency}  prev={prevKpi?.frequency} higherIsBetter={false} />
          </div>
        )}

        {/* ── Daily trend ────────────────────────────────────────────────── */}
        {data && <TrendChart data={data.daily} />}

        {/* ── Campaign + Adset tables ─────────────────────────────────────── */}
        {data && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <CampaignTable data={data.campaigns} />
            <AdsetTable    data={data.adsets}    />
          </div>
        )}

        {/* ── Creative grid ───────────────────────────────────────────────── */}
        {data && <CreativeGrid data={data.creatives} />}

        {/* ── Empty state ────────────────────────────────────────────────── */}
        {!loading && !error && !data && (
          <div className="card p-12 flex flex-col items-center gap-3 text-center">
            <svg className="w-10 h-10 text-[var(--border2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-[var(--fg3)] text-sm">No data for this date range</p>
          </div>
        )}
      </main>
    </div>
  );
}

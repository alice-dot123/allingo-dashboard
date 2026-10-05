import { google } from "googleapis";

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? "insights";

function getSheets() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("Missing Google credentials");
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KPI {
  spend: number; reach: number; impressions: number; frequency: number;
  cpm: number; cpc: number; ctr: number; clicks: number;
  conversions: number; cpa: number; roas: number;
}

export interface CampaignChip {
  campaign_id: string;
  campaign_name: string;
  objective: string;
  spend: number;
  pct: number;   // % of total spend (0-100)
}

export interface CampaignRow {
  campaign_id: string; campaign_name: string; objective: string;
  spend: number; impressions: number; clicks: number; ctr: number;
  conversions: number; cpa: number; roas: number; spendPct: number;
}

export interface AdsetRow {
  adset_name: string; campaign_name: string; objective: string;
  spend: number; impressions: number; clicks: number; ctr: number;
  conversions: number; cpa: number;
}

export interface CreativeRow {
  ad_id: string; ad_name: string; adset_name: string;
  campaign_name: string; objective: string; image_url: string;
  spend: number; impressions: number; clicks: number; ctr: number;
  conversions: number; cpa: number;
}

export interface DailyRow {
  date: string; spend: number; impressions: number; clicks: number; conversions: number;
}

export interface DashboardData {
  kpi: KPI;
  prevKpi: KPI;
  daily: DailyRow[];
  campaigns: CampaignRow[];
  adsets: AdsetRow[];
  creatives: CreativeRow[];
  campaignChips: CampaignChip[];
  lastSynced: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateDiff(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime())
    / 86_400_000
  );
}

interface RawRow {
  date: string; campaign_id: string; campaign_name: string; project: string;
  objective: string; campaign_start: string; budget_type: string;
  adset_name: string; ad_name: string; ad_id: string; image_url: string;
  spend: number; reach: number; impressions: number; frequency: number;
  cpm: number; cpc: number; ctr: number; clicks: number;
  conversions: number; cpa: number; roas: number;
}

function buildKPI(rows: RawRow[]): KPI {
  const totalSpend       = rows.reduce((s, r) => s + r.spend, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0) || 1;
  const totalClicks      = rows.reduce((s, r) => s + r.clicks, 0);
  const totalConv        = rows.reduce((s, r) => s + r.conversions, 0);
  const totalReach       = rows.reduce((s, r) => s + r.reach, 0);
  return {
    spend:       totalSpend,
    reach:       totalReach,
    impressions: totalImpressions,
    frequency:   rows.reduce((s, r) => s + r.frequency, 0) / (rows.length || 1),
    cpm:         (totalSpend / totalImpressions) * 1000,
    cpc:         totalSpend / (totalClicks || 1),
    ctr:         (totalClicks / totalImpressions) * 100,
    clicks:      totalClicks,
    conversions: totalConv,
    cpa:         totalSpend / (totalConv || 1),
    roas:        rows.reduce((s, r) => s + r.roas, 0) / (rows.length || 1),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function readDashboard(
  since: string,
  until: string,
  objectiveFilter?: string,
  campaignFilter?: string,
): Promise<DashboardData> {
  const sid = process.env.GOOGLE_SPREADSHEET_ID;
  if (!sid) throw new Error("Missing GOOGLE_SPREADSHEET_ID");

  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sid,
    range: `${SHEET_NAME}!A1:W`,
  });

  const [, ...dataRows] = res.data.values ?? [[]];
  const n = (v: string | undefined) => parseFloat(v ?? "0") || 0;
  const ii = (v: string | undefined) => parseInt(v ?? "0") || 0;

  const allRows: RawRow[] = (dataRows ?? []).map((r) => ({
    date: r[0] ?? "", campaign_id: r[1] ?? "", campaign_name: r[2] ?? "",
    project: r[3] ?? "", objective: r[4] ?? "", campaign_start: r[5] ?? "",
    budget_type: r[6] ?? "", adset_name: r[7] ?? "", ad_name: r[8] ?? "",
    ad_id: r[9] ?? "", image_url: r[10] ?? "",
    spend: n(r[11]), reach: ii(r[12]), impressions: ii(r[13]), frequency: n(r[14]),
    cpm: n(r[15]), cpc: n(r[16]), ctr: n(r[17]), clicks: ii(r[18]),
    conversions: n(r[19]), cpa: n(r[20]), roas: n(r[21]),
  }));

  const lastSynced = (dataRows?.[dataRows.length - 1]?.[22]) ?? "";

  // ── Prev period dates ────────────────────────────────────────────────────────
  const span      = dateDiff(since, until);            // e.g. 6 for 7D
  const prevUntil = addDays(since, -1);
  const prevSince = addDays(prevUntil, -span);

  // ── Filter helpers ───────────────────────────────────────────────────────────
  const filterRows = (rows: RawRow[], s: string, u: string) =>
    rows
      .filter((r) => r.date >= s && r.date <= u)
      .filter((r) => !objectiveFilter || r.objective === objectiveFilter)
      .filter((r) => !campaignFilter   || r.campaign_id === campaignFilter);

  const rows     = filterRows(allRows, since, until);
  const prevRows = filterRows(allRows, prevSince, prevUntil);

  const kpi     = buildKPI(rows);
  const prevKpi = buildKPI(prevRows);

  // ── Campaign chips (no campaign filter applied — show all campaigns) ─────────
  const chipRows = allRows
    .filter((r) => r.date >= since && r.date <= until)
    .filter((r) => !objectiveFilter || r.objective === objectiveFilter);

  const chipMap = new Map<string, CampaignChip>();
  for (const r of chipRows) {
    const ex = chipMap.get(r.campaign_id);
    if (!ex) chipMap.set(r.campaign_id, { campaign_id: r.campaign_id, campaign_name: r.campaign_name, objective: r.objective, spend: r.spend, pct: 0 });
    else ex.spend += r.spend;
  }
  const totalChipSpend = Array.from(chipMap.values()).reduce((s, c) => s + c.spend, 0) || 1;
  const campaignChips  = Array.from(chipMap.values())
    .map((c) => ({ ...c, pct: Math.round((c.spend / totalChipSpend) * 100) }))
    .sort((a, b) => b.spend - a.spend);

  // ── Daily ────────────────────────────────────────────────────────────────────
  const dailyMap = new Map<string, DailyRow>();
  for (const r of rows) {
    const ex = dailyMap.get(r.date);
    if (!ex) dailyMap.set(r.date, { date: r.date, spend: r.spend, impressions: r.impressions, clicks: r.clicks, conversions: r.conversions });
    else { ex.spend += r.spend; ex.impressions += r.impressions; ex.clicks += r.clicks; ex.conversions += r.conversions; }
  }
  const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // ── Campaigns ────────────────────────────────────────────────────────────────
  const campMap = new Map<string, CampaignRow & { roasSum: number; roasCnt: number }>();
  for (const r of rows) {
    const ex = campMap.get(r.campaign_id);
    if (!ex) campMap.set(r.campaign_id, { campaign_id: r.campaign_id, campaign_name: r.campaign_name, objective: r.objective, spend: r.spend, impressions: r.impressions, clicks: r.clicks, ctr: 0, conversions: r.conversions, cpa: 0, roas: 0, spendPct: 0, roasSum: r.roas, roasCnt: 1 });
    else { ex.spend += r.spend; ex.impressions += r.impressions; ex.clicks += r.clicks; ex.conversions += r.conversions; ex.roasSum += r.roas; ex.roasCnt++; }
  }
  const totalCampSpend = Array.from(campMap.values()).reduce((s, c) => s + c.spend, 0) || 1;
  const campaigns: CampaignRow[] = Array.from(campMap.values()).map((c) => ({
    campaign_id: c.campaign_id, campaign_name: c.campaign_name, objective: c.objective,
    spend: c.spend, impressions: c.impressions, clicks: c.clicks, conversions: c.conversions,
    ctr: (c.clicks / (c.impressions || 1)) * 100,
    cpa: c.spend / (c.conversions || 1),
    roas: c.roasSum / (c.roasCnt || 1),
    spendPct: Math.round((c.spend / totalCampSpend) * 100),
  })).sort((a, b) => b.spend - a.spend);

  // ── Adsets ───────────────────────────────────────────────────────────────────
  const adsetMap = new Map<string, AdsetRow>();
  for (const r of rows) {
    const key = `${r.campaign_id}|${r.adset_name}`;
    const ex  = adsetMap.get(key);
    if (!ex) adsetMap.set(key, { adset_name: r.adset_name, campaign_name: r.campaign_name, objective: r.objective, spend: r.spend, impressions: r.impressions, clicks: r.clicks, ctr: 0, conversions: r.conversions, cpa: 0 });
    else { ex.spend += r.spend; ex.impressions += r.impressions; ex.clicks += r.clicks; ex.conversions += r.conversions; }
  }
  const adsets: AdsetRow[] = Array.from(adsetMap.values()).map((a) => ({
    ...a,
    ctr: (a.clicks / (a.impressions || 1)) * 100,
    cpa: a.spend / (a.conversions || 1),
  })).sort((a, b) => b.spend - a.spend);

  // ── Creatives ─────────────────────────────────────────────────────────────────
  const creativeMap = new Map<string, CreativeRow>();
  for (const r of rows) {
    const ex = creativeMap.get(r.ad_id);
    if (!ex) creativeMap.set(r.ad_id, { ad_id: r.ad_id, ad_name: r.ad_name, adset_name: r.adset_name, campaign_name: r.campaign_name, objective: r.objective, image_url: r.image_url, spend: r.spend, impressions: r.impressions, clicks: r.clicks, ctr: 0, conversions: r.conversions, cpa: 0 });
    else { ex.spend += r.spend; ex.impressions += r.impressions; ex.clicks += r.clicks; ex.conversions += r.conversions; if (!ex.image_url && r.image_url) ex.image_url = r.image_url; }
  }
  const creatives: CreativeRow[] = Array.from(creativeMap.values()).map((c) => ({
    ...c,
    ctr: (c.clicks / (c.impressions || 1)) * 100,
    cpa: c.spend / (c.conversions || 1),
  })).sort((a, b) => b.ctr - a.ctr);

  return { kpi, prevKpi, daily, campaigns, adsets, creatives, campaignChips, lastSynced };
}

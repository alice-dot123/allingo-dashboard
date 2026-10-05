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

export interface RawRow {
  date: string;
  campaign_id: string;
  campaign_name: string;
  project: string;
  objective: string;
  campaign_start: string;
  budget_type: string;
  adset_name: string;
  ad_name: string;
  ad_id: string;
  image_url: string;
  spend: number;
  reach: number;
  impressions: number;
  frequency: number;
  cpm: number;
  cpc: number;
  ctr: number;
  clicks: number;
  conversions: number;
  cpa: number;
  roas: number;
}

export interface KPI {
  spend: number;
  reach: number;
  impressions: number;
  frequency: number;
  cpm: number;
  cpc: number;
  ctr: number;
  clicks: number;
  conversions: number;
  cpa: number;
  roas: number;
}

export interface CampaignRow {
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

export interface AdsetRow {
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

export interface CreativeRow {
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

export interface DailyRow {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface DashboardData {
  kpi: KPI;
  daily: DailyRow[];
  campaigns: CampaignRow[];
  adsets: AdsetRow[];
  creatives: CreativeRow[];
  lastSynced: string;
}

// ─── Read & parse ─────────────────────────────────────────────────────────────

export async function readDashboard(
  since: string,
  until: string,
  objectiveFilter?: string
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
  const i = (v: string | undefined) => parseInt(v ?? "0") || 0;

  const rows: RawRow[] = (dataRows ?? [])
    .map((r) => ({
      date:           r[0]  ?? "",
      campaign_id:    r[1]  ?? "",
      campaign_name:  r[2]  ?? "",
      project:        r[3]  ?? "",
      objective:      r[4]  ?? "",
      campaign_start: r[5]  ?? "",
      budget_type:    r[6]  ?? "",
      adset_name:     r[7]  ?? "",
      ad_name:        r[8]  ?? "",
      ad_id:          r[9]  ?? "",
      image_url:      r[10] ?? "",
      spend:          n(r[11]),
      reach:          i(r[12]),
      impressions:    i(r[13]),
      frequency:      n(r[14]),
      cpm:            n(r[15]),
      cpc:            n(r[16]),
      ctr:            n(r[17]),
      clicks:         i(r[18]),
      conversions:    n(r[19]),
      cpa:            n(r[20]),
      roas:           n(r[21]),
    }))
    .filter((r) => r.date >= since && r.date <= until)
    .filter((r) => !objectiveFilter || r.objective === objectiveFilter);

  const lastSynced = (dataRows?.[dataRows.length - 1]?.[22]) ?? "";

  // KPI
  const totalSpend       = rows.reduce((s, r) => s + r.spend, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0) || 1;
  const totalClicks      = rows.reduce((s, r) => s + r.clicks, 0);
  const totalConv        = rows.reduce((s, r) => s + r.conversions, 0);
  const totalReach       = rows.reduce((s, r) => s + r.reach, 0);

  const kpi: KPI = {
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

  // Daily
  const dailyMap = new Map<string, DailyRow>();
  for (const r of rows) {
    const ex = dailyMap.get(r.date);
    if (!ex) dailyMap.set(r.date, { date: r.date, spend: r.spend, impressions: r.impressions, clicks: r.clicks, conversions: r.conversions });
    else { ex.spend += r.spend; ex.impressions += r.impressions; ex.clicks += r.clicks; ex.conversions += r.conversions; }
  }
  const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Campaigns
  const campMap = new Map<string, CampaignRow>();
  for (const r of rows) {
    const ex = campMap.get(r.campaign_id);
    if (!ex) campMap.set(r.campaign_id, { campaign_id: r.campaign_id, campaign_name: r.campaign_name, objective: r.objective, spend: r.spend, impressions: r.impressions, clicks: r.clicks, ctr: 0, conversions: r.conversions, cpa: 0, roas: r.roas });
    else { ex.spend += r.spend; ex.impressions += r.impressions; ex.clicks += r.clicks; ex.conversions += r.conversions; ex.roas += r.roas; }
  }
  const campaigns = Array.from(campMap.values()).map((c) => ({
    ...c,
    ctr: (c.clicks / (c.impressions || 1)) * 100,
    cpa: c.spend / (c.conversions || 1),
    roas: c.roas / (rows.filter((r) => r.campaign_id === c.campaign_id).length || 1),
  }));

  // Adsets
  const adsetMap = new Map<string, AdsetRow>();
  for (const r of rows) {
    const key = `${r.campaign_id}|${r.adset_name}`;
    const ex  = adsetMap.get(key);
    if (!ex) adsetMap.set(key, { adset_name: r.adset_name, campaign_name: r.campaign_name, objective: r.objective, spend: r.spend, impressions: r.impressions, clicks: r.clicks, ctr: 0, conversions: r.conversions, cpa: 0 });
    else { ex.spend += r.spend; ex.impressions += r.impressions; ex.clicks += r.clicks; ex.conversions += r.conversions; }
  }
  const adsets = Array.from(adsetMap.values()).map((a) => ({
    ...a,
    ctr: (a.clicks / (a.impressions || 1)) * 100,
    cpa: a.spend / (a.conversions || 1),
  }));

  // Creatives
  const creativeMap = new Map<string, CreativeRow>();
  for (const r of rows) {
    const ex = creativeMap.get(r.ad_id);
    if (!ex) creativeMap.set(r.ad_id, { ad_id: r.ad_id, ad_name: r.ad_name, adset_name: r.adset_name, campaign_name: r.campaign_name, objective: r.objective, image_url: r.image_url, spend: r.spend, impressions: r.impressions, clicks: r.clicks, ctr: 0, conversions: r.conversions, cpa: 0 });
    else { ex.spend += r.spend; ex.impressions += r.impressions; ex.clicks += r.clicks; ex.conversions += r.conversions; if (!ex.image_url && r.image_url) ex.image_url = r.image_url; }
  }
  const creatives = Array.from(creativeMap.values()).map((c) => ({
    ...c,
    ctr: (c.clicks / (c.impressions || 1)) * 100,
    cpa: c.spend / (c.conversions || 1),
  }));

  return { kpi, daily, campaigns, adsets, creatives, lastSynced };
}

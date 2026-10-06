import { NextRequest, NextResponse } from "next/server";
import { readDashboard } from "@/lib/sheets";
import { format, subDays } from "date-fns";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const until      = searchParams.get("until")      ?? format(new Date(), "yyyy-MM-dd");
  const since      = searchParams.get("since")      ?? format(subDays(new Date(), 6), "yyyy-MM-dd");
  const objective  = searchParams.get("objective")  ?? undefined;
  const campaignId = searchParams.get("campaign_id") ?? undefined;

  try {
    const data = await readDashboard(since, until, objective ?? undefined, campaignId ?? undefined);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[metrics]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

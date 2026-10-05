"use client";

interface CampaignChip {
  campaign_id: string;
  campaign_name: string;
  objective: string;
  spend: number;
  pct: number;
}

interface Props {
  chips: CampaignChip[];
  selected: string | null; // null = "All"
  onSelect: (id: string | null) => void;
}

// color palette for campaign dots (cycles through)
const CHIP_COLORS = ["#4f6ef7","#a855f7","#22c55e","#f59e0b","#f43f5e","#06b6d4","#ec4899"];

export default function CampaignChips({ chips, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-[5px]">
      {/* All chip */}
      <button
        onClick={() => onSelect(null)}
        className={`inline-flex items-center gap-[5px] px-[10px] py-[4px] rounded-full text-[11.5px] font-medium border transition-all cursor-pointer font-['Inter'] ${
          selected === null
            ? "bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)] font-bold"
            : "bg-transparent text-[var(--fg2)] border-[var(--border2)] hover:bg-[var(--surface2)] hover:text-[var(--fg)]"
        }`}
      >
        All
        <span className={`text-[10.5px] font-mono ${selected === null ? "text-[var(--bg)] opacity-60" : "text-[var(--fg3)]"}`}>
          100%
        </span>
      </button>

      {/* Campaign chips */}
      {chips.map((c, idx) => {
        const color = CHIP_COLORS[idx % CHIP_COLORS.length];
        const active = selected === c.campaign_id;
        // Short display name
        const shortName = c.campaign_name.length > 28
          ? c.campaign_name.slice(0, 26) + "…"
          : c.campaign_name;

        return (
          <button
            key={c.campaign_id}
            onClick={() => onSelect(active ? null : c.campaign_id)}
            className={`inline-flex items-center gap-[5px] px-[10px] py-[4px] rounded-full text-[11.5px] font-medium border transition-all cursor-pointer whitespace-nowrap font-['Inter'] ${
              active
                ? "bg-[var(--surface2)] border-[var(--accent)] text-[var(--fg)]"
                : "bg-transparent text-[var(--fg2)] border-[var(--border2)] hover:bg-[var(--surface2)] hover:text-[var(--fg)]"
            }`}
          >
            <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: color }} />
            {shortName}
            <span className="text-[10.5px] font-mono text-[var(--fg3)]">{c.pct}%</span>
          </button>
        );
      })}
    </div>
  );
}

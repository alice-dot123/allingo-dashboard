"use client";

import { useEffect, useRef, useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Props {
  since: string;
  until: string;
  onApply: (since: string, until: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WDAYS  = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function fmtLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}

function isoOf(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const TODAY = format(new Date(), "yyyy-MM-dd");

// ── Calendar month render ──────────────────────────────────────────────────────
function CalMonth({
  year, month, selStart, selEnd, hover,
  onDay, onHover, onClearHover,
  showPrev, showNext, onNav,
}: {
  year: number; month: number;
  selStart: string; selEnd: string; hover: string | null;
  onDay: (iso: string) => void;
  onHover: (iso: string) => void;
  onClearHover: () => void;
  showPrev: boolean; showNext: boolean;
  onNav: (dir: number) => void;
}) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInM  = new Date(year, month + 1, 0).getDate();
  const daysInP  = new Date(year, month, 0).getDate();
  const rangeEnd = hover && hover > selStart ? hover : selEnd;

  const cells: { iso: string; inMonth: boolean; day: number }[] = [];
  for (let i = 0; i < firstDow; i++)
    cells.push({ iso: isoOf(year, month - 1, daysInP - firstDow + 1 + i), inMonth: false, day: daysInP - firstDow + 1 + i });
  for (let d = 1; d <= daysInM; d++)
    cells.push({ iso: isoOf(year, month, d), inMonth: true, day: d });
  const rem = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let d = 1; d <= rem; d++)
    cells.push({ iso: isoOf(year, month + 1, d), inMonth: false, day: d });

  return (
    <div className="flex-1 min-w-[200px]">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        {showPrev
          ? <button onClick={() => onNav(-1)} className="dp-nav">‹</button>
          : <div className="w-[26px]" />}
        <span className="text-[13px] font-semibold text-[var(--fg)]">{MONTHS[month]} {year}</span>
        {showNext
          ? <button onClick={() => onNav(1)} className="dp-nav">›</button>
          : <div className="w-[26px]" />}
      </div>

      {/* weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {WDAYS.map((w) => (
          <div key={w} className="text-center text-[10.5px] font-semibold text-[var(--fg3)] py-1 tracking-wider">{w}</div>
        ))}
      </div>

      {/* days */}
      <div className="grid grid-cols-7 gap-[2px]">
        {cells.map(({ iso, inMonth, day }) => {
          const isStart = iso === selStart;
          const isEnd   = iso === (hover && hover > selStart ? hover : selEnd);
          const inRange = iso > selStart && iso < rangeEnd;
          const isToday = iso === TODAY;

          let cls = "dp-day";
          if (!inMonth) cls += " opacity-40";
          if (isStart)  cls += " dp-range-start";
          else if (isEnd && iso !== selStart) cls += " dp-range-end";
          else if (inRange) cls += " dp-in-range";
          if (isToday && !isStart && !isEnd) cls += " dp-today";

          return (
            <button
              key={iso}
              className={cls}
              onClick={() => onDay(iso)}
              onMouseEnter={() => onHover(iso)}
              onMouseLeave={onClearHover}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function DatePicker({ since, until, onApply }: Props) {
  const [open, setOpen]       = useState(false);
  const [selStart, setStart]  = useState(since);
  const [selEnd, setEnd]      = useState(until);
  const [picking, setPicking] = useState(false); // true = waiting for end click
  const [hover, setHover]     = useState<string | null>(null);
  const [leftYear, setLeftYear]   = useState(() => new Date(since + "T00:00:00").getFullYear());
  const [leftMonth, setLeftMonth] = useState(() => new Date(since + "T00:00:00").getMonth());

  const wrapRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // sync if parent changes
  useEffect(() => { setStart(since); setEnd(until); }, [since, until]);

  function rightMonth() { return leftMonth === 11 ? 0 : leftMonth + 1; }
  function rightYear()  { return leftMonth === 11 ? leftYear + 1 : leftYear; }

  function navCal(dir: number) {
    let m = leftMonth + dir, y = leftYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setLeftMonth(m); setLeftYear(y);
  }

  function handleDay(iso: string) {
    if (!picking) {
      setStart(iso); setEnd(iso); setPicking(true);
    } else {
      const [s, e] = iso < selStart ? [iso, selStart] : [selStart, iso];
      setStart(s); setEnd(e); setPicking(false); setHover(null);
    }
  }

  function applyPreset(label: string, s: string, e: string) {
    setStart(s); setEnd(e); setPicking(false); setHover(null);
    const d = new Date(s + "T00:00:00");
    setLeftYear(d.getFullYear()); setLeftMonth(d.getMonth());
    // highlight preset
    document.querySelectorAll(".dp-preset").forEach((el) =>
      el.classList.toggle("dp-preset-active", el.textContent?.trim() === label)
    );
  }

  function apply() {
    onApply(selStart, selEnd);
    setOpen(false);
  }

  const presets = [
    { label: "Yesterday",   s: format(subDays(new Date(), 1), "yyyy-MM-dd"),  e: format(subDays(new Date(), 1), "yyyy-MM-dd") },
    { label: "Last 7 days", s: format(subDays(new Date(), 6), "yyyy-MM-dd"),  e: TODAY },
    { label: "Last 28 days",s: format(subDays(new Date(), 27), "yyyy-MM-dd"), e: TODAY },
    { label: "This month",  s: format(startOfMonth(new Date()), "yyyy-MM-dd"), e: TODAY },
    { label: "Last month",  s: format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd"), e: format(endOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd") },
  ];

  return (
    <>
      {/* ── inline styles for calendar ── */}
      <style>{`
        .dp-nav {
          width:26px;height:26px;border:1px solid var(--border2);border-radius:6px;
          background:transparent;color:var(--fg2);cursor:pointer;font-size:15px;
          display:flex;align-items:center;justify-content:center;transition:background .12s;
        }
        .dp-nav:hover{background:var(--surface2);}
        .dp-day {
          aspect-ratio:1;display:flex;align-items:center;justify-content:center;
          font-size:12.5px;color:var(--fg2);cursor:pointer;border-radius:6px;
          border:none;background:none;transition:background .1s,color .1s;font-family:'Inter',sans-serif;
        }
        .dp-day:hover{background:var(--surface2);color:var(--fg);}
        .dp-today{font-weight:700;color:var(--accent2);}
        .dp-in-range{background:rgba(79,110,247,.12);border-radius:0;color:var(--fg);}
        .dp-range-start{background:var(--accent)!important;color:#fff!important;border-radius:6px 0 0 6px;}
        .dp-range-end{background:var(--accent)!important;color:#fff!important;border-radius:0 6px 6px 0;}
        .dp-preset{display:block;padding:9px 18px;font-size:13px;color:var(--fg2);cursor:pointer;
          border:none;background:none;text-align:left;width:100%;transition:background .1s,color .1s;font-family:'Inter',sans-serif;}
        .dp-preset:hover{background:var(--surface2);color:var(--fg);}
        .dp-preset-active{background:rgba(79,110,247,.12);color:var(--accent2);font-weight:500;}
      `}</style>

      <div className="relative" ref={wrapRef}>
        {/* Trigger */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-[6px] bg-[var(--surface)] border border-[var(--border2)] rounded-lg text-[12.5px] text-[var(--fg)] cursor-pointer transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface2)] whitespace-nowrap font-['Inter']"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--fg3)]">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {fmtLabel(selStart)} – {fmtLabel(selEnd)}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`text-[var(--fg3)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-[200] rounded-xl overflow-hidden shadow-2xl"
            style={{ background: "#181f32", border: "1px solid var(--border2)", minWidth: 680 }}>
            <div className="flex">
              {/* Sidebar */}
              <div className="w-[190px] shrink-0 border-r border-[var(--border)] py-2">
                {presets.map((p) => (
                  <button key={p.label} className="dp-preset" onClick={() => applyPreset(p.label, p.s, p.e)}>
                    {p.label}
                  </button>
                ))}
                <button className="dp-preset dp-preset-active">Custom</button>
              </div>

              {/* Calendars */}
              <div className="flex flex-1 gap-6 px-5 pt-4">
                <CalMonth
                  year={leftYear} month={leftMonth}
                  selStart={selStart} selEnd={selEnd} hover={picking ? hover : null}
                  onDay={handleDay} onHover={(d) => picking && setHover(d)} onClearHover={() => setHover(null)}
                  showPrev showNext={false} onNav={navCal}
                />
                <CalMonth
                  year={rightYear()} month={rightMonth()}
                  selStart={selStart} selEnd={selEnd} hover={picking ? hover : null}
                  onDay={handleDay} onHover={(d) => picking && setHover(d)} onClearHover={() => setHover(null)}
                  showPrev={false} showNext onNav={navCal}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="date" value={selStart}
                  onChange={(e) => { setStart(e.target.value); setPicking(false); }}
                  className="bg-[var(--surface)] border border-[var(--border2)] rounded-md px-3 py-[5px] text-xs text-[var(--fg)] font-mono w-[130px]"
                />
                <span className="text-[var(--fg3)]">–</span>
                <input
                  type="date" value={selEnd}
                  onChange={(e) => { setEnd(e.target.value); setPicking(false); }}
                  className="bg-[var(--surface)] border border-[var(--border2)] rounded-md px-3 py-[5px] text-xs text-[var(--fg)] font-mono w-[130px]"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)}
                  className="px-4 py-[6px] text-[12.5px] text-[var(--fg2)] bg-transparent border border-[var(--border2)] rounded-md cursor-pointer hover:bg-[var(--surface2)] font-['Inter'] transition-colors">
                  Cancel
                </button>
                <button onClick={apply}
                  className="px-5 py-[6px] text-[12.5px] font-semibold text-white bg-[var(--accent)] border-none rounded-md cursor-pointer hover:bg-[var(--accent2)] font-['Inter'] transition-colors">
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

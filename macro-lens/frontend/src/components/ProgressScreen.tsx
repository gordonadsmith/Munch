import { useState, useCallback } from "react";
import { UserProfile, WeightEntry, DailyCalorieEntry, NutritionGoals, Aggressiveness, DayScore, FoodEntry } from "../types";
import ProgressCheckup from "./ProgressCheckup";
import { getScoreLabel } from "../useStreak";
import WeeklyReport from "./WeeklyReport";

interface Props {
  profile: UserProfile;
  latestWeight: WeightEntry | null;
  getRange: (days: number) => { weight: WeightEntry[]; calories: DailyCalorieEntry[] };
  onLogWeight: (lbs: number) => void;
  onUpdatePlan: (newWeightLbs: number, goals: NutritionGoals, aggressiveness: Aggressiveness) => void;
  scores: DayScore[];
  entries: FoodEntry[];
  currentStreak: number;
}

type Range = 7 | 30;

// Generate all dates in a range
function getDatesInRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function formatDate(dateStr: string, short = false): string {
  const d = new Date(dateStr + "T12:00:00");
  if (short) return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Score chart ───────────────────────────────────────────────────────────────
function ScoreChart({ dates, scoreMap }: { dates: string[]; scoreMap: Map<string, DayScore> }) {
  const today = new Date().toISOString().slice(0, 10);
  const isMonth = dates.length > 10;

  if (isMonth) {
    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "5px" }}>
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: "10px", fontWeight: 700, color: "var(--ink-4)", paddingBottom: "4px" }}>{d}</div>
          ))}
          {dates.map(date => {
            const s = scoreMap.get(date);
            const hasData = s && s.entriesLogged > 0;
            const { color } = hasData ? getScoreLabel(s!.score) : { color: "var(--ink-5)" };
            const isToday = date === today;
            return (
              <div key={date} title={`${formatDate(date)}: ${hasData ? `Score ${s!.score}` : "No data"}`}
                style={{ aspectRatio: "1", borderRadius: "50%", background: hasData ? `${color}18` : "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", border: isToday ? `2px solid ${color}` : `1px solid ${hasData ? color + "44" : "var(--border)"}` }}>
                {hasData && <span style={{ fontSize: "9px", fontWeight: 800, color }}>{s!.score}</span>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
          {[{ label: "Excellent (85+)", color: "#15803d" }, { label: "Good (55+)", color: "#2563eb" }, { label: "Keep going", color: "#dc2626" }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
              <span style={{ fontSize: "11px", color: "var(--ink-4)" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Week: bars
  return (
    <div>
      <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: 100 }}>
        {dates.map(date => {
          const s = scoreMap.get(date);
          const hasData = s && s.entriesLogged > 0;
          const score = hasData ? s!.score : 0;
          const { color } = hasData ? getScoreLabel(score) : { color: "var(--border-mid)" };
          const barH = hasData ? Math.max(6, (score / 100) * 90) : 4;
          const isToday = date === today;
          return (
            <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", justifyContent: "flex-end", height: "100%" }}>
              {hasData && (
                <span style={{ fontSize: "10px", fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
              )}
              <div style={{ width: "100%", height: barH, background: hasData ? `${color}22` : "var(--border)", borderRadius: "5px 5px 0 0", border: `1.5px solid ${hasData ? color : "var(--border-mid)"}`, transition: "height 0.5s cubic-bezier(0.34,1.56,0.64,1)", position: "relative" }}>
                {isToday && <div style={{ position: "absolute", inset: -1, borderRadius: "5px 5px 0 0", border: `2px solid ${color}`, pointerEvents: "none" }} />}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
        {dates.map(date => {
          const isToday = date === today;
          return (
            <div key={date} style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: isToday ? 700 : 500, color: isToday ? "var(--forest)" : "var(--ink-4)" }}>
                {formatDate(date, true)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Score summary ─────────────────────────────────────────────────────────────
function ScoreSummary({ scores }: { scores: DayScore[] }) {
  if (scores.length === 0) return null;
  const scored = scores.filter(s => s.entriesLogged > 0);
  if (scored.length === 0) return null;

  const avg = Math.round(scored.reduce((s, d) => s + d.score, 0) / scored.length);
  const excellent = scored.filter(s => s.score >= 85).length;
  const good = scored.filter(s => s.score >= 55 && s.score < 85).length;
  const struggling = scored.filter(s => s.score < 55).length;
  const { color, label, emoji } = getScoreLabel(avg);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: `${color}12`, borderRadius: "var(--r)", marginBottom: "10px", border: `1px solid ${color}22` }}>
        <span style={{ fontSize: "20px" }}>{emoji}</span>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 700, color }}>{label} — avg {avg}/100</p>
          <p style={{ fontSize: "11px", color: "var(--ink-4)" }}>{scored.length} day{scored.length !== 1 ? "s" : ""} tracked</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        {[
          { label: "Excellent", count: excellent, color: "#15803d", bg: "#f0fdf4" },
          { label: "Good",      count: good,      color: "#1d4ed8", bg: "#eff6ff" },
          { label: "Tough",     count: struggling, color: "#dc2626", bg: "#fef2f2" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} style={{ flex: 1, background: bg, borderRadius: "var(--r-sm)", padding: "10px 8px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color, lineHeight: 1, marginBottom: "2px" }}>{count}</p>
            <p style={{ fontSize: "10px", fontWeight: 600, color }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Weight chart ──────────────────────────────────────────────────────────────
function WeightChart({ entries, goal }: { entries: WeightEntry[]; goal: "lose_weight" | "build_muscle" | "maintain" | "improve_fitness" | "eat_healthier" }) {
  if (entries.length < 2) return null;

  const weights = entries.map(e => e.weightLbs);
  const min = Math.min(...weights) - 3;
  const max = Math.max(...weights) + 3;
  const range = max - min;
  const width = 300;
  const height = 80;

  const points = entries.map((e, i) => ({
    x: (i / (entries.length - 1)) * width,
    y: height - ((e.weightLbs - min) / range) * height,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L 0 ${height} Z`;

  const first = entries[0].weightLbs;
  const last = entries[entries.length - 1].weightLbs;
  const diff = last - first;
  const isGood = (goal === "lose_weight" && diff < 0) || (goal === "build_muscle" && diff > 0) || (Math.abs(diff) < 2);
  const lineColor = isGood ? "var(--green)" : "var(--red)";

  return (
    <div>
      <svg width="100%" height={height + 4} viewBox={`0 0 ${width} ${height + 4}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isGood ? "#22c55e" : "#ef4444"} stopOpacity="0.15" />
            <stop offset="100%" stopColor={isGood ? "#22c55e" : "#ef4444"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#wgrad)" />
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={lineColor} />
        ))}
      </svg>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={{ fontSize: "11px", color: "var(--ink-4)" }}>{formatDate(entries[0].date)}</span>
        <span style={{ fontSize: "11px", color: "var(--ink-4)" }}>{formatDate(entries[entries.length - 1].date)}</span>
      </div>
    </div>
  );
}

// ── ProgressScreen ────────────────────────────────────────────────────────────
export default function ProgressScreen({ profile, latestWeight, getRange, onLogWeight, onUpdatePlan, scores, entries, currentStreak }: Props) {
  const [range, setRange] = useState<Range>(7);
  const [showCheckup, setShowCheckup] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [weightInput, setWeightInput] = useState(String(Math.round(latestWeight?.weightLbs ?? profile.weightKg * 2.205)));

  const { weight: weightEntries } = getRange(range);
  const allDates = getDatesInRange(range);

  // Build score map for the selected range
  const cutoff = allDates[0];
  const rangeScores = scores.filter(s => s.date >= cutoff);
  const scoreMap = new Map<string, DayScore>(rangeScores.map(s => [s.date, s]));

  const startWeight = profile.weightKg * 2.205;
  const currentWeight = latestWeight?.weightLbs ?? startWeight;
  const weightDiff = currentWeight - startWeight;
  const goal = profile.goal;

  const weightChangeIsPositive =
    (goal === "lose_weight" && weightDiff <= 0) ||
    (goal === "build_muscle" && weightDiff >= 0) ||
    Math.abs(weightDiff) < 1;

  const handleCheckupComplete = useCallback((newWeightLbs: number, goals: NutritionGoals, aggressiveness: Aggressiveness) => {
    onLogWeight(newWeightLbs);
    onUpdatePlan(newWeightLbs, goals, aggressiveness);
    setShowCheckup(false);
  }, [onLogWeight, onUpdatePlan]);

  const handleLogWeight = () => {
    const lbs = parseFloat(weightInput);
    if (!isNaN(lbs) && lbs > 50 && lbs < 700) {
      onLogWeight(lbs);
      setShowWeightInput(false);
    }
  };

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>

        {/* ── Weight hero ── */}
        <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "20px var(--page-x) 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Current weight</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "40px", fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>
                  {Math.round(currentWeight)}
                </p>
                <span style={{ fontSize: "16px", color: "var(--ink-4)" }}>lbs</span>
              </div>
              {latestWeight && (
                <p style={{ fontSize: "11px", color: "var(--ink-4)", marginTop: "3px" }}>
                  Updated {formatDate(latestWeight.date)}
                </p>
              )}
            </div>

            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Since start</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: weightChangeIsPositive ? "var(--green)" : "var(--red)", lineHeight: 1 }}>
                {weightDiff === 0 ? "—" : `${weightDiff > 0 ? "+" : ""}${weightDiff.toFixed(1)}`}
              </p>
              <p style={{ fontSize: "11px", color: "var(--ink-4)", marginTop: "2px" }}>lbs</p>
            </div>
          </div>

          {/* Weight chart */}
          {weightEntries.length >= 2 && (
            <div style={{ marginBottom: "16px" }}>
              <WeightChart entries={weightEntries} goal={goal} />
            </div>
          )}

          {/* Update weight / quick input */}
          {showWeightInput ? (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ flex: 1, background: "var(--bg)", borderRadius: "var(--r)", border: "1.5px solid var(--forest)", display: "flex", alignItems: "center", overflow: "hidden" }}>
                <button onClick={() => setWeightInput(w => String(Math.max(50, parseFloat(w) - 1)))} style={{ width: 40, height: 44, fontSize: "18px", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>−</button>
                <input value={weightInput} onChange={e => setWeightInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleLogWeight(); }}
                  style={{ flex: 1, fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, textAlign: "center", color: "var(--ink)" }}
                />
                <button onClick={() => setWeightInput(w => String(parseFloat(w) + 1))} style={{ width: 40, height: 44, fontSize: "18px", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>+</button>
              </div>
              <span style={{ fontSize: "13px", color: "var(--ink-4)" }}>lbs</span>
              <button onClick={handleLogWeight} style={{ padding: "10px 16px", background: "var(--forest)", border: "none", borderRadius: "var(--r)", fontSize: "13px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>Save</button>
              <button onClick={() => setShowWeightInput(false)} style={{ padding: "10px", fontSize: "18px", color: "var(--ink-4)", cursor: "pointer" }}>×</button>
            </div>
          ) : (
            <button onClick={() => setShowWeightInput(true)} style={{
              width: "100%", padding: "11px",
              background: "var(--forest-xpale)", border: "1.5px solid rgba(26,71,49,0.15)",
              borderRadius: "var(--r)", fontSize: "13px", fontWeight: 600, color: "var(--forest)",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              + Update weight
            </button>
          )}
        </div>

        {/* ── Weekly Report ── */}
        <div style={{ margin: "12px var(--page-x) 0" }}>
          <button
            onClick={() => setShowReport(true)}
            style={{
              width: "100%", background: "var(--surface)",
              border: "1.5px solid var(--border-mid)", borderRadius: "var(--r-lg)",
              padding: "14px 16px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer", boxShadow: "var(--shadow-sm)", transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--forest-xpale)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📊</div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)", lineHeight: 1, marginBottom: "3px" }}>Weekly Report</p>
                <p style={{ fontSize: "12px", color: "var(--ink-4)" }}>Review this week's progress</p>
              </div>
            </div>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1 1l5 5-5 5" stroke="var(--ink-4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* ── Check-in CTA ── */}
        <div style={{ margin: "12px var(--page-x) 0" }}>
          <button
            onClick={() => setShowCheckup(true)}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, var(--forest) 0%, var(--forest-mid) 100%)",
              border: "none", borderRadius: "var(--r-lg)",
              padding: "18px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer", boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>💬</div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff", lineHeight: 1, marginBottom: "3px" }}>Progress Check-in</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Update weight · review wellbeing · adjust plan</p>
              </div>
            </div>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1 1l5 5-5 5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* ── Munch Score tracker ── */}
        <div style={{ margin: "12px var(--page-x) 0" }}>
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "18px 16px", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Munch Score
                </p>
                <p style={{ fontSize: "11px", color: "var(--ink-4)", marginTop: "2px" }}>Calories · protein · quality · logging</p>
              </div>
              <div style={{ display: "flex", background: "var(--bg)", borderRadius: "var(--r-full)", padding: "2px" }}>
                {([7, 30] as Range[]).map(r => (
                  <button key={r} onClick={() => setRange(r)} style={{
                    padding: "5px 14px", borderRadius: "var(--r-full)",
                    background: range === r ? "var(--surface)" : "transparent",
                    fontSize: "12px", fontWeight: range === r ? 700 : 500,
                    color: range === r ? "var(--forest)" : "var(--ink-4)",
                    cursor: "pointer", transition: "all 0.15s",
                    boxShadow: range === r ? "var(--shadow-xs)" : "none",
                  }}>
                    {r === 7 ? "Week" : "Month"}
                  </button>
                ))}
              </div>
            </div>

            <ScoreChart dates={allDates} scoreMap={scoreMap} />

            {rangeScores.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <ScoreSummary scores={rangeScores} />
              </div>
            )}

            {rangeScores.length === 0 && (
              <p style={{ textAlign: "center", fontSize: "13px", color: "var(--ink-4)", fontStyle: "italic", padding: "16px 0 4px" }}>
                Log meals daily to build your score history
              </p>
            )}
          </div>
        </div>

        {/* ── Current plan summary ── */}
        <div style={{ margin: "12px var(--page-x) 0" }}>
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "18px 16px", boxShadow: "var(--shadow-sm)" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Current plan</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { label: "Calories", value: `${profile.goals.calories.toLocaleString()} kcal`, color: "var(--forest)" },
                { label: "Protein", value: `${profile.goals.protein}g`, color: "var(--green)" },
                { label: "Carbs", value: `${profile.goals.carbohydrates}g`, color: "var(--amber-light)" },
                { label: "Fat", value: `${profile.goals.fat}g`, color: "var(--blue)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: "1 1 calc(50% - 4px)", background: "var(--bg)", borderRadius: "var(--r-sm)", padding: "10px 12px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>{label}</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color }}>{value}</p>
                </div>
              ))}
            </div>
            {profile.aggressiveness && (
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px" }}>{{ conservative: "🐢", moderate: "⚡", aggressive: "🔥" }[profile.aggressiveness]}</span>
                <span style={{ fontSize: "12px", color: "var(--ink-4)", fontWeight: 500 }}>
                  {{ conservative: "Steady pace", moderate: "Balanced pace", aggressive: "Intense pace" }[profile.aggressiveness]}
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ height: "32px" }} />
      </div>

      {/* Weekly report sheet */}
      {showReport && (
        <WeeklyReport
          profile={profile}
          scores={scores}
          calorieHistory={getRange(7).calories}
          entries={entries}
          currentStreak={currentStreak}
          onDismiss={() => setShowReport(false)}
        />
      )}

      {/* Progress checkup sheet */}
      {showCheckup && (
        <ProgressCheckup
          profile={profile}
          currentWeightLbs={latestWeight?.weightLbs ?? null}
          onComplete={handleCheckupComplete}
          onDismiss={() => setShowCheckup(false)}
        />
      )}
    </>
  );
}
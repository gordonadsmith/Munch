import { useMemo } from "react";
import { DayScore, DailyCalorieEntry, FoodEntry, UserProfile, WeeklyReportData } from "../types";
import { getScoreLabel } from "../useStreak";

interface Props {
  profile: UserProfile;
  scores: DayScore[];
  calorieHistory: DailyCalorieEntry[];
  entries: FoodEntry[];       // current week's entries for top foods
  currentStreak: number;
  onDismiss: () => void;
}

function getWeekDates(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    start: mon.toISOString().slice(0, 10),
    end: sun.toISOString().slice(0, 10),
  };
}

function formatDate(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function buildReport(
  scores: DayScore[],
  calorieHistory: DailyCalorieEntry[],
  entries: FoodEntry[],
  currentStreak: number,
): WeeklyReportData {
  const { start, end } = getWeekDates();

  const weekScores = scores.filter(s => s.date >= start && s.date <= end);
  const weekCalories = calorieHistory.filter(c => c.date >= start && c.date <= end);

  const daysLogged = weekScores.filter(s => s.entriesLogged > 0).length;
  const avgCalories = weekCalories.length > 0
    ? Math.round(weekCalories.reduce((s, c) => s + c.calories, 0) / weekCalories.length) : 0;
  const avgProtein = weekScores.length > 0
    ? Math.round(weekScores.reduce((s, d) => s + (d.proteinScore / 25) * (scores[0]?.proteinScore ?? 25), 0) / weekScores.length) : 0;

  const bestDay = weekScores.length > 0
    ? weekScores.reduce((best, s) => s.score > best.score ? s : best)
    : null;
  const hardestDay = weekCalories.filter(c => c.status === "over").length > 0
    ? weekCalories.filter(c => c.status === "over").reduce((w, c) => (c.calories - c.goal) > (w.calories - w.goal) ? c : w)
    : null;

  // Top foods from this week
  const foodCounts: Record<string, number> = {};
  entries.forEach(e => {
    const key = e.nutrition.foodName;
    foodCounts[key] = (foodCounts[key] ?? 0) + 1;
  });
  const topFoods = Object.entries(foodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  const totalScore = weekScores.length > 0
    ? Math.round(weekScores.reduce((s, d) => s + d.score, 0) / weekScores.length) : 0;

  // Generate a contextual summary
  const goal = weekCalories.length > 0 ? weekCalories[0].goal : 2000;
  const onTrack = weekCalories.filter(c => c.status === "on_track").length;
  const under = weekCalories.filter(c => c.status === "under").length;
  const over = weekCalories.filter(c => c.status === "over").length;

  let summary = "";
  if (daysLogged === 0) {
    summary = "No meals logged this week yet. Start tracking to see your weekly progress!";
  } else if (totalScore >= 75) {
    summary = `Excellent week! You logged ${daysLogged} day${daysLogged > 1 ? "s" : ""} and hit your targets ${onTrack + under} out of ${weekCalories.length} days. Keep this momentum going into next week.`;
  } else if (totalScore >= 55) {
    summary = `Solid week overall — ${daysLogged} days logged and ${onTrack} days right on target. ${over > 0 ? `You went over ${over} day${over > 1 ? "s" : ""}, but that's totally normal.` : ""} Focus on consistency next week.`;
  } else {
    summary = `It was a tough week — ${over} day${over !== 1 ? "s" : ""} over goal${daysLogged < 4 ? " and a few missed logs" : ""}. Every week is a fresh start. Try hitting your target on just 3 days this week.`;
  }

  return { weekStart: start, weekEnd: end, daysLogged, avgCalories, avgProtein, avgCarbs: 0, avgFat: 0, bestDay, hardestDay, topFoods, totalScore, streak: currentStreak, summary };
}

function DayBar({ day, calEntry, score }: { day: string; calEntry?: DailyCalorieEntry; score?: DayScore }) {
  const isToday = day === new Date().toISOString().slice(0, 10);
  const status = calEntry?.status ?? "no_data";
  const colors: Record<string, string> = { on_track: "#22c55e", under: "#2563eb", over: "#ef4444", no_data: "var(--border-mid)" };
  const height = calEntry ? Math.max(8, Math.min(60, (calEntry.calories / (calEntry.goal * 1.3)) * 60)) : 4;
  const dayLetter = new Date(day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      {score && score.entriesLogged > 0 && (
        <span style={{ fontSize: "10px", fontWeight: 700, color: getScoreLabel(score.score).color }}>{score.score}</span>
      )}
      <div style={{ width: "100%", height: 64, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ width: "70%", height, background: colors[status], borderRadius: "4px 4px 0 0", transition: "height 0.5s ease", border: isToday ? `2px solid ${colors[status]}` : "none", opacity: status === "no_data" ? 0.3 : 1 }} />
      </div>
      <span style={{ fontSize: "10px", fontWeight: isToday ? 700 : 500, color: isToday ? "var(--forest)" : "var(--ink-4)" }}>{dayLetter}</span>
    </div>
  );
}

export default function WeeklyReport({ profile, scores, calorieHistory, entries, currentStreak, onDismiss }: Props) {
  const report = useMemo(() => buildReport(scores, calorieHistory, entries, currentStreak), [scores, calorieHistory, entries, currentStreak]);
  const { label, color, emoji } = getScoreLabel(report.totalScore);
  const { start, end } = getWeekDates();

  // Build day-by-day data
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start + "T12:00:00");
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const scoreMap = new Map(scores.map(s => [s.date, s]));
  const calMap = new Map(calorieHistory.map(c => [c.date, c]));

  return (
    <>
      <div onClick={onDismiss} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, animation: "fadeIn 0.2s ease" }} />
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: "430px",
        background: "var(--surface)",
        borderRadius: "var(--r-xl) var(--r-xl) 0 0",
        boxShadow: "var(--shadow-xl)",
        zIndex: 201, maxHeight: "88vh",
        display: "flex", flexDirection: "column",
        animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0", flexShrink: 0 }}>
          <div style={{ width: 34, height: 4, borderRadius: "var(--r-full)", background: "var(--border-strong)" }} />
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Hero */}
          <div style={{ background: "linear-gradient(135deg, var(--forest) 0%, var(--forest-mid) 100%)", padding: "20px 20px 24px" }}>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
              Weekly Report · {formatDate(start)} – {formatDate(end)}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "28px" }}>{emoji}</span>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{label}</p>
                </div>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{report.daysLogged} of 7 days logged</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "44px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{report.totalScore}</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>avg score</p>
              </div>
            </div>
          </div>

          <div style={{ padding: "16px var(--page-x)", display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Day bars */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "16px", boxShadow: "var(--shadow-sm)" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Daily calories</p>
              <div style={{ display: "flex", gap: "4px", alignItems: "flex-end" }}>
                {days.map(day => (
                  <DayBar key={day} day={day} calEntry={calMap.get(day)} score={scoreMap.get(day)} />
                ))}
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "10px", flexWrap: "wrap" }}>
                {[{ label: "On track", color: "#22c55e" }, { label: "Under", color: "#2563eb" }, { label: "Over", color: "#ef4444" }].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "2px", background: l.color }} />
                    <span style={{ fontSize: "11px", color: "var(--ink-4)" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {[
                { label: "Avg calories", value: report.avgCalories > 0 ? `${report.avgCalories.toLocaleString()}` : "—", unit: "kcal", color: "var(--forest)" },
                { label: "🔥 Streak", value: `${report.streak}`, unit: "days", color: report.streak > 0 ? "#c2410c" : "var(--ink-4)" },
                { label: "Goal", value: profile.goals.calories.toLocaleString(), unit: "kcal", color: "var(--ink-3)" },
              ].map(({ label, value, unit, color }) => (
                <div key={label} style={{ background: "var(--surface)", borderRadius: "var(--r)", padding: "12px 10px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color, lineHeight: 1, marginBottom: "3px" }}>{value}</p>
                  <p style={{ fontSize: "9px", fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{unit}</p>
                  <p style={{ fontSize: "10px", color: "var(--ink-4)", marginTop: "2px" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={{ background: "var(--forest-xpale)", borderRadius: "var(--r-lg)", padding: "14px 16px", borderLeft: "3px solid var(--forest)" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--forest)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>🥗 Munch says</p>
              <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.6 }}>{report.summary}</p>
            </div>

            {/* Best/hardest day */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "#f0fdf4", borderRadius: "var(--r-lg)", padding: "14px", boxShadow: "var(--shadow-sm)" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>🏆 Best day</p>
                {report.bestDay ? (
                  <>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: "#16a34a", lineHeight: 1 }}>{report.bestDay.score}</p>
                    <p style={{ fontSize: "11px", color: "var(--ink-4)", marginTop: "3px" }}>{formatDate(report.bestDay.date)}</p>
                  </>
                ) : <p style={{ fontSize: "12px", color: "var(--ink-4)", fontStyle: "italic" }}>No data yet</p>}
              </div>
              <div style={{ background: report.hardestDay ? "#fef2f2" : "var(--bg)", borderRadius: "var(--r-lg)", padding: "14px", boxShadow: "var(--shadow-sm)" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, color: report.hardestDay ? "var(--red)" : "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>💪 Hardest day</p>
                {report.hardestDay ? (
                  <>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: "var(--red)", lineHeight: 1 }}>
                      +{report.hardestDay.calories - report.hardestDay.goal}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--ink-4)", marginTop: "3px" }}>{formatDate(report.hardestDay.date)}</p>
                  </>
                ) : <p style={{ fontSize: "12px", color: "var(--ink-4)", fontStyle: "italic" }}>No over-goal days 🎉</p>}
              </div>
            </div>

            {/* Top foods */}
            {report.topFoods.length > 0 && (
              <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "16px", boxShadow: "var(--shadow-sm)" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Most logged foods</p>
                {report.topFoods.map((f, i) => (
                  <div key={f.name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                    <span style={{ fontSize: "18px", flexShrink: 0 }}>{["🥇", "🥈", "🥉"][i]}</span>
                    <p style={{ fontSize: "14px", color: "var(--ink-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                    <span style={{ fontSize: "12px", color: "var(--ink-4)", flexShrink: 0 }}>{f.count}×</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ height: "8px" }} />
          </div>
        </div>

        <div style={{ padding: "12px var(--page-x) 16px", borderTop: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
          <button onClick={onDismiss} style={{ width: "100%", padding: "14px", background: "var(--forest)", border: "none", borderRadius: "var(--r)", fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>
            Let's keep it going 💪
          </button>
        </div>
      </div>
    </>
  );
}

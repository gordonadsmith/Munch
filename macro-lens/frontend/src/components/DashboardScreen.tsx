import { useState } from "react";
import { FoodEntry, DailyTotals, MealTime, HealthRating, UserProfile, DayScore, StreakData } from "../types";
import ScoreCard from "./ScoreCard";
import WaterTracker from "./WaterTracker";
import FoodDetail from "./FoodDetail";

interface Props {
  profile: UserProfile;
  totals: DailyTotals;
  entries: FoodEntry[];
  onRemove: (id: string) => void;
  todayScore: DayScore | null;
  streakData: StreakData;
}

const MEAL_ORDER: MealTime[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABEL: Record<MealTime, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
const MEAL_EMOJI: Record<MealTime, string> = { breakfast: "☀️", lunch: "🥗", dinner: "🍽️", snack: "🍎" };
const HEALTH_DOT: Record<HealthRating, string> = { great: "#22c55e", neutral: "#f59e0b", bad: "#ef4444" };
const HEALTH_LABEL: Record<HealthRating, string> = { great: "Great", neutral: "Neutral", bad: "Bad" };
const HEALTH_BG: Record<HealthRating, string> = { great: "#f0fdf4", neutral: "#fffbeb", bad: "#fef2f2" };

// ── Ring ───────────────────────────────────────────────────────────────────────
function Ring({ consumed, goal }: { consumed: number; goal: number }) {
  const size = 148;
  const sw = 9;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / goal, 1);
  const over = consumed > goal;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-mid)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={over ? "var(--red)" : "var(--forest)"}
          strokeWidth={sw}
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 600, color: over ? "var(--red)" : "var(--ink)", lineHeight: 1 }}>
          {consumed.toLocaleString()}
        </p>
        <p style={{ fontSize: "10px", color: "var(--ink-4)", marginTop: "2px", fontWeight: 500 }}>kcal</p>
        <div style={{ marginTop: "6px", background: over ? "var(--red-pale)" : "var(--forest-xpale)", borderRadius: "var(--r-full)", padding: "2px 9px", border: `1px solid ${over ? "rgba(229,62,62,0.15)" : "rgba(26,71,49,0.1)"}` }}>
          <p style={{ fontSize: "10px", fontWeight: 600, color: over ? "var(--red)" : "var(--forest)" }}>
            {over ? `${Math.abs(goal - consumed)} over` : `${goal - consumed} left`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Macro bar ─────────────────────────────────────────────────────────────────
function MacroBar({ label, value, goal, color, isMax = false }: { label: string; value: number; goal: number; color: string; isMax?: boolean }) {
  const p = Math.min((value / goal) * 100, 100);
  const over = value > goal;
  const barColor = over && isMax ? "var(--red)" : color;

  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "7px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink-2)" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: barColor, fontFamily: "var(--font-display)" }}>{Math.round(value)}</span>
          <span style={{ fontSize: "12px", color: "var(--ink-4)" }}>/{goal}g</span>
        </div>
      </div>
      <div style={{ height: 5, background: "var(--border-mid)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${p}%`,
          background: barColor,
          borderRadius: "var(--r-full)",
          transition: "width 0.7s cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </div>
    </div>
  );
}

// ── Calorie split ─────────────────────────────────────────────────────────────
function CalorieSplit({ totals }: { totals: DailyTotals }) {
  const pc = totals.protein * 4;
  const cc = totals.carbohydrates * 4;
  const fc = totals.fat * 9;
  const total = pc + cc + fc;
  if (total === 0) return null;

  const segs = [
    { label: "Protein", cals: pc, color: "var(--green)" },
    { label: "Carbs", cals: cc, color: "var(--amber-light)" },
    { label: "Fat", cals: fc, color: "var(--blue)" },
  ];

  return (
    <div style={{ padding: "18px var(--page-x)", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
        Calorie split
      </p>
      <div style={{ display: "flex", height: 6, borderRadius: "var(--r-full)", overflow: "hidden", gap: "2px", marginBottom: "12px" }}>
        {segs.map(s => (
          <div key={s.label} style={{ width: `${(s.cals / total) * 100}%`, background: s.color, transition: "width 0.6s ease" }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        {segs.map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
            <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>{s.label}</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-2)" }}>{Math.round((s.cals / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Meal row ──────────────────────────────────────────────────────────────────
function EntryRow({ entry, onTap }: { entry: FoodEntry; onTap: () => void }) {
  const n = entry.nutrition;
  return (
    <button
      onClick={onTap}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "12px",
        padding: "12px 16px", background: "transparent", textAlign: "left",
        cursor: "pointer", transition: "background 0.1s", borderRadius: "var(--r)",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {entry.imagePreview ? (
        <img src={entry.imagePreview} alt="" style={{ width: 42, height: 42, borderRadius: "var(--r-sm)", objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 42, height: 42, borderRadius: "var(--r-sm)", background: "var(--forest-xpale)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
          {entry.inputMode === "recipe" ? "📋" : "✍️"}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: HEALTH_DOT[n.healthRating], flexShrink: 0 }} />
          <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {n.foodName}
          </p>
        </div>
        <p style={{ fontSize: "11px", color: "var(--ink-4)", paddingLeft: "11px" }}>
          {n.protein}g P · {n.carbohydrates}g C · {n.fat}g F
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink)", lineHeight: 1, fontFamily: "var(--font-display)" }}>{n.calories}</p>
          <p style={{ fontSize: "10px", color: "var(--ink-4)", fontWeight: 500 }}>kcal</p>
        </div>
        <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
          <path d="M1 1l4 4-4 4" stroke="var(--ink-5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}

// ── DashboardScreen ───────────────────────────────────────────────────────────
export default function DashboardScreen({ totals, entries, onRemove, profile, todayScore, streakData }: Props) {
  const [detail, setDetail] = useState<FoodEntry | null>(null);
  const goals = profile.goals;
  const sugarTotal = entries.reduce((s, e) => s + e.nutrition.sugar, 0);
  const grouped = MEAL_ORDER.reduce<Record<MealTime, FoodEntry[]>>((acc, m) => {
    acc[m] = entries.filter(e => e.mealTime === m);
    return acc;
  }, { breakfast: [], lunch: [], dinner: [], snack: [] });

  // Health quality score
  const counts = entries.reduce((acc, e) => {
    acc[e.nutrition.healthRating]++;
    return acc;
  }, { great: 0, neutral: 0, bad: 0 } as Record<HealthRating, number>);

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>

        {/* ── Calorie hero ── */}
        <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "20px var(--page-x) 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <Ring consumed={totals.calories} goal={goals.calories} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <p style={{ fontSize: "11px", color: "var(--ink-4)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>Daily goal</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-2)" }}>{goals.calories.toLocaleString()} kcal</p>
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "var(--ink-4)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>Meals today</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-2)" }}>{entries.length}</p>
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "var(--ink-4)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>Avg per meal</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-2)" }}>
                  {entries.length > 0 ? Math.round(totals.calories / entries.length) : "—"} kcal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Calorie split ── */}
        {entries.length > 0 && <CalorieSplit totals={totals} />}

        {/* ── Macros ── */}
        <div style={{ margin: "12px var(--page-x) 0", background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "18px 16px 4px", boxShadow: "var(--shadow-sm)" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "18px" }}>
            Macronutrients
          </p>
          <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color="var(--green)" />
          <MacroBar label="Carbohydrates" value={totals.carbohydrates} goal={goals.carbohydrates} color="var(--amber-light)" />
          <MacroBar label="Fat" value={totals.fat} goal={goals.fat} color="var(--blue)" />
          <MacroBar label="Fiber" value={totals.fiber} goal={goals.fiber} color="var(--purple)" />
          <MacroBar label="Sugar" value={sugarTotal} goal={goals.sugar} color="var(--red)" isMax />
        </div>

        {/* ── Score / Streak ── */}
        <div style={{ margin: "12px var(--page-x) 0" }}>
          <ScoreCard todayScore={todayScore} streakData={streakData} />
        </div>


        {/* ── Water ── */}
        <div style={{ margin: "12px var(--page-x) 0" }}>
          <WaterTracker />
        </div>

        {/* ── Quality ── */}
        {entries.length > 0 && (
          <div style={{ margin: "12px var(--page-x) 0", background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "16px", boxShadow: "var(--shadow-sm)" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
              Nutrition quality
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["great", "neutral", "bad"] as HealthRating[]).map(r => (
                <div key={r} style={{ flex: 1, background: HEALTH_BG[r], borderRadius: "var(--r)", padding: "10px 8px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: HEALTH_DOT[r], lineHeight: 1, marginBottom: "3px" }}>{counts[r]}</p>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: HEALTH_DOT[r] }}>{HEALTH_LABEL[r]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Meals ── */}
        <div style={{ margin: "20px var(--page-x) 0" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
            Today's meals
          </p>

          {entries.length === 0 ? (
            <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "36px 24px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
              <p style={{ fontSize: "32px", marginBottom: "10px" }}>🌿</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontStyle: "italic", color: "var(--ink-4)" }}>Nothing logged yet</p>
              <p style={{ fontSize: "13px", color: "var(--ink-4)", marginTop: "6px" }}>Head to Munch to log your first meal</p>
            </div>
          ) : (
            <>
              {MEAL_ORDER.filter(m => grouped[m].length > 0).map(mealTime => (
                <div key={mealTime} style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px", paddingLeft: "2px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "14px" }}>{MEAL_EMOJI[mealTime]}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{MEAL_LABEL[mealTime]}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--ink-4)" }}>
                      {grouped[mealTime].reduce((s, e) => s + e.nutrition.calories, 0)} kcal
                    </span>
                  </div>
                  <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                    {grouped[mealTime].map((entry, i) => (
                      <div key={entry.id} style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                        <EntryRow entry={entry} onTap={() => setDetail(entry)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ height: "32px" }} />
      </div>

      {detail && (
        <FoodDetail
          entry={detail}
          onClose={() => setDetail(null)}
          onRemove={() => { onRemove(detail.id); setDetail(null); }}
        />
      )}
    </>
  );
}

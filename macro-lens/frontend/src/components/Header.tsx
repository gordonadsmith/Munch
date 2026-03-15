import { DailyTotals } from "../types";

const CALORIE_GOAL = 2000;

interface Props { totals: DailyTotals; }

export default function Header({ totals }: Props) {
  const pct = Math.min(totals.calories / CALORIE_GOAL, 1);
  const remaining = CALORIE_GOAL - totals.calories;
  const over = totals.calories > CALORIE_GOAL;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <header style={{
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      padding: "16px 20px 0",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "22px",
            fontWeight: 600,
            color: "var(--forest)",
            letterSpacing: "-0.01em",
            lineHeight: 1,
            marginBottom: "3px",
          }}>
            Munch
          </h1>
          <p style={{ fontSize: "12px", color: "var(--ink-3)", fontWeight: 400 }}>{today}</p>
        </div>

        {/* Calorie summary */}
        <div style={{ textAlign: "right" }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: "26px",
            fontWeight: 600,
            color: over ? "var(--red)" : "var(--ink)",
            lineHeight: 1,
          }}>
            {totals.calories.toLocaleString()}
          </p>
          <p style={{ fontSize: "11px", color: "var(--ink-4)", marginTop: "1px" }}>
            {over ? `${Math.abs(remaining)} over goal` : `${remaining} remaining`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "var(--border)", borderRadius: "99px", overflow: "hidden", marginBottom: "16px" }}>
        <div style={{
          height: "100%",
          width: `${pct * 100}%`,
          background: over ? "var(--red)" : "var(--forest)",
          borderRadius: "99px",
          transition: "width 0.5s ease",
        }} />
      </div>

      {/* Macro row */}
      <div style={{ display: "flex", marginBottom: "0" }}>
        {[
          { label: "Protein", value: totals.protein, color: "var(--forest)" },
          { label: "Carbs", value: totals.carbohydrates, color: "var(--amber)" },
          { label: "Fat", value: totals.fat, color: "var(--blue)" },
          { label: "Fiber", value: totals.fiber, color: "var(--purple)" },
        ].map(({ label, value, color }, i, arr) => (
          <div key={label} style={{
            flex: 1,
            textAlign: "center",
            padding: "10px 0",
            borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color, lineHeight: 1, marginBottom: "2px" }}>
              {Math.round(value)}
            </p>
            <p style={{ fontSize: "10px", color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {label}
            </p>
          </div>
        ))}
      </div>
    </header>
  );
}
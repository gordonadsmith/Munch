import { useWater } from "../useWater";

const QUICK_AMOUNTS = [
  { label: "Cup", ml: 240, emoji: "☕" },
  { label: "Bottle", ml: 500, emoji: "🍶" },
  { label: "Large", ml: 750, emoji: "💧" },
];

export default function WaterTracker() {
  const { todayLog, addWater, addCup, removeCup, pct, cupsConsumed, cupsGoal, isOnTrack, CUP_ML } = useWater();
  const mlLeft = Math.max(0, todayLog.goalMl - todayLog.amountMl);
  const ozConsumed = Math.round(todayLog.amountMl / 29.574);
  const ozGoal = Math.round(todayLog.goalMl / 29.574);

  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "18px 16px", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Hydration
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontSize: "14px" }}>{isOnTrack ? "💧" : "🏜️"}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: isOnTrack ? "var(--blue)" : "var(--amber)" }}>
            {isOnTrack ? "On track" : "Drink more"}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, color: "var(--blue)", lineHeight: 1 }}>
              {ozConsumed}
            </span>
            <span style={{ fontSize: "12px", color: "var(--ink-4)" }}>/ {ozGoal} oz</span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--ink-4)" }}>
            {mlLeft > 0 ? `${Math.round(mlLeft / 29.574)} oz left` : "Goal reached! 🎉"}
          </span>
        </div>
        <div style={{ height: 6, background: "var(--border-mid)", borderRadius: "var(--r-full)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${pct * 100}%`,
            background: pct >= 1 ? "#16a34a" : "var(--blue)",
            borderRadius: "var(--r-full)",
            transition: "width 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }} />
        </div>
      </div>

      {/* Cup dots */}
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "12px" }}>
        {Array.from({ length: cupsGoal }).map((_, i) => (
          <div key={i} style={{
            width: 24, height: 24,
            borderRadius: "6px",
            background: i < cupsConsumed ? "var(--blue)" : "var(--border-mid)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px",
            transition: "background 0.2s",
          }}>
            {i < cupsConsumed ? "💧" : ""}
          </div>
        ))}
      </div>

      {/* Quick add buttons */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
        {QUICK_AMOUNTS.map(({ label, ml, emoji }) => (
          <button
            key={label}
            onClick={() => addWater(ml)}
            style={{
              flex: 1, padding: "8px 4px",
              background: "var(--blue-pale)", border: "1.5px solid rgba(37,99,235,0.15)",
              borderRadius: "var(--r)", cursor: "pointer", transition: "all 0.15s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#dbeafe"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--blue-pale)"; }}
          >
            <span style={{ fontSize: "16px" }}>{emoji}</span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--blue)" }}>+{Math.round(ml / 29.574)}oz</span>
          </button>
        ))}

        <button
          onClick={removeCup}
          style={{
            width: 36, padding: "8px",
            background: "var(--bg)", border: "1.5px solid var(--border-mid)",
            borderRadius: "var(--r)", cursor: "pointer", transition: "all 0.15s",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px", color: "var(--ink-4)", flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--red)"; (e.currentTarget as HTMLElement).style.color = "var(--red)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)"; (e.currentTarget as HTMLElement).style.color = "var(--ink-4)"; }}
        >
          −
        </button>
      </div>
    </div>
  );
}

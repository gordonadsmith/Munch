import { FoodEntry, HealthRating } from "../types";

interface Props {
  entry: FoodEntry;
  onClose: () => void;
  onRemove: () => void;
}

const HEALTH_CONFIG: Record<HealthRating, { label: string; color: string; bg: string; border: string }> = {
  great:   { label: "Great",   color: "#15803d", bg: "#f0fdf4", border: "#22c55e" },
  neutral: { label: "Neutral", color: "#92400e", bg: "#fffbeb", border: "#f59e0b" },
  bad:     { label: "Bad",     color: "#991b1b", bg: "#fef2f2", border: "#ef4444" },
};

const MEAL_LABEL: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

export default function FoodDetail({ entry, onClose, onRemove }: Props) {
  const n = entry.nutrition;
  const h = HEALTH_CONFIG[n.healthRating] || HEALTH_CONFIG.neutral;
  const time = new Date(entry.addedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const totalMacroCals = n.protein * 4 + n.carbohydrates * 4 + n.fat * 9;
  const positives = (n.highlights || []).filter(h => h.type === "positive");
  const negatives = (n.highlights || []).filter(h => h.type === "negative");

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, animation: "fadeIn 0.2s ease" }} />
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: "430px",
        background: "var(--surface)",
        borderRadius: "var(--r-xl) var(--r-xl) 0 0",
        boxShadow: "var(--shadow-xl)",
        zIndex: 101,
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0", flexShrink: 0 }}>
          <div style={{ width: 34, height: 4, borderRadius: "var(--r-full)", background: "var(--border-strong)" }} />
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Hero */}
          {entry.imagePreview ? (
            <div style={{ height: 180, overflow: "hidden", position: "relative", margin: "12px 16px 0", borderRadius: "var(--r-lg)" }}>
              <img src={entry.imagePreview} alt={n.foodName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)", borderRadius: "var(--r-lg)" }} />
              <div style={{ position: "absolute", bottom: 12, left: 14, display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ background: h.border, borderRadius: "var(--r-full)", padding: "3px 10px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff" }}>{h.label}</span>
                </div>
              </div>
            </div>
          ) : <div style={{ height: "8px" }} />}

          <div style={{ padding: "16px var(--page-x) 0" }}>
            {/* Title */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "4px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.2, flex: 1 }}>
                {n.foodName}
              </h2>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--forest)", lineHeight: 1 }}>{n.calories}</p>
                <p style={{ fontSize: "11px", color: "var(--ink-4)" }}>kcal</p>
              </div>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ink-4)", marginBottom: "16px" }}>
              {n.servingSize} · {MEAL_LABEL[entry.mealTime]} · {time}
            </p>

            {/* Rating badge (when no image) */}
            {!entry.imagePreview && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: h.bg, borderRadius: "var(--r-full)", padding: "4px 12px", marginBottom: "16px", border: `1px solid ${h.border}22` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: h.border }} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: h.color }}>{h.label}</span>
              </div>
            )}

            {/* Macro grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px", marginBottom: "16px" }}>
              {[
                { label: "Protein", value: n.protein, color: "var(--green)" },
                { label: "Carbs", value: n.carbohydrates, color: "var(--amber-light)" },
                { label: "Fat", value: n.fat, color: "var(--blue)" },
                { label: "Fiber", value: n.fiber, color: "var(--purple)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "var(--bg)", borderRadius: "var(--r-sm)", padding: "10px 6px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 700, color, lineHeight: 1, marginBottom: "3px" }}>
                    {Math.round(value)}<span style={{ fontSize: "10px", fontWeight: 400, color: "var(--ink-4)" }}>g</span>
                  </p>
                  <p style={{ fontSize: "10px", color: "var(--ink-4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Calorie split bar */}
            {totalMacroCals > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", height: 5, borderRadius: "var(--r-full)", overflow: "hidden", gap: "2px", marginBottom: "8px" }}>
                  {[
                    { pct: (n.protein * 4) / totalMacroCals, color: "var(--green)" },
                    { pct: (n.carbohydrates * 4) / totalMacroCals, color: "var(--amber-light)" },
                    { pct: (n.fat * 9) / totalMacroCals, color: "var(--blue)" },
                  ].map(({ pct, color }, i) => (
                    <div key={i} style={{ width: `${pct * 100}%`, background: color }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: "14px" }}>
                  {[
                    { label: "P", pct: (n.protein * 4) / totalMacroCals, color: "var(--green)" },
                    { label: "C", pct: (n.carbohydrates * 4) / totalMacroCals, color: "var(--amber-light)" },
                    { label: "F", pct: (n.fat * 9) / totalMacroCals, color: "var(--blue)" },
                  ].map(({ label, pct, color }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                      <span style={{ fontSize: "11px", color: "var(--ink-4)" }}>{label} {Math.round(pct * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Health summary */}
            {n.healthSummary && (
              <div style={{ background: h.bg, borderRadius: "var(--r)", padding: "12px 14px", marginBottom: "16px", borderLeft: `3px solid ${h.border}` }}>
                <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.55 }}>{n.healthSummary}</p>
              </div>
            )}

            {/* Highlights */}
            {(positives.length > 0 || negatives.length > 0) && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Breakdown</p>
                {positives.length > 0 && (
                  <div style={{ marginBottom: "10px" }}>
                    {positives.map((hl, i) => (
                      <div key={i} style={{ display: "flex", gap: "10px", padding: "8px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--green-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px" }}>✓</div>
                        <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>{hl.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                {negatives.length > 0 && (
                  <div>
                    {negatives.map((hl, i) => (
                      <div key={i} style={{ display: "flex", gap: "10px", padding: "8px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--red-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px" }}>!</div>
                        <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>{hl.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ingredients */}
            {n.ingredients && n.ingredients.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Ingredients</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {n.ingredients.map(ing => (
                    <span key={ing} style={{ background: "var(--bg)", border: "1px solid var(--border-mid)", borderRadius: "var(--r-full)", padding: "4px 11px", fontSize: "12px", color: "var(--ink-3)" }}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {n.notes && (
              <p style={{ fontSize: "12px", color: "var(--ink-4)", lineHeight: 1.6, fontStyle: "italic", marginBottom: "16px" }}>
                {n.confidence === "high" ? "✓" : n.confidence === "medium" ? "~" : "⚠"} {n.notes}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px var(--page-x) 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", flexShrink: 0, background: "var(--surface)" }}>
          <button onClick={() => { onRemove(); onClose(); }} style={{
            flex: 1, padding: "13px",
            border: "1.5px solid var(--border-mid)", borderRadius: "var(--r)",
            fontSize: "13px", fontWeight: 600, color: "var(--red)",
            background: "transparent", cursor: "pointer", transition: "background 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--red-pale)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            Remove
          </button>
          <button onClick={onClose} style={{
            flex: 2, padding: "13px",
            background: "var(--forest)", border: "none", borderRadius: "var(--r)",
            fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer",
          }}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}

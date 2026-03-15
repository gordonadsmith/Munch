import { useState } from "react";
import { NutritionData, MealTime, HealthRating } from "../types";

interface Props {
  nutrition: NutritionData;
  imagePreview?: string;
  onAdd: (mealTime: MealTime) => void;
  onDismiss: () => void;
}

const MEALS: { id: MealTime; label: string; emoji: string }[] = [
  { id: "breakfast", label: "Breakfast", emoji: "☀️" },
  { id: "lunch",     label: "Lunch",     emoji: "🥗" },
  { id: "dinner",    label: "Dinner",    emoji: "🍽️" },
  { id: "snack",     label: "Snack",     emoji: "🍎" },
];

const RATING: Record<HealthRating, { color: string; bg: string; dot: string }> = {
  great:   { color: "#15803d", bg: "#f0fdf4", dot: "#22c55e" },
  neutral: { color: "#92400e", bg: "#fffbeb", dot: "#f59e0b" },
  bad:     { color: "#991b1b", bg: "#fef2f2", dot: "#ef4444" },
};

function defaultMeal(): MealTime {
  const h = new Date().getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 20) return "dinner";
  return "snack";
}

export default function FoodLogCard({ nutrition, imagePreview, onAdd, onDismiss }: Props) {
  const [meal, setMeal] = useState<MealTime>(defaultMeal());
  const r = RATING[nutrition.healthRating] || RATING.neutral;

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "var(--r-lg)",
      overflow: "hidden",
      boxShadow: "var(--shadow-md)",
      border: "1px solid var(--border)",
      animation: "popIn 0.25s ease",
    }}>
      {/* Image strip */}
      {imagePreview && (
        <div style={{ height: 120, overflow: "hidden", position: "relative" }}>
          <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
        </div>
      )}

      <div style={{ padding: "14px 14px 0" }}>
        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.2, marginBottom: "2px" }}>
              {nutrition.foodName}
            </p>
            <p style={{ fontSize: "11px", color: "var(--ink-4)" }}>{nutrition.servingSize}</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: "var(--forest)", lineHeight: 1 }}>{nutrition.calories}</p>
            <p style={{ fontSize: "10px", color: "var(--ink-4)" }}>kcal</p>
          </div>
        </div>

        {/* Macro row */}
        <div style={{ display: "flex", gap: "0", background: "var(--bg)", borderRadius: "var(--r-sm)", overflow: "hidden", marginBottom: "12px" }}>
          {[
            { l: "P", v: nutrition.protein, c: "var(--green)" },
            { l: "C", v: nutrition.carbohydrates, c: "var(--amber-light)" },
            { l: "F", v: nutrition.fat, c: "var(--blue)" },
          ].map(({ l, v, c }, i) => (
            <div key={l} style={{ flex: 1, padding: "8px 6px", textAlign: "center", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: c, lineHeight: 1, marginBottom: "2px" }}>{Math.round(v)}</p>
              <p style={{ fontSize: "9px", fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</p>
            </div>
          ))}
          <div style={{ flex: 1, padding: "8px 6px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: r.dot }} />
            </div>
            <p style={{ fontSize: "9px", fontWeight: 600, color: r.color, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>
              {nutrition.healthRating}
            </p>
          </div>
        </div>

        {/* Meal picker */}
        <div style={{ marginBottom: "12px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "7px" }}>
            Add to
          </p>
          <div style={{ display: "flex", gap: "5px" }}>
            {MEALS.map(m => (
              <button key={m.id} onClick={() => setMeal(m.id)} style={{
                flex: 1, padding: "7px 2px",
                borderRadius: "var(--r-sm)",
                border: `1.5px solid ${meal === m.id ? "var(--forest)" : "var(--border)"}`,
                background: meal === m.id ? "var(--forest-xpale)" : "transparent",
                fontSize: "10px", fontWeight: meal === m.id ? 700 : 400,
                color: meal === m.id ? "var(--forest)" : "var(--ink-3)",
                transition: "all 0.15s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                cursor: "pointer",
              }}>
                <span style={{ fontSize: "14px" }}>{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "0", borderTop: "1px solid var(--border)" }}>
        <button onClick={onDismiss} style={{
          flex: 1, padding: "13px",
          fontSize: "13px", fontWeight: 500, color: "var(--ink-4)",
          background: "transparent", cursor: "pointer",
          borderRight: "1px solid var(--border)",
          transition: "background 0.1s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          Dismiss
        </button>
        <button onClick={() => onAdd(meal)} style={{
          flex: 2, padding: "13px",
          fontSize: "13px", fontWeight: 700, color: "var(--forest)",
          background: "transparent", cursor: "pointer",
          transition: "background 0.1s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--forest-xpale)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          Log to {MEALS.find(m => m.id === meal)?.label} →
        </button>
      </div>
    </div>
  );
}

import { MealSuggestion, MealTime } from "../types";

interface Props {
  suggestions: MealSuggestion[];
  onSelect: (suggestion: MealSuggestion) => void;
}

const MEAL_EMOJIS: Record<string, string> = {
  breakfast: "☀️", lunch: "🥗", dinner: "🍽️", snack: "🍎",
};

function getMealTime(): MealTime {
  const h = new Date().getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 20) return "dinner";
  return "snack";
}

export default function MealSuggestCard({ suggestions, onSelect }: Props) {
  const mealTime = getMealTime();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", animation: "fadeUp 0.3s ease" }}>
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s)}
          style={{
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: "14px 14px",
            display: "flex", gap: "12px", alignItems: "flex-start",
            textAlign: "left", cursor: "pointer", transition: "all 0.15s",
            boxShadow: "var(--shadow-xs)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; (e.currentTarget as HTMLElement).style.background = "var(--forest-xpale)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--surface)"; }}
        >
          <div style={{ width: 40, height: 40, borderRadius: "var(--r-sm)", background: "var(--forest-pale)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
            {MEAL_EMOJIS[mealTime] ?? "🍽️"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.2, marginBottom: "3px" }}>{s.name}</p>
            <p style={{ fontSize: "12px", color: "var(--ink-3)", lineHeight: 1.4, marginBottom: "7px" }}>{s.description}</p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[
                { l: "P", v: s.protein, c: "var(--green)" },
                { l: "C", v: s.carbohydrates, c: "var(--amber-light)" },
                { l: "F", v: s.fat, c: "var(--blue)" },
              ].map(({ l, v, c }) => (
                <span key={l} style={{ fontSize: "11px", color: "var(--ink-4)" }}>
                  <span style={{ fontWeight: 700, color: c }}>{v}g</span> {l}
                </span>
              ))}
              <div style={{ marginLeft: "auto", background: "var(--forest-xpale)", borderRadius: "var(--r-full)", padding: "2px 8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--forest)" }}>{s.calories} kcal</span>
              </div>
            </div>
            {s.why && (
              <p style={{ fontSize: "11px", color: "var(--forest)", fontWeight: 500, marginTop: "5px", fontStyle: "italic" }}>✓ {s.why}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

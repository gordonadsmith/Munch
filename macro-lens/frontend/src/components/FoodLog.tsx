import { useState } from "react";
import { FoodEntry, MealTime, HealthRating } from "../types";
import FoodDetail from "./FoodDetail";

interface Props {
  entries: FoodEntry[];
  onRemove: (id: string) => void;
}

const MEAL_ORDER: MealTime[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABEL: Record<MealTime, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
const MEAL_EMOJI: Record<MealTime, string> = { breakfast: "☀️", lunch: "🥗", dinner: "🍽️", snack: "🍎" };

const HEALTH_DOT: Record<HealthRating, string> = {
  great:   "#22c55e",
  neutral: "#f59e0b",
  bad:     "#ef4444",
};

function EntryRow({ entry, onTap }: { entry: FoodEntry; onTap: () => void }) {
  const n = entry.nutrition;
  const dotColor = HEALTH_DOT[n.healthRating] || HEALTH_DOT.neutral;

  return (
    <button
      onClick={onTap}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "11px 16px",
        background: "var(--surface)",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        transition: "background 0.1s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface)"; }}
    >
      {/* Thumbnail or mode icon */}
      {entry.imagePreview ? (
        <img src={entry.imagePreview} alt="" style={{ width: 40, height: 40, borderRadius: "var(--r-sm)", objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: "var(--r-sm)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "18px" }}>
          {entry.inputMode === "recipe" ? "📋" : "✍️"}
        </div>
      )}

      {/* Name + macros */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
          {/* Health dot */}
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
          <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--ink)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {n.foodName}
          </p>
        </div>
        <p style={{ fontSize: "12px", color: "var(--ink-4)", paddingLeft: "13px" }}>
          {n.protein}g P · {n.carbohydrates}g C · {n.fat}g F
        </p>
      </div>

      {/* Calories + chevron */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", lineHeight: 1 }}>{n.calories}</p>
          <p style={{ fontSize: "11px", color: "var(--ink-4)" }}>kcal</p>
        </div>
        <span style={{ fontSize: "14px", color: "var(--ink-4)" }}>›</span>
      </div>
    </button>
  );
}

export default function FoodLog({ entries, onRemove }: Props) {
  const [selected, setSelected] = useState<FoodEntry | null>(null);

  if (entries.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontStyle: "italic", color: "var(--ink-4)", marginBottom: "6px", fontWeight: 400 }}>
          Nothing logged yet
        </p>
        <p style={{ fontSize: "13px", color: "var(--ink-4)", lineHeight: 1.6 }}>Add your first meal below</p>
      </div>
    );
  }

  const grouped = MEAL_ORDER.reduce<Record<MealTime, FoodEntry[]>>((acc, m) => {
    acc[m] = entries.filter(e => e.mealTime === m);
    return acc;
  }, { breakfast: [], lunch: [], dinner: [], snack: [] });

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {MEAL_ORDER.filter(m => grouped[m].length > 0).map(mealTime => {
          const group = grouped[mealTime];
          const groupCals = group.reduce((s, e) => s + e.nutrition.calories, 0);
          return (
            <div key={mealTime} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "13px" }}>{MEAL_EMOJI[mealTime]}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-2)" }}>{MEAL_LABEL[mealTime]}</span>
                </div>
                <span style={{ fontSize: "12px", color: "var(--ink-4)" }}>{groupCals} kcal</span>
              </div>
              <div style={{ background: "var(--surface)", borderRadius: "var(--r)", boxShadow: "var(--shadow-sm)", margin: "0 12px", overflow: "hidden" }}>
                {group.map((entry, i) => (
                  <div key={entry.id} style={{ borderBottom: i < group.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <EntryRow entry={entry} onTap={() => setSelected(entry)} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{ height: "12px" }} />
      </div>

      {/* Detail sheet */}
      {selected && (
        <FoodDetail
          entry={selected}
          onClose={() => setSelected(null)}
          onRemove={() => { onRemove(selected.id); setSelected(null); }}
        />
      )}
    </>
  );
}

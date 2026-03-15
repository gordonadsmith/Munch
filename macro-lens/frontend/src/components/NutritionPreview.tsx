import { useState, useRef } from "react";
import { NutritionData, MealTime, HealthRating } from "../types";
import { analyzeCorrection } from "../api";

interface Props {
  data: NutritionData;
  imagePreview?: string;
  imageBase64?: string;
  mimeType?: string;
  onAdd: (data: NutritionData, mealTime: MealTime) => void;
  onDiscard: () => void;
}

const MEALS: { id: MealTime; label: string; emoji: string }[] = [
  { id: "breakfast", label: "Breakfast", emoji: "☀️" },
  { id: "lunch",     label: "Lunch",     emoji: "🥗" },
  { id: "dinner",    label: "Dinner",    emoji: "🍽️" },
  { id: "snack",     label: "Snack",     emoji: "🍎" },
];

const RATING_CONFIG: Record<HealthRating, { label: string; color: string; bg: string; dot: string }> = {
  great:   { label: "Great",   color: "#16a34a", bg: "#f0fdf4", dot: "#22c55e" },
  neutral: { label: "Neutral", color: "#d97706", bg: "#fffbeb", dot: "#f59e0b" },
  bad:     { label: "Bad",     color: "#dc2626", bg: "#fef2f2", dot: "#ef4444" },
};

const CORRECTION_CHIPS = [
  "I only ate the entrée",
  "Just half a portion",
  "No sauce or dressing",
  "It was grilled, not fried",
  "Skip the bread / fries",
];

function defaultMeal(): MealTime {
  const h = new Date().getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 20) return "dinner";
  return "snack";
}

export default function NutritionPreview({ data, imagePreview, imageBase64, mimeType, onAdd, onDiscard }: Props) {
  const [current, setCurrent] = useState<NutritionData>(data);
  const [mealTime, setMealTime] = useState<MealTime>(defaultMeal());
  const [showCorrect, setShowCorrect] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const [correctionError, setCorrectionError] = useState("");
  const [corrections, setCorrections] = useState<string[]>([]);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const rating = RATING_CONFIG[current.healthRating] || RATING_CONFIG.neutral;

  const handleCorrection = async () => {
    if (correctionText.trim().length < 3) return;
    setCorrecting(true);
    setCorrectionError("");
    try {
      const result = await analyzeCorrection(current, correctionText.trim(), imageBase64, mimeType);
      if (!result.success || !result.data) { setCorrectionError(result.error || "Failed."); return; }
      setCorrections(p => [...p, correctionText.trim()]);
      setCurrent(result.data);
      setCorrectionText("");
      setShowCorrect(false);
    } catch (err) {
      setCorrectionError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setCorrecting(false); }
  };

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "var(--r-xl) var(--r-xl) 0 0",
      boxShadow: "var(--shadow-xl)",
      overflow: "hidden",
      animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
      maxHeight: "82vh",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Drag handle */}
      <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0", flexShrink: 0 }}>
        <div style={{ width: 36, height: 4, borderRadius: "99px", background: "var(--border-strong)" }} />
      </div>

      {/* Header */}
      <div style={{ padding: "14px 20px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {/* Top row: image + name + calories */}
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
          {imagePreview && (
            <img src={imagePreview} alt="" style={{ width: 48, height: 48, borderRadius: "var(--r-sm)", objectFit: "cover", flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.2, marginBottom: "3px" }}>
              {current.foodName}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--ink-4)" }}>{current.servingSize}</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 600, color: "var(--forest)", lineHeight: 1 }}>
              {current.calories}
            </p>
            <p style={{ fontSize: "11px", color: "var(--ink-4)" }}>kcal</p>
          </div>
        </div>

        {/* Health rating row */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: rating.bg, borderRadius: "99px", padding: "4px 12px", display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: rating.dot }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: rating.color }}>{rating.label}</span>
          </div>
          {current.healthSummary && (
            <p style={{ fontSize: "12px", color: "var(--ink-3)", lineHeight: 1.4, flex: 1 }}>
              {current.healthSummary.length > 65 ? current.healthSummary.slice(0, 65) + "…" : current.healthSummary}
            </p>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {/* Macros */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px", background: "var(--border)", borderBottom: "1px solid var(--border)" }}>
          {[
            { label: "Protein", value: current.protein, color: "var(--forest)" },
            { label: "Carbs", value: current.carbohydrates, color: "var(--amber)" },
            { label: "Fat", value: current.fat, color: "var(--blue)" },
            { label: "Fiber", value: current.fiber, color: "var(--purple)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "var(--surface)", padding: "14px 8px", textAlign: "center" }}>
              <p style={{ fontSize: "17px", fontWeight: 600, color, lineHeight: 1, marginBottom: "3px" }}>
                {Math.round(value)}<span style={{ fontSize: "11px", fontWeight: 400, color: "var(--ink-4)", marginLeft: "1px" }}>g</span>
              </p>
              <p style={{ fontSize: "10px", color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Meal selector */}
          <div>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              Add to
            </p>
            <div style={{ display: "flex", gap: "6px" }}>
              {MEALS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMealTime(m.id)}
                  style={{
                    flex: 1, padding: "8px 4px",
                    borderRadius: "var(--r-sm)",
                    border: `1.5px solid ${mealTime === m.id ? "var(--forest)" : "var(--border)"}`,
                    background: mealTime === m.id ? "var(--forest-pale)" : "transparent",
                    fontSize: "11px",
                    fontWeight: mealTime === m.id ? 600 : 400,
                    color: mealTime === m.id ? "var(--forest)" : "var(--ink-3)",
                    transition: "all 0.15s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Past corrections */}
          {corrections.length > 0 && (
            <div>
              {corrections.map((c, i) => (
                <p key={i} style={{ fontSize: "12px", color: "var(--ink-4)", fontStyle: "italic", marginBottom: "3px" }}>↩ "{c}"</p>
              ))}
            </div>
          )}

          {/* Analyst note */}
          {current.notes && (
            <div style={{ background: "var(--bg)", borderRadius: "var(--r-sm)", padding: "10px 12px" }}>
              <p style={{ fontSize: "12px", color: "var(--ink-3)", lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>
                  {current.confidence === "high" ? "✓ " : current.confidence === "medium" ? "~ " : "⚠ "}
                </span>
                {current.notes}
              </p>
            </div>
          )}

          {/* Correction panel */}
          {showCorrect ? (
            <div style={{ background: "var(--forest-pale)", borderRadius: "var(--r)", padding: "14px", animation: "fadeIn 0.2s ease" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--forest)", marginBottom: "10px" }}>What should I adjust?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
                {CORRECTION_CHIPS.map(c => (
                  <button key={c} onClick={() => { setCorrectionText(c); textRef.current?.focus(); }}
                    style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: "99px", padding: "4px 10px", fontSize: "11px", color: "var(--ink-2)", transition: "all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
                  >{c}</button>
                ))}
              </div>
              <textarea ref={textRef} value={correctionText} onChange={e => setCorrectionText(e.target.value)}
                placeholder="e.g. I only ate the salad, not the chicken..."
                rows={2} disabled={correcting} autoFocus
                style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "9px 12px", fontSize: "13px", lineHeight: 1.5, color: "var(--ink)", fontFamily: "var(--font)", marginBottom: "10px" }}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleCorrection(); }}
              />
              {correctionError && <p style={{ fontSize: "12px", color: "var(--red)", marginBottom: "8px" }}>{correctionError}</p>}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { setShowCorrect(false); setCorrectionText(""); setCorrectionError(""); }}
                  style={{ flex: 1, padding: "9px", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", fontSize: "13px", color: "var(--ink-3)", background: "var(--surface)" }}>
                  Cancel
                </button>
                <button onClick={handleCorrection} disabled={correcting || correctionText.trim().length < 3}
                  style={{ flex: 2, padding: "9px", background: correcting || correctionText.trim().length < 3 ? "var(--border)" : "var(--forest)", border: "none", borderRadius: "var(--r-sm)", fontSize: "13px", fontWeight: 600, color: correcting || correctionText.trim().length < 3 ? "var(--ink-4)" : "#fff", cursor: correcting || correctionText.trim().length < 3 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  {correcting
                    ? <><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Recalculating…</>
                    : "Recalculate"
                  }
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowCorrect(true)}
              style={{ width: "100%", padding: "10px", border: "1.5px dashed var(--border-strong)", borderRadius: "var(--r-sm)", fontSize: "13px", color: "var(--ink-3)", transition: "all 0.15s", textAlign: "center" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; (e.currentTarget as HTMLElement).style.color = "var(--forest)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLElement).style.color = "var(--ink-3)"; }}>
              ✏ Correct this estimate
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 16px 28px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", background: "var(--surface)", flexShrink: 0 }}>
        <button onClick={onDiscard}
          style={{ flex: 1, padding: "13px", border: "1.5px solid var(--border)", borderRadius: "var(--r)", fontSize: "14px", fontWeight: 500, color: "var(--ink-3)", background: "transparent" }}>
          Discard
        </button>
        <button onClick={() => onAdd(current, mealTime)}
          style={{ flex: 2, padding: "13px", background: "var(--forest)", border: "none", borderRadius: "var(--r)", fontSize: "14px", fontWeight: 600, color: "#fff", transition: "background 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--forest-mid)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--forest)"; }}>
          Add to {MEALS.find(m => m.id === mealTime)?.label}
        </button>
      </div>
    </div>
  );
}
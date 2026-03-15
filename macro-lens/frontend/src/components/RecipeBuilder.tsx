import { useState, useCallback } from "react";
import { SavedRecipe, RecipeIngredient, MealTime, HealthRating } from "../types";
import { analyzeText } from "../api";

interface Props {
  existing?: SavedRecipe;
  onSave: (recipe: SavedRecipe) => void;
  onDismiss: () => void;
}

const FOOD_EMOJIS = ["🍗", "🥗", "🍝", "🥩", "🐟", "🥘", "🍜", "🥙", "🌮", "🫕", "🍲", "🥞", "🍳", "🥣", "🫐"];

function generateId() {
  return `recipe-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function RecipeBuilder({ existing, onSave, onDismiss }: Props) {
  const [name, setName] = useState(existing?.name ?? "");
  const [emoji, setEmoji] = useState(existing?.emoji ?? "🍽️");
  const [servings, setServings] = useState(existing?.servings ?? 2);
  const [rawText, setRawText] = useState("");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(existing?.ingredients ?? []);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [step, setStep] = useState<"ingredients" | "review">(existing ? "review" : "ingredients");

  const analyzeIngredients = useCallback(async () => {
    if (!rawText.trim()) return;
    setAnalyzing(true);
    setError("");
    try {
      // Analyze the full ingredient list as a recipe
      const result = await analyzeText(`Recipe ingredients (makes ${servings} servings):\n${rawText}`);
      if (!result.success || !result.data) { setError("Couldn't analyze ingredients. Try again."); return; }
      const d = result.data;
      const ingredient: RecipeIngredient = {
        id: generateId(),
        name: rawText.slice(0, 60),
        amount: `${servings} servings`,
        calories: d.calories * servings,
        protein: d.protein * servings,
        carbohydrates: d.carbohydrates * servings,
        fat: d.fat * servings,
      };
      setIngredients([ingredient]);
      setStep("review");
    } catch {
      setError("Analysis failed. Check your connection.");
    } finally { setAnalyzing(false); }
  }, [rawText, servings]);

  const removeIngredient = (id: string) => setIngredients(prev => prev.filter(i => i.id !== id));

  // Per-serving totals
  const totals = ingredients.reduce((acc, ing) => ({
    calories: acc.calories + ing.calories / servings,
    protein: acc.protein + ing.protein / servings,
    carbohydrates: acc.carbohydrates + ing.carbohydrates / servings,
    fat: acc.fat + ing.fat / servings,
    fiber: 0,
  }), { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });

  const healthRating: HealthRating = totals.protein >= 20 && totals.calories < 600 ? "great"
    : totals.calories > 800 || totals.fat > 40 ? "bad" : "neutral";

  const canSave = name.trim().length >= 2 && ingredients.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const recipe: SavedRecipe = {
      id: existing?.id ?? generateId(),
      name: name.trim(),
      emoji,
      servings,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      ingredients,
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbohydrates: Math.round(totals.carbohydrates),
      fat: Math.round(totals.fat),
      fiber: Math.round(totals.fiber),
      healthRating,
      healthSummary: healthRating === "great" ? "A nutritious, balanced meal." : healthRating === "bad" ? "High in calories or fat." : "A solid everyday meal.",
    };
    onSave(recipe);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
      maxWidth: "430px", margin: "0 auto",
      animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
    }}>
      {/* Header */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "14px 16px", paddingTop: "calc(14px + env(safe-area-inset-top, 0px))", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 600, color: "var(--ink)" }}>
            {existing ? "Edit Recipe" : "New Recipe"}
          </h2>
          <p style={{ fontSize: "11px", color: "var(--ink-4)", marginTop: "2px" }}>
            {step === "ingredients" ? "Step 1 of 2 — Add ingredients" : "Step 2 of 2 — Review & save"}
          </p>
        </div>
        <button onClick={onDismiss} style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "var(--ink-3)", cursor: "pointer" }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Name + emoji */}
        <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "16px", marginBottom: "12px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
            <button
              onClick={() => setShowEmojiPicker(p => !p)}
              style={{ width: 48, height: 48, borderRadius: "var(--r)", background: "var(--forest-xpale)", border: "1.5px solid var(--border-mid)", fontSize: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              {emoji}
            </button>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Recipe name…"
              style={{ flex: 1, padding: "12px 14px", background: "var(--bg)", border: "1.5px solid var(--border-mid)", borderRadius: "var(--r)", fontSize: "15px", fontWeight: 500, color: "var(--ink)", fontFamily: "var(--font)", outline: "none", transition: "border-color 0.15s" }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "var(--forest)"; }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "var(--border-mid)"; }}
            />
          </div>

          {showEmojiPicker && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "8px 0", animation: "fadeIn 0.15s ease" }}>
              {FOOD_EMOJIS.map(e => (
                <button key={e} onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                  style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: emoji === e ? "var(--forest-pale)" : "var(--bg)", border: `1.5px solid ${emoji === e ? "var(--forest)" : "var(--border)"}`, fontSize: "20px", cursor: "pointer" }}>
                  {e}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "var(--ink-3)", fontWeight: 500 }}>Servings</span>
            <div style={{ display: "flex", alignItems: "center", background: "var(--bg)", borderRadius: "var(--r)", border: "1.5px solid var(--border-mid)", overflow: "hidden" }}>
              <button onClick={() => setServings(s => Math.max(1, s - 1))} style={{ width: 36, height: 36, fontSize: "18px", color: "var(--ink-3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--ink)", minWidth: "32px", textAlign: "center" }}>{servings}</span>
              <button onClick={() => setServings(s => s + 1)} style={{ width: 36, height: 36, fontSize: "18px", color: "var(--ink-3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
          </div>
        </div>

        {/* Ingredients step */}
        {step === "ingredients" && (
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", padding: "16px", boxShadow: "var(--shadow-sm)", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-2)", marginBottom: "8px" }}>Add your ingredients</p>
            <p style={{ fontSize: "12px", color: "var(--ink-4)", marginBottom: "10px", lineHeight: 1.5 }}>
              List all ingredients with quantities. Munch will calculate the nutrition per serving.
            </p>
            <div style={{ background: "var(--bg)", borderRadius: "var(--r)", border: "1.5px solid var(--border-mid)", padding: "10px 14px", marginBottom: "10px", transition: "border-color 0.15s" }}
              onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; }}
              onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)"; }}>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={`e.g.\n200g chicken breast\n1 cup brown rice\n2 tbsp olive oil\n1 cup broccoli\nSalt, pepper, garlic powder`}
                rows={6}
                style={{ width: "100%", fontSize: "13px", lineHeight: 1.6, color: "var(--ink)", background: "transparent", fontFamily: "var(--font)" }}
              />
            </div>
            {error && <p style={{ fontSize: "12px", color: "var(--red)", marginBottom: "8px" }}>{error}</p>}
            <button
              onClick={analyzeIngredients}
              disabled={analyzing || !rawText.trim()}
              style={{ width: "100%", padding: "13px", background: analyzing || !rawText.trim() ? "var(--border)" : "var(--forest)", border: "none", borderRadius: "var(--r)", fontSize: "14px", fontWeight: 700, color: analyzing || !rawText.trim() ? "var(--ink-4)" : "#fff", cursor: analyzing || !rawText.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              {analyzing ? (
                <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Analyzing…</>
              ) : "Calculate nutrition →"}
            </button>
          </div>
        )}

        {/* Review step */}
        {step === "review" && ingredients.length > 0 && (
          <div>
            <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)", marginBottom: "12px" }}>
              <div style={{ background: "linear-gradient(135deg, var(--forest) 0%, var(--forest-mid) 100%)", padding: "14px 16px" }}>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Per serving</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                  {Math.round(totals.calories)} <span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>kcal</span>
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px", background: "var(--border)" }}>
                {[
                  { l: "Protein", v: totals.protein, c: "var(--green)" },
                  { l: "Carbs", v: totals.carbohydrates, c: "var(--amber-light)" },
                  { l: "Fat", v: totals.fat, c: "var(--blue)" },
                  { l: "Servings", v: servings, c: "var(--forest)", unit: "" },
                ].map(({ l, v, c, unit = "g" }) => (
                  <div key={l} style={{ background: "var(--surface)", padding: "12px 6px", textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: c, lineHeight: 1, marginBottom: "2px" }}>{Math.round(v)}<span style={{ fontSize: "10px", fontWeight: 400, color: "var(--ink-4)" }}>{unit}</span></p>
                    <p style={{ fontSize: "9px", fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setStep("ingredients")} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--forest)", fontWeight: 500, marginBottom: "14px", cursor: "pointer" }}>
              ← Edit ingredients
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {step === "review" && (
        <div style={{ padding: "12px 16px 28px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", background: "var(--surface)", flexShrink: 0 }}>
          <button onClick={onDismiss} style={{ flex: 1, padding: "13px", border: "1.5px solid var(--border-mid)", borderRadius: "var(--r)", fontSize: "13px", fontWeight: 500, color: "var(--ink-3)", background: "transparent", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!canSave} style={{ flex: 2, padding: "13px", background: canSave ? "var(--forest)" : "var(--border)", border: "none", borderRadius: "var(--r)", fontSize: "14px", fontWeight: 700, color: canSave ? "#fff" : "var(--ink-4)", cursor: canSave ? "pointer" : "not-allowed" }}>
            Save Recipe 💾
          </button>
        </div>
      )}
    </div>
  );
}

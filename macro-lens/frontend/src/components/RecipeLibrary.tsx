import { useState } from "react";
import { SavedRecipe, MealTime, NutritionData } from "../types";
import RecipeBuilder from "./RecipeBuilder";

interface Props {
  recipes: SavedRecipe[];
  onLog: (nutrition: NutritionData, mealTime: MealTime) => void;
  onSave: (recipe: SavedRecipe) => void;
  onDelete: (id: string) => void;
  onDismiss: () => void;
}

const MEALS: { id: MealTime; label: string; emoji: string }[] = [
  { id: "breakfast", label: "Breakfast", emoji: "☀️" },
  { id: "lunch",     label: "Lunch",     emoji: "🥗" },
  { id: "dinner",    label: "Dinner",    emoji: "🍽️" },
  { id: "snack",     label: "Snack",     emoji: "🍎" },
];

function defaultMeal(): MealTime {
  const h = new Date().getHours();
  if (h < 10) return "breakfast";
  if (h < 14) return "lunch";
  if (h < 20) return "dinner";
  return "snack";
}

function recipeToNutrition(recipe: SavedRecipe): NutritionData {
  return {
    foodName: recipe.name,
    servingSize: `1 serving (recipe makes ${recipe.servings})`,
    calories: recipe.calories,
    protein: recipe.protein,
    carbohydrates: recipe.carbohydrates,
    fat: recipe.fat,
    fiber: recipe.fiber,
    sugar: 0,
    confidence: "high",
    notes: "From your saved recipe.",
    ingredients: recipe.ingredients.map(i => i.name),
    healthRating: recipe.healthRating,
    healthSummary: recipe.healthSummary,
    highlights: [],
  };
}

const HEALTH_DOT: Record<string, string> = { great: "#22c55e", neutral: "#f59e0b", bad: "#ef4444" };

export default function RecipeLibrary({ recipes, onLog, onSave, onDelete, onDismiss }: Props) {
  const [selected, setSelected] = useState<SavedRecipe | null>(null);
  const [meal, setMeal] = useState<MealTime>(defaultMeal());
  const [showBuilder, setShowBuilder] = useState(false);
  const [editRecipe, setEditRecipe] = useState<SavedRecipe | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleLog = () => {
    if (!selected) return;
    onLog(recipeToNutrition(selected), meal);
    onDismiss();
  };

  if (showBuilder) {
    return (
      <RecipeBuilder
        existing={editRecipe}
        onSave={recipe => { onSave(recipe); setShowBuilder(false); setEditRecipe(undefined); }}
        onDismiss={() => { setShowBuilder(false); setEditRecipe(undefined); }}
      />
    );
  }

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
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 600, color: "var(--ink)" }}>My Recipes</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => { setEditRecipe(undefined); setShowBuilder(true); }}
            style={{ padding: "7px 14px", background: "var(--forest)", border: "none", borderRadius: "var(--r-full)", fontSize: "13px", fontWeight: 700, color: "#fff", cursor: "pointer" }}
          >
            + New
          </button>
          <button onClick={onDismiss} style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "var(--ink-3)", cursor: "pointer" }}>×</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {recipes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ fontSize: "40px", marginBottom: "12px" }}>👨‍🍳</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontStyle: "italic", color: "var(--ink-4)", marginBottom: "8px" }}>No recipes yet</p>
            <p style={{ fontSize: "13px", color: "var(--ink-4)", lineHeight: 1.6, marginBottom: "20px" }}>Save your favourite meals to log them in one tap</p>
            <button onClick={() => setShowBuilder(true)} style={{ padding: "12px 24px", background: "var(--forest)", border: "none", borderRadius: "var(--r)", fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>
              Create your first recipe
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recipes.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => setSelected(s => s?.id === recipe.id ? null : recipe)}
                style={{
                  background: selected?.id === recipe.id ? "var(--forest-xpale)" : "var(--surface)",
                  border: `1.5px solid ${selected?.id === recipe.id ? "var(--forest)" : "var(--border)"}`,
                  borderRadius: "var(--r-lg)", padding: "14px", textAlign: "left",
                  cursor: "pointer", transition: "all 0.15s", boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "var(--r-sm)", background: "var(--forest-pale)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                    {recipe.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: HEALTH_DOT[recipe.healthRating], flexShrink: 0 }} />
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recipe.name}</p>
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--ink-4)", paddingLeft: "13px" }}>
                      {recipe.protein}g P · {recipe.carbohydrates}g C · {recipe.fat}g F · {recipe.servings} servings
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--forest)", lineHeight: 1 }}>{recipe.calories}</p>
                    <p style={{ fontSize: "10px", color: "var(--ink-4)" }}>kcal</p>
                  </div>
                </div>

                {/* Expanded: meal picker + actions */}
                {selected?.id === recipe.id && (
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)", animation: "fadeIn 0.2s ease" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Log to</p>
                    <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
                      {MEALS.map(m => (
                        <button key={m.id} onClick={e => { e.stopPropagation(); setMeal(m.id); }}
                          style={{ flex: 1, padding: "7px 2px", borderRadius: "var(--r-sm)", border: `1.5px solid ${meal === m.id ? "var(--forest)" : "var(--border)"}`, background: meal === m.id ? "var(--forest-xpale)" : "transparent", fontSize: "10px", fontWeight: meal === m.id ? 700 : 400, color: meal === m.id ? "var(--forest)" : "var(--ink-3)", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", cursor: "pointer" }}>
                          <span style={{ fontSize: "14px" }}>{m.emoji}</span>{m.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={e => { e.stopPropagation(); setEditRecipe(recipe); setShowBuilder(true); }}
                        style={{ flex: 1, padding: "9px", border: "1.5px solid var(--border-mid)", borderRadius: "var(--r-sm)", fontSize: "12px", fontWeight: 500, color: "var(--ink-3)", background: "transparent", cursor: "pointer" }}>
                        ✏ Edit
                      </button>
                      {confirmDelete === recipe.id ? (
                        <>
                          <button onClick={e => { e.stopPropagation(); onDelete(recipe.id); setConfirmDelete(null); setSelected(null); }}
                            style={{ flex: 1, padding: "9px", background: "var(--red)", border: "none", borderRadius: "var(--r-sm)", fontSize: "12px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                            Confirm delete
                          </button>
                          <button onClick={e => { e.stopPropagation(); setConfirmDelete(null); }}
                            style={{ flex: 1, padding: "9px", border: "1.5px solid var(--border-mid)", borderRadius: "var(--r-sm)", fontSize: "12px", color: "var(--ink-3)", background: "transparent", cursor: "pointer" }}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); setConfirmDelete(recipe.id); }}
                          style={{ flex: 1, padding: "9px", border: "1.5px solid var(--border-mid)", borderRadius: "var(--r-sm)", fontSize: "12px", fontWeight: 500, color: "var(--red)", background: "transparent", cursor: "pointer" }}>
                          🗑 Delete
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); handleLog(); }}
                        style={{ flex: 2, padding: "9px", background: "var(--forest)", border: "none", borderRadius: "var(--r-sm)", fontSize: "13px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                        Log →
                      </button>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
        <div style={{ height: "24px" }} />
      </div>
    </div>
  );
}

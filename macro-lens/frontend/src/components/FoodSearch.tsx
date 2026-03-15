import { useState, useRef, useCallback } from "react";
import { FoodSearchResult, MealTime, NutritionData, HealthRating } from "../types";

interface Props {
  onSelect: (nutrition: NutritionData, mealTime: MealTime) => void;
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

// Open Food Facts API
async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=id,product_name,brands,serving_size,nutriments,image_front_small_url`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json() as { products: Record<string, unknown>[] };

  return (data.products ?? [])
    .map((p: Record<string, unknown>) => {
      const n = (p.nutriments as Record<string, number>) ?? {};
      const cal = n["energy-kcal_serving"] ?? n["energy-kcal_100g"] ?? 0;
      if (!cal || !p.product_name) return null;

      // Heuristic health rating
      const sugar = n["sugars_serving"] ?? n["sugars_100g"] ?? 0;
      const satFat = n["saturated-fat_serving"] ?? n["saturated-fat_100g"] ?? 0;
      const protein = n["proteins_serving"] ?? n["proteins_100g"] ?? 0;
      const fiber = n["fiber_serving"] ?? n["fiber_100g"] ?? 0;
      let healthRating: HealthRating = "neutral";
      if (sugar > 20 || satFat > 8 || (cal > 400 && protein < 10)) healthRating = "bad";
      else if (protein >= 15 && sugar < 8 && fiber >= 3) healthRating = "great";

      return {
        id: String(p.id ?? Math.random()),
        name: String(p.product_name),
        brand: p.brands ? String(p.brands).split(",")[0].trim() : undefined,
        servingSize: String(p.serving_size ?? "100g"),
        calories: Math.round(cal),
        protein: Math.round(n["proteins_serving"] ?? n["proteins_100g"] ?? 0),
        carbohydrates: Math.round(n["carbohydrates_serving"] ?? n["carbohydrates_100g"] ?? 0),
        fat: Math.round(n["fat_serving"] ?? n["fat_100g"] ?? 0),
        fiber: Math.round(n["fiber_serving"] ?? n["fiber_100g"] ?? 0),
        sugar: Math.round(n["sugars_serving"] ?? n["sugars_100g"] ?? 0),
        imageUrl: p.image_front_small_url ? String(p.image_front_small_url) : undefined,
        healthRating,
      } as FoodSearchResult & { healthRating: HealthRating };
    })
    .filter(Boolean) as FoodSearchResult[];
}

function toNutritionData(result: FoodSearchResult & { healthRating?: HealthRating }): NutritionData {
  const hr: HealthRating = result.healthRating ?? "neutral";
  return {
    foodName: result.name + (result.brand ? ` (${result.brand})` : ""),
    servingSize: result.servingSize,
    calories: result.calories,
    protein: result.protein,
    carbohydrates: result.carbohydrates,
    fat: result.fat,
    fiber: result.fiber,
    sugar: result.sugar,
    confidence: "high",
    notes: "From Open Food Facts database.",
    ingredients: [],
    healthRating: hr,
    healthSummary: hr === "great" ? "A nutritious choice." : hr === "bad" ? "High in sugar or saturated fat." : "An everyday food with mixed nutritional value.",
    highlights: [],
  };
}

const HEALTH_DOT: Record<HealthRating, string> = { great: "#22c55e", neutral: "#f59e0b", bad: "#ef4444" };

const QUICK_SEARCHES = ["Chicken breast", "Greek yogurt", "Oatmeal", "Avocado", "Brown rice", "Salmon", "Eggs", "Almonds"];

export default function FoodSearch({ onSelect, onDismiss }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(FoodSearchResult & { healthRating?: HealthRating })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<(FoodSearchResult & { healthRating?: HealthRating }) | null>(null);
  const [meal, setMeal] = useState<MealTime>(defaultMeal());
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    setSelected(null);
    try {
      const res = await searchFoods(q);
      if (res.length === 0) setError("No results found. Try a different search term.");
      setResults(res);
    } catch {
      setError("Search failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConfirm = () => {
    if (!selected) return;
    onSelect(toNutritionData(selected), meal);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      display: "flex", flexDirection: "column",
      background: "var(--bg)",
      animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
      maxWidth: "430px", margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "14px 16px", flexShrink: 0,
        paddingTop: "calc(14px + env(safe-area-inset-top, 0px))",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 600, color: "var(--ink)" }}>Search Foods</h2>
          <button onClick={onDismiss} style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "var(--ink-3)", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: "8px",
            background: "var(--bg)", borderRadius: "var(--r)", border: "1.5px solid var(--border-mid)",
            padding: "0 12px", transition: "border-color 0.15s",
          }}
            onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; }}
            onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="var(--ink-4)" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="var(--ink-4)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") search(query); }}
              placeholder="Search foods, brands, restaurants…"
              autoFocus
              style={{ flex: 1, padding: "12px 0", fontSize: "14px", color: "var(--ink)", background: "transparent" }}
            />
            {query && <button onClick={() => { setQuery(""); setResults([]); setSelected(null); inputRef.current?.focus(); }} style={{ fontSize: "16px", color: "var(--ink-4)", cursor: "pointer" }}>×</button>}
          </div>
          <button onClick={() => search(query)} disabled={loading || !query.trim()} style={{
            padding: "0 16px", background: loading || !query.trim() ? "var(--border-mid)" : "var(--forest)",
            border: "none", borderRadius: "var(--r)", fontSize: "13px", fontWeight: 700,
            color: loading || !query.trim() ? "var(--ink-4)" : "#fff", cursor: loading || !query.trim() ? "default" : "pointer",
            transition: "all 0.15s", whiteSpace: "nowrap",
          }}>
            {loading ? "…" : "Search"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {/* Quick searches */}
        {results.length === 0 && !loading && !error && (
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Quick searches</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {QUICK_SEARCHES.map(s => (
                <button key={s} onClick={() => { setQuery(s); search(s); }} style={{
                  background: "var(--surface)", border: "1px solid var(--border-mid)",
                  borderRadius: "var(--r-full)", padding: "7px 14px",
                  fontSize: "13px", fontWeight: 500, color: "var(--ink-2)",
                  cursor: "pointer", transition: "all 0.15s", boxShadow: "var(--shadow-xs)",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; (e.currentTarget as HTMLElement).style.color = "var(--forest)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)"; (e.currentTarget as HTMLElement).style.color = "var(--ink-2)"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 28, height: 28, border: "3px solid var(--border-mid)", borderTopColor: "var(--forest)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "13px", color: "var(--ink-4)" }}>Searching…</p>
          </div>
        )}

        {error && <p style={{ textAlign: "center", fontSize: "13px", color: "var(--ink-4)", padding: "24px 0", fontStyle: "italic" }}>{error}</p>}

        {results.length > 0 && !selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
              {results.length} results
            </p>
            {results.map(r => {
              const hr = r.healthRating ?? "neutral";
              return (
                <button key={r.id} onClick={() => setSelected(r)} style={{
                  background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r-lg)",
                  padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px",
                  textAlign: "left", cursor: "pointer", transition: "all 0.15s", boxShadow: "var(--shadow-xs)",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; (e.currentTarget as HTMLElement).style.background = "var(--forest-xpale)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--surface)"; }}
                >
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: "var(--r-sm)", objectFit: "cover", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: "var(--r-sm)", background: "var(--forest-xpale)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>🥘</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: HEALTH_DOT[hr], flexShrink: 0 }} />
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</p>
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--ink-4)", marginBottom: "4px", paddingLeft: "11px" }}>
                      {r.brand ? `${r.brand} · ` : ""}{r.servingSize}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--ink-3)", paddingLeft: "11px" }}>
                      {r.protein}g P · {r.carbohydrates}g C · {r.fat}g F
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--forest)", lineHeight: 1 }}>{r.calories}</p>
                    <p style={{ fontSize: "10px", color: "var(--ink-4)" }}>kcal</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected item — confirm + meal picker */}
        {selected && (
          <div style={{ animation: "popIn 0.2s ease" }}>
            <button onClick={() => setSelected(null)} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--forest)", fontWeight: 500, marginBottom: "14px", cursor: "pointer" }}>
              ← Back to results
            </button>
            <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)", marginBottom: "16px" }}>
              <div style={{ padding: "16px 16px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ flex: 1, paddingRight: "12px" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.2, marginBottom: "2px" }}>{selected.name}</p>
                    {selected.brand && <p style={{ fontSize: "11px", color: "var(--ink-4)" }}>{selected.brand}</p>}
                    <p style={{ fontSize: "11px", color: "var(--ink-4)" }}>{selected.servingSize}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--forest)", lineHeight: 1 }}>{selected.calories}</p>
                    <p style={{ fontSize: "10px", color: "var(--ink-4)" }}>kcal</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px", marginBottom: "14px" }}>
                  {[
                    { l: "Protein", v: selected.protein, c: "var(--green)" },
                    { l: "Carbs", v: selected.carbohydrates, c: "var(--amber-light)" },
                    { l: "Fat", v: selected.fat, c: "var(--blue)" },
                    { l: "Fiber", v: selected.fiber, c: "var(--purple)" },
                  ].map(({ l, v, c }) => (
                    <div key={l} style={{ background: "var(--bg)", borderRadius: "var(--r-sm)", padding: "8px 4px", textAlign: "center" }}>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700, color: c, lineHeight: 1, marginBottom: "2px" }}>{v}<span style={{ fontSize: "9px", fontWeight: 400, color: "var(--ink-4)" }}>g</span></p>
                      <p style={{ fontSize: "9px", fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{l}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Add to</p>
                <div style={{ display: "flex", gap: "5px", marginBottom: "14px" }}>
                  {MEALS.map(m => (
                    <button key={m.id} onClick={() => setMeal(m.id)} style={{
                      flex: 1, padding: "7px 2px", borderRadius: "var(--r-sm)",
                      border: `1.5px solid ${meal === m.id ? "var(--forest)" : "var(--border)"}`,
                      background: meal === m.id ? "var(--forest-xpale)" : "transparent",
                      fontSize: "10px", fontWeight: meal === m.id ? 700 : 400,
                      color: meal === m.id ? "var(--forest)" : "var(--ink-3)",
                      transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", cursor: "pointer",
                    }}>
                      <span style={{ fontSize: "14px" }}>{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", borderTop: "1px solid var(--border)" }}>
                <button onClick={() => setSelected(null)} style={{ flex: 1, padding: "13px", fontSize: "13px", fontWeight: 500, color: "var(--ink-4)", background: "transparent", cursor: "pointer", borderRight: "1px solid var(--border)" }}>Cancel</button>
                <button onClick={handleConfirm} style={{ flex: 2, padding: "13px", fontSize: "13px", fontWeight: 700, color: "var(--forest)", background: "transparent", cursor: "pointer" }}>
                  Log to {MEALS.find(m => m.id === meal)?.label} →
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: "24px" }} />
      </div>
    </div>
  );
}

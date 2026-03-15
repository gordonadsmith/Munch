import { NutritionData } from "../types";
import MacroBar from "./MacroBar";

interface Props {
  data: NutritionData;
  onReset: () => void;
}

const CONFIDENCE_CONFIG = {
  high: { label: "High confidence", color: "var(--green)", bg: "var(--green-pale)", dot: "🟢" },
  medium: { label: "Medium confidence", color: "var(--amber)", bg: "var(--amber-pale)", dot: "🟡" },
  low: { label: "Low confidence", color: "var(--red)", bg: "var(--red-pale)", dot: "🔴" },
};

export default function NutritionCard({ data, onReset }: Props) {
  const conf = CONFIDENCE_CONFIG[data.confidence] || CONFIDENCE_CONFIG.medium;

  // Macros as % of calories for display scale
  const totalMacroCalories = data.protein * 4 + data.carbohydrates * 4 + data.fat * 9;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
        animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--ink) 0%, #3d3028 100%)",
          padding: "28px 28px 24px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0, right: 0,
            width: "160px", height: "100%",
            background: "radial-gradient(circle at top right, rgba(200,121,26,0.25), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--amber-light)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
          Analysis Complete
        </p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 600, color: "#fff", lineHeight: 1.25, marginBottom: "8px" }}>
          {data.foodName}
        </h2>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
          {data.servingSize}
        </p>
      </div>

      {/* Calorie hero */}
      <div
        style={{
          background: "var(--amber-pale)",
          borderBottom: "1px solid var(--border)",
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ fontSize: "12px", color: "var(--ink-muted)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Total Calories
          </p>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "48px", fontWeight: 600, color: "var(--amber)", lineHeight: 1 }}>
            {data.calories}
            <span style={{ fontSize: "18px", fontWeight: 400, color: "var(--ink-muted)", marginLeft: "6px" }}>kcal</span>
          </p>
        </div>
        <div
          style={{
            background: conf.bg,
            borderRadius: "40px",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 500,
            color: conf.color,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>{conf.dot}</span> {conf.label}
        </div>
      </div>

      {/* Macro grid */}
      <div style={{ padding: "24px 28px" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, marginBottom: "14px", color: "var(--ink)" }}>
          Macronutrients
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <MacroBar label="Protein" value={data.protein} unit="g" color="#2d6a4f" bgColor="var(--green-pale)" max={Math.max(50, data.protein * 1.5)} icon="🥩" />
          <MacroBar label="Carbs" value={data.carbohydrates} unit="g" color="#c8791a" bgColor="var(--amber-pale)" max={Math.max(100, data.carbohydrates * 1.5)} icon="🌾" />
          <MacroBar label="Fat" value={data.fat} unit="g" color="#1d4e89" bgColor="var(--blue-pale)" max={Math.max(40, data.fat * 1.5)} icon="🫒" />
          <MacroBar label="Fiber" value={data.fiber} unit="g" color="#7b5ea7" bgColor="#f0ebfc" max={Math.max(25, data.fiber * 1.5)} icon="🌿" />
        </div>

        {/* Sugar row */}
        <div
          style={{
            marginTop: "10px",
            background: "var(--cream-dark)",
            borderRadius: "var(--radius)",
            padding: "12px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🍬</span>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink-muted)" }}>Sugar</span>
            <span style={{ fontSize: "11px", color: "var(--ink-light)" }}>(incl. in Carbs)</span>
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, color: "var(--ink)" }}>
            {data.sugar}<span style={{ fontSize: "11px", fontWeight: 400, color: "var(--ink-light)", marginLeft: "2px" }}>g</span>
          </span>
        </div>
      </div>

      {/* Macro calorie breakdown */}
      {totalMacroCalories > 0 && (
        <div style={{ padding: "0 28px 24px" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "var(--ink)" }}>
            Calorie Split
          </h3>
          <div style={{ height: "10px", borderRadius: "99px", overflow: "hidden", display: "flex", gap: "2px" }}>
            {[
              { label: "Protein", value: data.protein * 4, color: "#2d6a4f" },
              { label: "Carbs", value: data.carbohydrates * 4, color: "#c8791a" },
              { label: "Fat", value: data.fat * 9, color: "#1d4e89" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                title={`${label}: ${Math.round((value / totalMacroCalories) * 100)}%`}
                style={{
                  height: "100%",
                  width: `${(value / totalMacroCalories) * 100}%`,
                  background: color,
                  transition: "width 0.8s ease",
                  borderRadius: "2px",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
            {[
              { label: "Protein", value: data.protein * 4, color: "#2d6a4f" },
              { label: "Carbs", value: data.carbohydrates * 4, color: "#c8791a" },
              { label: "Fat", value: data.fat * 9, color: "#1d4e89" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                <span style={{ fontSize: "12px", color: "var(--ink-muted)" }}>
                  {label} {Math.round((value / totalMacroCalories) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients */}
      {data.ingredients && data.ingredients.length > 0 && (
        <div
          style={{
            padding: "20px 28px",
            borderTop: "1px solid var(--border)",
            background: "var(--cream)",
          }}
        >
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 600, marginBottom: "10px", color: "var(--ink)" }}>
            Detected Ingredients
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            {data.ingredients.map((ingredient) => (
              <span
                key={ingredient}
                style={{
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "99px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  color: "var(--ink-muted)",
                  fontWeight: 400,
                }}
              >
                {ingredient}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid var(--border)",
            background: "var(--cream-dark)",
          }}
        >
          <p style={{ fontSize: "12px", color: "var(--ink-muted)", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>📋 Note: </span>
            {data.notes}
          </p>
        </div>
      )}

      {/* Reset */}
      <div style={{ padding: "20px 28px", borderTop: "1px solid var(--border)" }}>
        <button
          onClick={onReset}
          style={{
            width: "100%",
            padding: "13px",
            background: "transparent",
            border: "2px solid var(--border)",
            borderRadius: "var(--radius)",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--ink-muted)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "var(--amber)";
            (e.target as HTMLButtonElement).style.color = "var(--amber)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = "var(--border)";
            (e.target as HTMLButtonElement).style.color = "var(--ink-muted)";
          }}
        >
          Analyze another meal →
        </button>
      </div>
    </div>
  );
}

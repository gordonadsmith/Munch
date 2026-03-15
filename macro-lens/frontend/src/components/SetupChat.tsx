import { useState, useEffect, useRef } from "react";
import { UserProfile, Aggressiveness, NutritionGoals, Goal } from "../types";
import { computeGoalsForAggressiveness } from "../useProfile";

interface Props {
  profile: UserProfile;
  onConfirm: (goals: NutritionGoals, aggressiveness: Aggressiveness) => void;
}

// ── Static config ─────────────────────────────────────────────────────────────
const GOAL_LABELS: Record<Goal, string> = {
  lose_weight:     "lose weight",
  build_muscle:    "build muscle",
  improve_fitness: "improve your fitness",
  eat_healthier:   "eat healthier",
  maintain:        "maintain your weight",
};

const GOAL_CONTEXT: Record<Goal, string> = {
  lose_weight:     "To hit that, I'll put you in a calorie deficit while keeping protein high to preserve muscle.",
  build_muscle:    "To support muscle growth, you'll be in a slight calorie surplus with elevated protein.",
  improve_fitness: "I'll set you at maintenance calories with a strong protein target to fuel your training.",
  eat_healthier:   "I'll keep you at maintenance calories and focus on balanced, high-quality macros.",
  maintain:        "You're at a healthy spot — I'll set you at maintenance with solid macro targets.",
};

const AGGRESSIVENESS_OPTIONS: {
  id: Aggressiveness;
  label: string;
  desc: string;
  icon: string;
  detail: Record<Goal, string>;
}[] = [
  {
    id: "conservative",
    label: "Steady",
    icon: "🐢",
    desc: "Slow and sustainable",
    detail: {
      lose_weight:     "−250 kcal/day · lose ~0.5 lb/week",
      build_muscle:    "+150 kcal/day · slow, clean bulk",
      improve_fitness: "Maintenance · gradual improvement",
      eat_healthier:   "Maintenance · easy habit changes",
      maintain:        "Maintenance · keep it balanced",
    },
  },
  {
    id: "moderate",
    label: "Balanced",
    icon: "⚡",
    desc: "Recommended",
    detail: {
      lose_weight:     "−500 kcal/day · lose ~1 lb/week",
      build_muscle:    "+300 kcal/day · steady lean bulk",
      improve_fitness: "Maintenance + high protein",
      eat_healthier:   "Maintenance + macro targets",
      maintain:        "Maintenance · optimized macros",
    },
  },
  {
    id: "aggressive",
    label: "Intense",
    icon: "🔥",
    desc: "Faster results",
    detail: {
      lose_weight:     "−750 kcal/day · lose ~1.5 lb/week",
      build_muscle:    "+500 kcal/day · fast bulk",
      improve_fitness: "Maintenance + max protein",
      eat_healthier:   "Maintenance + strict targets",
      maintain:        "Maintenance · peak optimization",
    },
  },
];

// ── Macro card ────────────────────────────────────────────────────────────────
function MacroPlanCard({ goals, aggressiveness, profile }: { goals: NutritionGoals; aggressiveness: Aggressiveness; profile: UserProfile }) {
  const lbs = Math.round(profile.weightKg * 2.205);
  const bmi = +(profile.weightKg / ((profile.heightCm / 100) ** 2)).toFixed(1);
  const diff = goals.calories - profile.tdee;
  const diffLabel = diff === 0 ? "Maintenance" : diff > 0 ? `+${diff} kcal surplus` : `${diff} kcal deficit`;

  const macros = [
    { label: "Protein", value: goals.protein, unit: "g", color: "#1e4d35", bg: "#eaf3ee", pct: Math.round((goals.protein * 4 / goals.calories) * 100) },
    { label: "Carbs",   value: goals.carbohydrates, unit: "g", color: "#d97706", bg: "#fffbeb", pct: Math.round((goals.carbohydrates * 4 / goals.calories) * 100) },
    { label: "Fat",     value: goals.fat, unit: "g", color: "#2563eb", bg: "#eff6ff", pct: Math.round((goals.fat * 9 / goals.calories) * 100) },
    { label: "Fiber",   value: goals.fiber, unit: "g", color: "#7c3aed", bg: "#f5f3ff", pct: null },
  ];

  return (
    <div style={{
      background: "#fff",
      borderRadius: "var(--r-lg)",
      overflow: "hidden",
      boxShadow: "var(--shadow-md)",
      animation: "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, var(--forest) 0%, var(--forest-mid) 100%)", padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
              Your daily target · {aggressiveness.charAt(0).toUpperCase() + aggressiveness.slice(1)}
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 600, color: "#fff", lineHeight: 1 }}>
              {goals.calories.toLocaleString()}
              <span style={{ fontSize: "14px", fontWeight: 400, color: "rgba(255,255,255,0.55)", marginLeft: "4px" }}>kcal / day</span>
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginBottom: "2px" }}>Maintenance</p>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{profile.tdee.toLocaleString()} kcal</p>
            <p style={{ fontSize: "11px", color: diff < 0 ? "#fca5a5" : diff > 0 ? "#86efac" : "rgba(255,255,255,0.5)", marginTop: "2px" }}>{diffLabel}</p>
          </div>
        </div>

        {/* Calorie bar */}
        <div style={{ marginTop: "14px", height: 4, background: "rgba(255,255,255,0.15)", borderRadius: "99px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min((goals.calories / (profile.tdee + 500)) * 100, 100)}%`,
            background: "#fff",
            borderRadius: "99px",
            transition: "width 0.6s ease",
          }} />
        </div>
      </div>

      {/* Macros grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)" }}>
        {macros.map(m => (
          <div key={m.label} style={{ background: "#fff", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</span>
              {m.pct !== null && (
                <span style={{ fontSize: "11px", background: m.bg, color: m.color, padding: "1px 7px", borderRadius: "99px", fontWeight: 600 }}>{m.pct}%</span>
              )}
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 600, color: m.color, lineHeight: 1 }}>
              {m.value}<span style={{ fontSize: "12px", fontWeight: 400, color: "var(--ink-4)", marginLeft: "2px" }}>{m.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Footer stats */}
      <div style={{ padding: "12px 18px", background: "var(--bg)", display: "flex", gap: "20px" }}>
        {[
          { label: "Your weight", value: `${lbs} lbs` },
          { label: "BMI", value: `${bmi}` },
          { label: "Sugar limit", value: `${goals.sugar}g` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontSize: "10px", color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────────────────
function MunchBubble({ text, delay = 0 }: { text: string; delay?: number }) {
  const [visible, setVisible] = useState(delay === 0);
  const [typing, setTyping] = useState(delay > 0);

  useEffect(() => {
    if (delay === 0) return;
    const t1 = setTimeout(() => setTyping(true), delay);
    const t2 = setTimeout(() => { setTyping(false); setVisible(true); }, delay + 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay]);

  if (!visible && !typing) return null;

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", animation: "fadeUp 0.25s ease" }}>
      {/* Avatar */}
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
        🥗
      </div>
      <div style={{ background: "var(--surface)", borderRadius: "18px 18px 18px 4px", padding: "10px 14px", boxShadow: "var(--shadow-sm)", maxWidth: "85%" }}>
        {typing ? (
          <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "2px 0" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ink-4)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "14px", lineHeight: 1.55, color: "var(--ink)", whiteSpace: "pre-wrap" }}>{text}</p>
        )}
      </div>
    </div>
  );
}

function Chip({ label, icon, onClick, selected }: { label: string; icon?: string; onClick: () => void; selected?: boolean }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 16px",
      background: selected ? "var(--forest)" : "var(--surface)",
      border: `1.5px solid ${selected ? "var(--forest)" : "var(--border-strong)"}`,
      borderRadius: "99px",
      fontSize: "13px", fontWeight: 500,
      color: selected ? "#fff" : "var(--forest)",
      cursor: "pointer", transition: "all 0.15s",
      display: "flex", alignItems: "center", gap: "6px",
      boxShadow: "var(--shadow-sm)",
    }}
      onMouseEnter={e => { if (!selected) { (e.currentTarget as HTMLElement).style.background = "var(--forest-pale)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; } }}
      onMouseLeave={e => { if (!selected) { (e.currentTarget as HTMLElement).style.background = "var(--surface)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; } }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

// ── Setup chat stages ─────────────────────────────────────────────────────────
type Stage =
  | "intro"
  | "goal_summary"
  | "ask_aggressiveness"
  | "show_plan"
  | "ask_confirm"
  | "confirmed";

// ── SetupChat ─────────────────────────────────────────────────────────────────
export default function SetupChat({ profile, onConfirm }: Props) {
  const [stage, setStage] = useState<Stage>("intro");
  const [aggressiveness, setAggressiveness] = useState<Aggressiveness | null>(null);
  const [goals, setGoals] = useState<NutritionGoals | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lbs = Math.round(profile.weightKg * 2.205);
  const feet = Math.floor(profile.heightCm / 30.48);
  const inches = Math.round((profile.heightCm / 30.48 - feet) * 12);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [stage, goals]);

  // Stage transitions with delays
  useEffect(() => {
    if (stage === "intro") {
      const t = setTimeout(() => setStage("goal_summary"), 2200);
      return () => clearTimeout(t);
    }
    if (stage === "goal_summary") {
      const t = setTimeout(() => setStage("ask_aggressiveness"), 2000);
      return () => clearTimeout(t);
    }
  }, [stage]);

  const handleSelectAggressiveness = (a: Aggressiveness) => {
    setAggressiveness(a);
    const computed = computeGoalsForAggressiveness(profile, profile.tdee, a);
    setGoals(computed);
    setStage("show_plan");
    setTimeout(() => setStage("ask_confirm"), 1200);
  };

  const handleConfirm = () => {
    if (!goals || !aggressiveness) return;
    setStage("confirmed");
    setTimeout(() => onConfirm(goals, aggressiveness), 1600);
  };

  const handleAdjust = () => {
    setAggressiveness(null);
    setGoals(null);
    setStage("ask_aggressiveness");
  };

  const goalText = GOAL_LABELS[profile.goal];
  const goalContext = GOAL_CONTEXT[profile.goal];
  const diets = profile.dietaryPreferences.filter(d => d !== "none");
  const dietNote = diets.length > 0 ? ` I'll also keep your ${diets.join(" and ")} preferences in mind.` : "";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100dvh",
      maxWidth: "430px", margin: "0 auto",
      background: "var(--bg)", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: "10px",
        flexShrink: 0,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
          🥗
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--ink)", lineHeight: 1 }}>Munch</h1>
          <p style={{ fontSize: "11px", color: "var(--forest)", fontWeight: 500 }}>Setting up your plan</p>
        </div>

        {/* Progress dots */}
        <div style={{ marginLeft: "auto", display: "flex", gap: "5px" }}>
          {(["intro", "ask_aggressiveness", "show_plan", "confirmed"] as Stage[]).map((s, i) => {
            const stageOrder = ["intro", "goal_summary", "ask_aggressiveness", "show_plan", "ask_confirm", "confirmed"];
            const currentIdx = stageOrder.indexOf(stage);
            const dotIdx = ["intro", "ask_aggressiveness", "show_plan", "confirmed"].indexOf(s);
            const isActive = currentIdx >= stageOrder.indexOf(["intro", "ask_aggressiveness", "show_plan", "confirmed"][dotIdx]);
            return (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%",
                background: isActive ? "var(--forest)" : "var(--border)",
                transition: "background 0.3s",
              }} />
            );
          })}
        </div>
      </div>

      {/* Messages scroll area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px 16px 8px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Message 1 — always shown */}
        <MunchBubble
          text={`Hey ${profile.name}! 👋 I'm Munch, your personal nutrition assistant. I'm going to build a plan tailored specifically to you — let me pull up your details.`}
        />

        {/* Message 2 — profile summary */}
        {(stage === "goal_summary" || stage === "ask_aggressiveness" || stage === "show_plan" || stage === "ask_confirm" || stage === "confirmed") && (
          <MunchBubble
            delay={0}
            text={`Here's what I've got: you're ${profile.age} years old, ${feet}′${inches}″, ${lbs} lbs, and your main goal is to ${goalText}. ${goalContext}${dietNote}`}
          />
        )}

        {/* Message 3 — ask aggressiveness */}
        {(stage === "ask_aggressiveness" || stage === "show_plan" || stage === "ask_confirm" || stage === "confirmed") && (
          <MunchBubble
            delay={0}
            text="How quickly do you want to work toward your goal? Pick the pace that feels right for your lifestyle:"
          />
        )}

        {/* Aggressiveness selector */}
        {stage === "ask_aggressiveness" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "38px", animation: "fadeUp 0.3s ease" }}>
            {AGGRESSIVENESS_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSelectAggressiveness(opt.id)}
                style={{
                  background: "var(--surface)",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--r)",
                  padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: "12px",
                  cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                  boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; (e.currentTarget as HTMLElement).style.background = "var(--forest-pale)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--surface)"; }}
              >
                <span style={{ fontSize: "22px" }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{opt.label}</span>
                    {opt.id === "moderate" && (
                      <span style={{ fontSize: "10px", background: "var(--forest)", color: "#fff", padding: "1px 7px", borderRadius: "99px", fontWeight: 600 }}>
                        Recommended
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--ink-4)" }}>{opt.detail[profile.goal]}</span>
                </div>
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                  <path d="M1 1l5 5-5 5" stroke="var(--ink-4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* User choice bubble */}
        {aggressiveness && (stage === "show_plan" || stage === "ask_confirm" || stage === "confirmed") && (
          <div style={{ display: "flex", justifyContent: "flex-end", animation: "fadeUp 0.2s ease" }}>
            <div style={{ background: "var(--forest)", borderRadius: "18px 18px 4px 18px", padding: "10px 14px" }}>
              <p style={{ fontSize: "14px", color: "#fff" }}>
                {AGGRESSIVENESS_OPTIONS.find(o => o.id === aggressiveness)?.icon}{" "}
                {AGGRESSIVENESS_OPTIONS.find(o => o.id === aggressiveness)?.label}
              </p>
            </div>
          </div>
        )}

        {/* Plan reveal message */}
        {(stage === "show_plan" || stage === "ask_confirm" || stage === "confirmed") && goals && (
          <MunchBubble delay={0} text="Perfect. Here's your personalized nutrition plan:" />
        )}

        {/* The plan card */}
        {(stage === "show_plan" || stage === "ask_confirm" || stage === "confirmed") && goals && aggressiveness && (
          <div style={{ paddingLeft: "38px", animation: "fadeUp 0.3s ease" }}>
            <MacroPlanCard goals={goals} aggressiveness={aggressiveness} profile={profile} />
          </div>
        )}

        {/* Confirm message */}
        {(stage === "ask_confirm" || stage === "confirmed") && (
          <MunchBubble
            delay={0}
            text="This is your daily target. I'll track everything against these numbers and give you advice based on your progress. Does this plan look good to you?"
          />
        )}

        {/* Confirm / adjust chips */}
        {stage === "ask_confirm" && (
          <div style={{ display: "flex", gap: "8px", paddingLeft: "38px", flexWrap: "wrap", animation: "fadeUp 0.2s ease" }}>
            <Chip label="Looks great, let's go!" icon="✅" onClick={handleConfirm} />
            <Chip label="Change the pace" icon="↩" onClick={handleAdjust} />
          </div>
        )}

        {/* Confirmed message */}
        {stage === "confirmed" && (
          <MunchBubble
            delay={0}
            text={`Let's do this, ${profile.name}! 🎉 Your plan is set. Log your first meal whenever you're ready — I'm here to help every step of the way.`}
          />
        )}

        <div style={{ height: "16px" }} />
      </div>
    </div>
  );
}

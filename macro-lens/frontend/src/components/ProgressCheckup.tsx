import { useState, useRef, useEffect } from "react";
import { UserProfile, NutritionGoals, Aggressiveness, Goal } from "../types";
import { computeGoalsForAggressiveness, computeTDEE } from "../useProfile";

interface Props {
  profile: UserProfile;
  currentWeightLbs: number | null;
  onComplete: (newWeightLbs: number, newGoals: NutritionGoals, aggressiveness: Aggressiveness) => void;
  onDismiss: () => void;
}

type Stage =
  | "greeting"
  | "ask_weight"
  | "weight_received"
  | "ask_energy"
  | "ask_sleep"
  | "ask_hunger"
  | "analyzing"
  | "show_recommendation"
  | "ask_confirm"
  | "confirmed";

interface HealthAnswers {
  weight: number | null;
  energy: "good" | "low" | "great" | null;
  sleep: "good" | "poor" | "great" | null;
  hunger: "satisfied" | "hungry" | "not_hungry" | null;
}

const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: "lose weight",
  build_muscle: "build muscle",
  improve_fitness: "improve your fitness",
  eat_healthier: "eat healthier",
  maintain: "maintain your weight",
};

function buildRecommendation(
  profile: UserProfile,
  answers: HealthAnswers,
): { aggressiveness: Aggressiveness; goals: NutritionGoals; reasoning: string; changes: string[] } {
  const currentLbs = answers.weight ?? (profile.weightKg * 2.205);
  const newWeightKg = currentLbs / 2.205;
  const startLbs = Math.round(profile.weightKg * 2.205);
  const weightChange = currentLbs - startLbs;
  const goal = profile.goal;
  let aggressiveness: Aggressiveness = profile.aggressiveness ?? "moderate";
  const changes: string[] = [];
  let reasoning = "";

  // Score wellbeing signals
  const energyScore = { great: 2, good: 1, low: -2 }[answers.energy ?? "good"];
  const sleepScore = { great: 2, good: 1, poor: -2 }[answers.sleep ?? "good"];
  const hungerScore = { not_hungry: 1, satisfied: 1, hungry: -2 }[answers.hunger ?? "satisfied"];
  const wellbeingScore = energyScore + sleepScore + hungerScore;

  if (goal === "lose_weight") {
    if (weightChange < -2) {
      // Good progress — check if they can sustain it
      if (wellbeingScore < 0) {
        aggressiveness = "conservative";
        reasoning = `You've lost ${Math.abs(weightChange).toFixed(1)} lbs — great progress! But the fatigue and hunger signals suggest your current deficit might be too aggressive. I'm easing it back to protect your energy levels.`;
        changes.push("Reduced calorie deficit for better sustainability", "Slightly increased calories to support energy");
      } else {
        aggressiveness = profile.aggressiveness ?? "moderate";
        reasoning = `You've lost ${Math.abs(weightChange).toFixed(1)} lbs and you're feeling great — that's the sweet spot. I'm keeping your current plan.`;
      }
    } else if (weightChange > 1) {
      if (wellbeingScore >= 0) {
        aggressiveness = "aggressive";
        reasoning = `Your weight has increased slightly. You're feeling good, so let's tighten up the deficit to get things moving.`;
        changes.push("Increased calorie deficit", "Raised protein target to preserve muscle");
      } else {
        aggressiveness = "moderate";
        reasoning = `Your weight has nudged up a bit, and your energy is low — that can actually stall weight loss. Let's reset to a balanced approach and prioritize consistency.`;
        changes.push("Reset to balanced deficit", "Adjusted macros for better energy");
      }
    } else {
      reasoning = `Your weight is holding steady. ${wellbeingScore < 0 ? "Given your energy concerns, let's make sure the plan is sustainable." : "You're making steady progress — let's keep the momentum."}`;
      if (wellbeingScore < 0) { aggressiveness = "conservative"; changes.push("Eased deficit slightly for sustainability"); }
    }
  } else if (goal === "build_muscle") {
    if (weightChange > 0 && wellbeingScore >= 0) {
      reasoning = `You're up ${weightChange.toFixed(1)} lbs and feeling strong. The bulk is working — I'm keeping your current plan.`;
    } else if (wellbeingScore < 0) {
      aggressiveness = "moderate";
      reasoning = `Your fatigue and sleep signals suggest recovery is an issue. Let's dial back the surplus slightly and prioritize protein for better recovery.`;
      changes.push("Adjusted surplus for better recovery", "Increased protein allocation");
    } else {
      aggressiveness = "moderate";
      reasoning = `Progress is looking solid. I've recalculated your targets based on your updated weight.`;
    }
  } else if (goal === "improve_fitness" || goal === "eat_healthier") {
    if (wellbeingScore < 0) {
      reasoning = `Your energy and sleep aren't where we want them. Let's make sure you're eating enough to fuel your activity and feel your best.`;
      changes.push("Optimized calorie target for energy", "Adjusted carb timing for performance");
    } else {
      reasoning = `You're doing well! I've updated your targets for your current weight. ${wellbeingScore > 1 ? "Great energy levels — keep it up!" : ""}`;
    }
  } else { // maintain
    if (Math.abs(weightChange) > 3) {
      reasoning = `Your weight has shifted ${Math.abs(weightChange).toFixed(1)} lbs from your starting point. Let's recalibrate your maintenance calories for your current weight.`;
      changes.push("Recalculated maintenance calories for new weight");
    } else {
      reasoning = `Your weight is stable — that's exactly what we're aiming for. I've refreshed your targets.`;
    }
  }

  // Always recalculate based on new weight
  const updatedProfile = { ...profile, weightKg: newWeightKg };
  const newTDEE = computeTDEE(updatedProfile);
  const goals = computeGoalsForAggressiveness(updatedProfile, newTDEE, aggressiveness);
  if (changes.length === 0) changes.push(`Recalculated targets for your current weight of ${Math.round(currentLbs)} lbs`);

  return { aggressiveness, goals, reasoning, changes };
}

function MunchBubble({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", animation: "fadeUp 0.25s ease" }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>🥗</div>
      <div style={{ background: "var(--surface)", borderRadius: "18px 18px 18px 4px", padding: "11px 14px", boxShadow: "var(--shadow-sm)", maxWidth: "85%" }}>
        <p style={{ fontSize: "14px", lineHeight: 1.55, color: "var(--ink)", whiteSpace: "pre-wrap" }}>{text}</p>
      </div>
    </div>
  );
}

function OptionChips({ options, onSelect }: { options: { id: string; label: string; emoji: string }[]; onSelect: (id: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "38px", animation: "fadeUp 0.2s ease" }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onSelect(o.id)} style={{
          background: "var(--surface)", border: "1.5px solid var(--border-mid)",
          borderRadius: "var(--r)", padding: "12px 16px",
          display: "flex", alignItems: "center", gap: "12px",
          textAlign: "left", cursor: "pointer", transition: "all 0.15s",
          boxShadow: "var(--shadow-xs)",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; (e.currentTarget as HTMLElement).style.background = "var(--forest-xpale)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)"; (e.currentTarget as HTMLElement).style.background = "var(--surface)"; }}
        >
          <span style={{ fontSize: "20px" }}>{o.emoji}</span>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--ink)" }}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", animation: "fadeUp 0.2s ease" }}>
      <div style={{ background: "var(--forest)", borderRadius: "18px 18px 4px 18px", padding: "10px 14px", maxWidth: "75%" }}>
        <p style={{ fontSize: "14px", color: "#fff", lineHeight: 1.5 }}>{text}</p>
      </div>
    </div>
  );
}

function MacroSummary({ goals, aggressiveness }: { goals: NutritionGoals; aggressiveness: Aggressiveness }) {
  const icons: Record<Aggressiveness, string> = { conservative: "🐢", moderate: "⚡", aggressive: "🔥" };
  const labels: Record<Aggressiveness, string> = { conservative: "Steady", moderate: "Balanced", aggressive: "Intense" };

  return (
    <div style={{ paddingLeft: "38px", animation: "popIn 0.25s ease" }}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
        <div style={{ background: "linear-gradient(135deg, var(--forest) 0%, var(--forest-mid) 100%)", padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Updated target</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                {goals.calories.toLocaleString()}
                <span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.5)", marginLeft: "4px" }}>kcal/day</span>
              </p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: "var(--r-full)", padding: "5px 12px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>{icons[aggressiveness]} {labels[aggressiveness]}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px", background: "var(--border)" }}>
          {[
            { label: "Protein", value: goals.protein, color: "var(--green)" },
            { label: "Carbs", value: goals.carbohydrates, color: "var(--amber-light)" },
            { label: "Fat", value: goals.fat, color: "var(--blue)" },
            { label: "Fiber", value: goals.fiber, color: "var(--purple)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "var(--surface)", padding: "12px 6px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color, lineHeight: 1, marginBottom: "2px" }}>{value}<span style={{ fontSize: "10px", fontWeight: 400, color: "var(--ink-4)" }}>g</span></p>
              <p style={{ fontSize: "9px", fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProgressCheckup({ profile, currentWeightLbs, onComplete, onDismiss }: Props) {
  const [stage, setStage] = useState<Stage>("greeting");
  const [answers, setAnswers] = useState<HealthAnswers>({ weight: null, energy: null, sleep: null, hunger: null });
  const [weightInput, setWeightInput] = useState(String(Math.round(currentWeightLbs ?? profile.weightKg * 2.205)));
  const [recommendation, setRecommendation] = useState<ReturnType<typeof buildRecommendation> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }, [stage]);

  useEffect(() => {
    const t = setTimeout(() => setStage("ask_weight"), 1800);
    return () => clearTimeout(t);
  }, []);

  const handleWeightSubmit = () => {
    const lbs = parseFloat(weightInput);
    if (isNaN(lbs) || lbs < 50 || lbs > 700) return;
    setAnswers(a => ({ ...a, weight: lbs }));
    setTimeout(() => setStage("weight_received"), 200);
    setTimeout(() => setStage("ask_energy"), 1400);
  };

  const handleEnergy = (id: string) => {
    setAnswers(a => ({ ...a, energy: id as HealthAnswers["energy"] }));
    setTimeout(() => setStage("ask_sleep"), 400);
  };

  const handleSleep = (id: string) => {
    setAnswers(a => ({ ...a, sleep: id as HealthAnswers["sleep"] }));
    setTimeout(() => setStage("ask_hunger"), 400);
  };

  const handleHunger = (id: string) => {
    const updated = { ...answers, hunger: id as HealthAnswers["hunger"] };
    setAnswers(updated);
    setStage("analyzing");
    setTimeout(() => {
      const rec = buildRecommendation(profile, updated);
      setRecommendation(rec);
      setStage("show_recommendation");
      setTimeout(() => setStage("ask_confirm"), 1200);
    }, 1800);
  };

  const handleConfirm = () => {
    if (!recommendation || !answers.weight) return;
    setStage("confirmed");
    setTimeout(() => onComplete(answers.weight!, recommendation.goals, recommendation.aggressiveness), 1500);
  };

  const goalLabel = GOAL_LABELS[profile.goal];
  const weightDiff = answers.weight ? answers.weight - Math.round(profile.weightKg * 2.205) : 0;
  const weightChangeLabel = weightDiff === 0 ? "same weight" : `${Math.abs(weightDiff).toFixed(1)} lbs ${weightDiff > 0 ? "up" : "down"}`;

  const energyLabels: Record<string, string> = { great: "💪 Feeling great", good: "😊 Pretty good", low: "😴 Low energy / fatigue" };
  const sleepLabels: Record<string, string> = { great: "😴 Sleeping great", good: "👍 Decent sleep", poor: "😩 Poor sleep" };
  const hungerLabels: Record<string, string> = { not_hungry: "😌 Not very hungry", satisfied: "👌 Satisfied", hungry: "😤 Often hungry" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", flexDirection: "column",
      background: "var(--bg)",
      animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
      maxWidth: "430px", margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, paddingTop: "calc(14px + env(safe-area-inset-top, 0px))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🥗</div>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 600, color: "var(--ink)", lineHeight: 1 }}>Progress Check-in</p>
            <p style={{ fontSize: "11px", color: "var(--forest)", fontWeight: 500 }}>with Munch</p>
          </div>
        </div>
        <button onClick={onDismiss} style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "var(--ink-3)", cursor: "pointer" }}>×</button>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px 16px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Greeting */}
        <MunchBubble text={`Hey ${profile.name}! Time for your progress check-in 💪 I'm going to ask you a few quick questions about how you've been feeling, then we'll update your plan to keep you on track to ${goalLabel}.`} />

        {/* Ask weight */}
        {["ask_weight","weight_received","ask_energy","ask_sleep","ask_hunger","analyzing","show_recommendation","ask_confirm","confirmed"].includes(stage) && (
          <MunchBubble text={`First — what's your current weight? ${currentWeightLbs ? `Last time it was ${Math.round(currentWeightLbs)} lbs.` : ""}`} />
        )}

        {stage === "ask_weight" && (
          <div style={{ paddingLeft: "38px", animation: "fadeUp 0.2s ease" }}>
            <div style={{ background: "var(--surface)", borderRadius: "var(--r)", border: "1.5px solid var(--border-mid)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button onClick={() => setWeightInput(w => String(Math.max(50, parseFloat(w) - 1)))} style={{ width: 48, height: 52, fontSize: "20px", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>−</button>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <input
                    value={weightInput}
                    onChange={e => setWeightInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleWeightSubmit(); }}
                    style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--ink)", textAlign: "center", width: "100%", background: "transparent" }}
                  />
                </div>
                <button onClick={() => setWeightInput(w => String(parseFloat(w) + 1))} style={{ width: 48, height: 52, fontSize: "20px", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>+</button>
              </div>
              <div style={{ background: "var(--bg)", padding: "8px 16px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: "12px", color: "var(--ink-4)" }}>lbs</span>
              </div>
            </div>
            <button onClick={handleWeightSubmit} style={{ width: "100%", marginTop: "10px", padding: "13px", background: "var(--forest)", border: "none", borderRadius: "var(--r)", fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>
              That's my weight →
            </button>
          </div>
        )}

        {/* Weight received */}
        {["weight_received","ask_energy","ask_sleep","ask_hunger","analyzing","show_recommendation","ask_confirm","confirmed"].includes(stage) && answers.weight && (
          <UserBubble text={`${Math.round(answers.weight)} lbs`} />
        )}

        {["ask_energy","ask_sleep","ask_hunger","analyzing","show_recommendation","ask_confirm","confirmed"].includes(stage) && answers.weight && (
          <MunchBubble text={`Got it — ${weightChangeLabel} from when you started. ${Math.abs(weightDiff) > 0 ? (weightDiff < 0 && profile.goal === "lose_weight" ? "That's progress! 🎉" : weightDiff > 0 && profile.goal === "build_muscle" ? "Solid gains! 💪" : "Let's factor that into your plan.") : "Weight is holding steady."}\n\nHow have your energy levels been lately?`} />
        )}

        {stage === "ask_energy" && (
          <OptionChips
            options={[{ id: "great", label: "Feeling great", emoji: "💪" }, { id: "good", label: "Pretty good", emoji: "😊" }, { id: "low", label: "Low energy / fatigue", emoji: "😴" }]}
            onSelect={handleEnergy}
          />
        )}

        {["ask_sleep","ask_hunger","analyzing","show_recommendation","ask_confirm","confirmed"].includes(stage) && answers.energy && (
          <>
            <UserBubble text={energyLabels[answers.energy] ?? ""} />
            <MunchBubble text="And how's your sleep been?" />
          </>
        )}

        {stage === "ask_sleep" && (
          <OptionChips
            options={[{ id: "great", label: "Sleeping great", emoji: "😴" }, { id: "good", label: "Decent sleep", emoji: "👍" }, { id: "poor", label: "Poor sleep / restless", emoji: "😩" }]}
            onSelect={handleSleep}
          />
        )}

        {["ask_hunger","analyzing","show_recommendation","ask_confirm","confirmed"].includes(stage) && answers.sleep && (
          <>
            <UserBubble text={sleepLabels[answers.sleep] ?? ""} />
            <MunchBubble text="Last one — how's your hunger and appetite been on this plan?" />
          </>
        )}

        {stage === "ask_hunger" && (
          <OptionChips
            options={[{ id: "not_hungry", label: "Not very hungry", emoji: "😌" }, { id: "satisfied", label: "Satisfied — feels right", emoji: "👌" }, { id: "hungry", label: "Often hungry or unsatisfied", emoji: "😤" }]}
            onSelect={handleHunger}
          />
        )}

        {["analyzing","show_recommendation","ask_confirm","confirmed"].includes(stage) && answers.hunger && (
          <UserBubble text={hungerLabels[answers.hunger] ?? ""} />
        )}

        {stage === "analyzing" && (
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", animation: "fadeUp 0.2s ease" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🥗</div>
            <div style={{ background: "var(--surface)", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ink-4)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                <span style={{ marginLeft: "8px", fontSize: "13px", color: "var(--ink-3)" }}>Analyzing your progress…</span>
              </div>
            </div>
          </div>
        )}

        {["show_recommendation","ask_confirm","confirmed"].includes(stage) && recommendation && (
          <MunchBubble text={`Okay, I've looked at everything. Here's what I'm thinking:\n\n${recommendation.reasoning}`} />
        )}

        {["show_recommendation","ask_confirm","confirmed"].includes(stage) && recommendation && (
          <MacroSummary goals={recommendation.goals} aggressiveness={recommendation.aggressiveness} />
        )}

        {["show_recommendation","ask_confirm","confirmed"].includes(stage) && recommendation && recommendation.changes.length > 0 && (
          <div style={{ paddingLeft: "38px", animation: "fadeUp 0.2s ease" }}>
            {recommendation.changes.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "6px" }}>
                <span style={{ fontSize: "14px", flexShrink: 0 }}>→</span>
                <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>{c}</p>
              </div>
            ))}
          </div>
        )}

        {stage === "ask_confirm" && (
          <>
            <MunchBubble text="Does this updated plan work for you?" />
            <div style={{ display: "flex", gap: "8px", paddingLeft: "38px", animation: "fadeUp 0.2s ease" }}>
              <button onClick={handleConfirm} style={{ flex: 2, padding: "12px 16px", background: "var(--forest)", border: "none", borderRadius: "var(--r)", fontSize: "13px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                ✅ Let's do it!
              </button>
              <button onClick={onDismiss} style={{ flex: 1, padding: "12px", background: "var(--surface)", border: "1.5px solid var(--border-mid)", borderRadius: "var(--r)", fontSize: "13px", fontWeight: 500, color: "var(--ink-3)", cursor: "pointer" }}>
                Keep current
              </button>
            </div>
          </>
        )}

        {stage === "confirmed" && (
          <MunchBubble text={`Plan updated! 🎉 You've got this, ${profile.name}. Keep logging your meals and I'll keep you on track.`} />
        )}

        <div style={{ height: "16px" }} />
      </div>
    </div>
  );
}

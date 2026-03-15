import { useState, useCallback } from "react";
import {
  UserProfile, Sex, ActivityLevel, Goal, DietaryPreference,
} from "../types";
import { computeGoals, computeTDEE } from "../useProfile";

interface Props {
  onComplete: (profile: UserProfile) => void;
}

// ── Step definitions ──────────────────────────────────────────────────────────
const TOTAL_STEPS = 6;

// ── Option configs ────────────────────────────────────────────────────────────
const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string; desc: string; icon: string }[] = [
  { id: "sedentary",   label: "Sedentary",     desc: "Desk job, little exercise",      icon: "🪑" },
  { id: "light",       label: "Lightly active", desc: "1–3 days/week",                 icon: "🚶" },
  { id: "moderate",    label: "Moderately active", desc: "3–5 days/week",              icon: "🏃" },
  { id: "active",      label: "Very active",   desc: "6–7 days/week",                  icon: "💪" },
  { id: "very_active", label: "Athlete",       desc: "Intense daily training",         icon: "🏅" },
];

const GOAL_OPTIONS: { id: Goal; label: string; desc: string; icon: string }[] = [
  { id: "lose_weight",      label: "Lose weight",       desc: "Reduce body fat sustainably",     icon: "⚖️" },
  { id: "build_muscle",     label: "Build muscle",      desc: "Increase lean mass",              icon: "💪" },
  { id: "improve_fitness",  label: "Improve fitness",   desc: "Boost energy & performance",      icon: "🏃" },
  { id: "eat_healthier",    label: "Eat healthier",     desc: "Better food quality & habits",    icon: "🥗" },
  { id: "maintain",         label: "Maintain weight",   desc: "Stay where I am",                 icon: "✅" },
];

const DIET_OPTIONS: { id: DietaryPreference; label: string; icon: string }[] = [
  { id: "none",         label: "No restrictions", icon: "🍽️" },
  { id: "vegetarian",  label: "Vegetarian",       icon: "🥦" },
  { id: "vegan",       label: "Vegan",            icon: "🌱" },
  { id: "pescatarian", label: "Pescatarian",      icon: "🐟" },
  { id: "keto",        label: "Keto",             icon: "🥑" },
  { id: "paleo",       label: "Paleo",            icon: "🥩" },
  { id: "gluten_free", label: "Gluten-free",      icon: "🌾" },
  { id: "dairy_free",  label: "Dairy-free",       icon: "🥛" },
];

// ── Shared UI primitives ──────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: "4px", padding: "0 24px" }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: "99px",
          background: i < step ? "var(--forest)" : "var(--border)",
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px 24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {children}
    </div>
  );
}

function StepHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.2, marginBottom: sub ? "8px" : "0" }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: "14px", color: "var(--ink-3)", lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function SelectCard({
  selected, onClick, icon, label, desc,
}: {
  selected: boolean; onClick: () => void;
  icon: string; label: string; desc?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "14px 16px",
        background: selected ? "var(--forest-pale)" : "var(--surface)",
        border: `1.5px solid ${selected ? "var(--forest)" : "var(--border)"}`,
        borderRadius: "var(--r)",
        display: "flex", alignItems: "center", gap: "12px",
        textAlign: "left", cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <span style={{ fontSize: "22px", flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: selected ? "var(--forest)" : "var(--ink)", lineHeight: 1.2 }}>
          {label}
        </p>
        {desc && <p style={{ fontSize: "12px", color: "var(--ink-4)", marginTop: "2px" }}>{desc}</p>}
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected ? "var(--forest)" : "var(--border)"}`,
        background: selected ? "var(--forest)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  );
}

function NumberInput({
  label, value, onChange, unit, min, max, step = 1,
}: {
  label: string; value: number; onChange: (v: number) => void;
  unit: string; min: number; max: number; step?: number;
}) {
  return (
    <div>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          style={{ width: 48, height: 52, fontSize: "20px", color: "var(--ink-3)", flexShrink: 0, transition: "background 0.1s", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >−</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 600, color: "var(--ink)" }}>{value}</span>
          <span style={{ fontSize: "13px", color: "var(--ink-4)", marginLeft: "4px" }}>{unit}</span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          style={{ width: 48, height: 52, fontSize: "20px", color: "var(--ink-3)", flexShrink: 0, transition: "background 0.1s", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >+</button>
      </div>
    </div>
  );
}

function ContinueButton({ onClick, disabled, label = "Continue" }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "15px",
        background: disabled ? "var(--border)" : "var(--forest)",
        border: "none", borderRadius: "var(--r)",
        fontSize: "15px", fontWeight: 600,
        color: disabled ? "var(--ink-4)" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = "var(--forest-mid)"; }}
      onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = "var(--forest)"; }}
    >
      {label}
    </button>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

// Step 1: Welcome
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <StepWrapper>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "20px" }}>
        <div style={{ width: 80, height: 80, borderRadius: "24px", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>
          🥗
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.1, marginBottom: "12px" }}>
            Welcome to<br />Munch
          </h1>
          <p style={{ fontSize: "15px", color: "var(--ink-3)", lineHeight: 1.6, maxWidth: "280px", margin: "0 auto" }}>
            Your personal nutrition assistant. Let's set up your profile so I can give you advice tailored to your goals.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "280px" }}>
          {["Personalized calorie & macro goals", "AI-powered food logging", "Nutrition insights & advice"].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--forest-pale)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="var(--forest)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: "13px", color: "var(--ink-2)" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
      <ContinueButton onClick={onNext} label="Get started" />
    </StepWrapper>
  );
}

// Step 2: Name + basics
function StepBasics({
  name, age, sex, onChange, onNext,
}: {
  name: string; age: number; sex: Sex;
  onChange: (k: string, v: unknown) => void;
  onNext: () => void;
}) {
  return (
    <StepWrapper>
      <StepHeading title="Tell me about yourself" sub="This helps me calculate your personal calorie needs." />

      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
          First name
        </label>
        <input
          value={name}
          onChange={e => onChange("name", e.target.value)}
          placeholder="Your name"
          style={{
            width: "100%", padding: "13px 16px",
            background: "var(--surface)", border: "1.5px solid var(--border)",
            borderRadius: "var(--r)", fontSize: "15px", color: "var(--ink)",
            fontFamily: "var(--font)", outline: "none", transition: "border-color 0.15s",
          }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "var(--forest)"; }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "var(--border)"; }}
        />
      </div>

      <NumberInput label="Age" value={age} onChange={v => onChange("age", v)} unit="yrs" min={13} max={100} />

      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
          Biological sex
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "male" as Sex, label: "Male" },
            { id: "female" as Sex, label: "Female" },
            { id: "prefer_not" as Sex, label: "Prefer not to say" },
          ].map(o => (
            <button key={o.id} onClick={() => onChange("sex", o.id)} style={{
              flex: 1, padding: "12px 8px",
              border: `1.5px solid ${sex === o.id ? "var(--forest)" : "var(--border)"}`,
              borderRadius: "var(--r)", background: sex === o.id ? "var(--forest-pale)" : "var(--surface)",
              fontSize: "13px", fontWeight: sex === o.id ? 600 : 400,
              color: sex === o.id ? "var(--forest)" : "var(--ink-3)", cursor: "pointer", transition: "all 0.15s",
            }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <ContinueButton onClick={onNext} disabled={!name.trim()} />
    </StepWrapper>
  );
}

// Step 3: Height + weight
function StepBody({
  heightCm, weightKg, onChange, onNext,
}: {
  heightCm: number; weightKg: number;
  onChange: (k: string, v: number) => void;
  onNext: () => void;
}) {
  const feet = Math.floor(heightCm / 30.48);
  const inches = Math.round((heightCm / 30.48 - feet) * 12);
  const lbs = Math.round(weightKg * 2.205);

  return (
    <StepWrapper>
      <StepHeading title="Height & weight" sub="Used to calculate your basal metabolic rate and personalized goals." />

      {/* Height */}
      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
          Height
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", display: "flex", alignItems: "center", overflow: "hidden" }}>
            <button onClick={() => onChange("heightCm", Math.max(120, heightCm - 1))} style={{ width: 44, height: 52, fontSize: "18px", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 600, color: "var(--ink)" }}>{feet}′{inches}″</span>
            </div>
            <button onClick={() => onChange("heightCm", Math.min(250, heightCm + 1))} style={{ width: 44, height: 52, fontSize: "18px", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "0 14px", display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--ink-4)" }}>{heightCm} cm</span>
          </div>
        </div>
      </div>

      {/* Weight */}
      <div>
        <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
          Weight
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", display: "flex", alignItems: "center", overflow: "hidden" }}>
            <button onClick={() => onChange("weightKg", Math.max(30, +(weightKg - 0.5).toFixed(1)))} style={{ width: 44, height: 52, fontSize: "18px", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 600, color: "var(--ink)" }}>{lbs}</span>
              <span style={{ fontSize: "13px", color: "var(--ink-4)", marginLeft: "4px" }}>lbs</span>
            </div>
            <button onClick={() => onChange("weightKg", Math.min(300, +(weightKg + 0.5).toFixed(1)))} style={{ width: 44, height: 52, fontSize: "18px", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "0 14px", display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--ink-4)" }}>{weightKg} kg</span>
          </div>
        </div>
      </div>

      <ContinueButton onClick={onNext} />
    </StepWrapper>
  );
}

// Step 4: Activity
function StepActivity({
  value, onChange, onNext,
}: {
  value: ActivityLevel; onChange: (v: ActivityLevel) => void; onNext: () => void;
}) {
  return (
    <StepWrapper>
      <StepHeading title="How active are you?" sub="On a typical week, not counting any fitness goals." />
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {ACTIVITY_OPTIONS.map(o => (
          <SelectCard key={o.id} selected={value === o.id} onClick={() => onChange(o.id)} icon={o.icon} label={o.label} desc={o.desc} />
        ))}
      </div>
      <ContinueButton onClick={onNext} />
    </StepWrapper>
  );
}

// Step 5: Goal
function StepGoal({
  value, onChange, onNext,
}: {
  value: Goal; onChange: (v: Goal) => void; onNext: () => void;
}) {
  return (
    <StepWrapper>
      <StepHeading title="What's your main goal?" sub="This shapes your personalized calorie and macro targets." />
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {GOAL_OPTIONS.map(o => (
          <SelectCard key={o.id} selected={value === o.id} onClick={() => onChange(o.id)} icon={o.icon} label={o.label} desc={o.desc} />
        ))}
      </div>
      <ContinueButton onClick={onNext} />
    </StepWrapper>
  );
}

// Step 6: Dietary preferences
function StepDiet({
  value, onChange, onNext,
}: {
  value: DietaryPreference[]; onChange: (v: DietaryPreference[]) => void; onNext: () => void;
}) {
  const toggle = (id: DietaryPreference) => {
    if (id === "none") { onChange(["none"]); return; }
    const without = value.filter(v => v !== "none");
    if (without.includes(id)) onChange(without.filter(v => v !== id).length === 0 ? ["none"] : without.filter(v => v !== id));
    else onChange([...without, id]);
  };

  return (
    <StepWrapper>
      <StepHeading title="Any dietary preferences?" sub="Select all that apply. I'll keep these in mind when giving advice." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {DIET_OPTIONS.map(o => {
          const selected = value.includes(o.id);
          return (
            <button key={o.id} onClick={() => toggle(o.id)} style={{
              padding: "12px 10px",
              background: selected ? "var(--forest-pale)" : "var(--surface)",
              border: `1.5px solid ${selected ? "var(--forest)" : "var(--border)"}`,
              borderRadius: "var(--r)", display: "flex", flexDirection: "column",
              alignItems: "flex-start", gap: "6px", cursor: "pointer", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "20px" }}>{o.icon}</span>
              <span style={{ fontSize: "12px", fontWeight: selected ? 600 : 500, color: selected ? "var(--forest)" : "var(--ink-2)" }}>{o.label}</span>
            </button>
          );
        })}
      </div>
      <ContinueButton onClick={onNext} label="Finish setup" />
    </StepWrapper>
  );
}

// ── Onboarding shell ──────────────────────────────────────────────────────────
export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({
    name: "",
    age: 28,
    sex: "prefer_not" as Sex,
    heightCm: 170,
    weightKg: 70,
    activityLevel: "moderate" as ActivityLevel,
    goal: "eat_healthier" as Goal,
    dietaryPreferences: ["none"] as DietaryPreference[],
  });

  const set = useCallback((k: string, v: unknown) => {
    setDraft(prev => ({ ...prev, [k]: v }));
  }, []);

  const next = () => setStep(s => s + 1);

  const finish = () => {
    const base = {
      name: draft.name.trim() || "there",
      age: draft.age,
      sex: draft.sex,
      heightCm: draft.heightCm,
      weightKg: draft.weightKg,
      activityLevel: draft.activityLevel,
      goal: draft.goal,
      dietaryPreferences: draft.dietaryPreferences,
    };
    const tdee = computeTDEE(base);
    const goals = computeGoals(base);
    onComplete({ ...base, goals, tdee, planConfirmed: false });
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100dvh",
      maxWidth: "430px", margin: "0 auto",
      background: "var(--bg)", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 24px 12px", background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: step > 0 ? "12px" : "0" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, color: "var(--forest)" }}>Munch</h1>
          {step > 0 && (
            <span style={{ fontSize: "12px", color: "var(--ink-4)" }}>Step {step} of {TOTAL_STEPS - 1}</span>
          )}
        </div>
        {step > 0 && <ProgressBar step={step} />}
      </div>

      {/* Step content */}
      {step === 0 && <StepWelcome onNext={next} />}
      {step === 1 && <StepBasics name={draft.name} age={draft.age} sex={draft.sex} onChange={set} onNext={next} />}
      {step === 2 && <StepBody heightCm={draft.heightCm} weightKg={draft.weightKg} onChange={(k, v) => set(k, v)} onNext={next} />}
      {step === 3 && <StepActivity value={draft.activityLevel} onChange={v => set("activityLevel", v)} onNext={next} />}
      {step === 4 && <StepGoal value={draft.goal} onChange={v => set("goal", v)} onNext={next} />}
      {step === 5 && <StepDiet value={draft.dietaryPreferences} onChange={v => set("dietaryPreferences", v)} onNext={finish} />}

      {/* Back button */}
      {step > 0 && (
        <div style={{ padding: "8px 24px 20px", flexShrink: 0, background: "var(--bg)" }}>
          <button onClick={() => setStep(s => s - 1)} style={{ fontSize: "13px", color: "var(--ink-4)", display: "flex", alignItems: "center", gap: "4px" }}>
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}

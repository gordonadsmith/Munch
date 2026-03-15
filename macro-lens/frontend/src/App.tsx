import { useState, useEffect } from "react";
import { useDailyLog } from "./useDailyLog";
import { useProfile } from "./useProfile";
import { useProgress } from "./useProgress";
import { useStreak, computeDayScore } from "./useStreak";
import Onboarding from "./components/Onboarding";
import SetupChat from "./components/SetupChat";
import ChatScreen from "./components/ChatScreen";
import DashboardScreen from "./components/DashboardScreen";
import ProgressScreen from "./components/ProgressScreen";
import { NutritionData, MealTime, NutritionGoals, Aggressiveness } from "./types";
import { computeTDEE } from "./useProfile";
import { useRecipes } from "./useRecipes";
import { SavedRecipe } from "./types";

type Tab = "chat" | "dashboard" | "progress";

// ── Tab icons ──────────────────────────────────────────────────────────────────
function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33782 17L2.5 21.5L7 20.6622C8.47087 21.513 10.1786 22 12 22Z"
        stroke={active ? "var(--forest)" : "var(--ink-4)"} strokeWidth="1.75"
        strokeLinecap="round" strokeLinejoin="round"
        fill={active ? "var(--forest-pale)" : "none"}
      />
    </svg>
  );
}

function TodayIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="3"
        stroke={active ? "var(--forest)" : "var(--ink-4)"} strokeWidth="1.75"
        fill={active ? "var(--forest-pale)" : "none"}
      />
      <path d="M8 2v4M16 2v4M3 10h18" stroke={active ? "var(--forest)" : "var(--ink-4)"} strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="8.5" cy="15" r="1.5" fill={active ? "var(--forest)" : "var(--ink-4)"} />
      <circle cx="12" cy="15" r="1.5" fill={active ? "var(--forest)" : "var(--ink-4)"} />
      <circle cx="15.5" cy="15" r="1.5" fill={active ? "var(--forest)" : "var(--ink-4)"} />
    </svg>
  );
}

function ProgressIcon({ active }: { active: boolean }) {
  const c = active ? "var(--forest)" : "var(--ink-4)";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"
        stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; Icon: React.FC<{ active: boolean }> }[] = [
    { id: "chat",      label: "Munch",    Icon: ChatIcon },
    { id: "dashboard", label: "Today",    Icon: TodayIcon },
    { id: "progress",  label: "Progress", Icon: ProgressIcon },
  ];

  const activeIndex = tabs.findIndex(t => t.id === active);

  return (
    <div style={{
      display: "flex", background: "var(--surface)",
      borderTop: "1px solid var(--border)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      flexShrink: 0, position: "relative",
    }}>
      {/* Sliding indicator */}
      <div style={{
        position: "absolute", top: 0,
        left: `${(activeIndex / tabs.length) * 100}%`,
        width: `${100 / tabs.length}%`,
        height: "2px",
        background: "var(--forest)",
        borderRadius: "0 0 2px 2px",
        transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
      }} />

      {tabs.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            flex: 1, padding: "10px 4px 12px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
            background: "transparent", transition: "opacity 0.15s",
            opacity: isActive ? 1 : 0.5,
          }}>
            <Icon active={isActive} />
            <span style={{
              fontSize: "10px", fontWeight: 700,
              color: isActive ? "var(--forest)" : "var(--ink-4)",
              letterSpacing: "0.03em", textTransform: "uppercase",
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const { profile, saveAndSet, confirmPlan, saveAndSet: updateProfile } = useProfile();
  const { log, totals, addEntry, removeEntry } = useDailyLog();
  const { latestWeight, logWeight, logCalorieDay, getRange } = useProgress();
  const { data: streakData, todayScore, recordScore } = useStreak();
  const { recipes, saveRecipe, deleteRecipe } = useRecipes();
  const [tab, setTab] = useState<Tab>("chat");

  // Record daily score whenever entries or totals change
  useEffect(() => {
    if (!profile || log.entries.length === 0) return;
    const score = computeDayScore(log.entries, totals, profile.goals);
    recordScore(score);
  }, [log.entries, totals, profile, recordScore]);

  // Log today's calories when totals change (persists daily data for progress chart)
  useEffect(() => {
    if (!profile || totals.calories === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    logCalorieDay(today, totals.calories, profile.goals.calories);
  }, [totals.calories, profile, logCalorieDay]);

  if (!profile) return <Onboarding onComplete={saveAndSet} />;

  if (!profile.planConfirmed) {
    return (
      <SetupChat
        profile={profile}
        onConfirm={(goals: NutritionGoals, aggressiveness: Aggressiveness) => confirmPlan(goals, aggressiveness)}
      />
    );
  }

  const handleLogFood = (nutrition: NutritionData, mealTime: MealTime, imagePreview?: string) => {
    addEntry(nutrition, "chat", mealTime, imagePreview);
  };

  const handleUpdatePlan = (newWeightLbs: number, goals: NutritionGoals, aggressiveness: Aggressiveness) => {
    const newWeightKg = newWeightLbs / 2.205;
    const newTDEE = computeTDEE({ ...profile, weightKg: newWeightKg });
    updateProfile({
      ...profile,
      weightKg: Math.round(newWeightKg * 10) / 10,
      tdee: newTDEE,
      goals,
      aggressiveness,
    });
  };

  const calorieGoal = profile.goals.calories;
  const over = totals.calories > calorieGoal;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const headerTitles: Record<Tab, string> = {
    chat: `Hi, ${profile.name}`,
    dashboard: "Today",
    progress: "Progress",
  };

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
        padding: "12px var(--page-x) 10px",
        paddingTop: "calc(12px + env(safe-area-inset-top, 0px))",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "19px", fontWeight: 600, color: "var(--forest)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {headerTitles[tab]}
          </h1>
          <p style={{ fontSize: "11px", color: "var(--ink-4)", marginTop: "2px", fontWeight: 400 }}>{today}</p>
        </div>

        {/* Calorie pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: "7px",
          background: over ? "var(--red-pale)" : "var(--forest-xpale)",
          borderRadius: "var(--r-full)", padding: "6px 12px 6px 9px",
          border: `1px solid ${over ? "rgba(220,38,38,0.15)" : "rgba(26,71,49,0.1)"}`,
        }}>
          <span style={{ fontSize: "14px" }}>{over ? "🔥" : "✅"}</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: over ? "var(--red)" : "var(--forest)", lineHeight: 1 }}>
              {totals.calories.toLocaleString()}
            </span>
            <span style={{ fontSize: "11px", color: "var(--ink-4)" }}>/{calorieGoal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Screens */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: tab === "chat" ? "flex" : "none", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <ChatScreen totals={totals} entries={log.entries} onLogFood={handleLogFood} onRemoveEntry={removeEntry} profile={profile} recipes={recipes} onSaveRecipe={saveRecipe} onDeleteRecipe={deleteRecipe} />
        </div>
        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            <DashboardScreen totals={totals} entries={log.entries} onRemove={removeEntry} profile={profile} todayScore={todayScore} streakData={streakData} />
          </div>
        )}
        {tab === "progress" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            <ProgressScreen
              profile={profile}
              latestWeight={latestWeight}
              getRange={getRange}
              onLogWeight={logWeight}
              onUpdatePlan={handleUpdatePlan}
              scores={streakData.scores}
              entries={log.entries}
              currentStreak={streakData.currentStreak}
            />
          </div>
        )}
      </div>

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}

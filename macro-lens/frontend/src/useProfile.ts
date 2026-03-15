import { useState, useCallback } from "react";
import {
  UserProfile, ActivityLevel, Goal, NutritionGoals, Aggressiveness,
} from "./types";

const STORAGE_KEY = "munch-profile";

// ── TDEE / macro calculator ───────────────────────────────────────────────────
const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

export function computeTDEE(profile: Pick<UserProfile, "sex" | "age" | "weightKg" | "heightCm" | "activityLevel">): number {
  let bmr: number;
  if (profile.sex === "female") {
    bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age - 161;
  } else {
    bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + 5;
  }
  return Math.round(bmr * ACTIVITY_MULTIPLIER[profile.activityLevel]);
}

export function computeGoalsForAggressiveness(
  profile: Pick<UserProfile, "sex" | "weightKg" | "goal">,
  tdee: number,
  aggressiveness: Aggressiveness,
): NutritionGoals {
  const goal: Goal = profile.goal;

  // Calorie adjustment by goal + aggressiveness
  const deficitMap: Record<Goal, Record<Aggressiveness, number>> = {
    lose_weight:     { conservative: -250, moderate: -500, aggressive: -750 },
    build_muscle:    { conservative: 150,  moderate: 300,  aggressive: 500  },
    improve_fitness: { conservative: 0,    moderate: 0,    aggressive: 0    },
    eat_healthier:   { conservative: 0,    moderate: 0,    aggressive: 0    },
    maintain:        { conservative: 0,    moderate: 0,    aggressive: 0    },
  };

  const proteinMap: Record<Goal, Record<Aggressiveness, number>> = {
    lose_weight:     { conservative: 1.8, moderate: 2.0, aggressive: 2.2 },
    build_muscle:    { conservative: 1.8, moderate: 2.2, aggressive: 2.5 },
    improve_fitness: { conservative: 1.6, moderate: 1.8, aggressive: 2.0 },
    eat_healthier:   { conservative: 1.4, moderate: 1.6, aggressive: 1.8 },
    maintain:        { conservative: 1.4, moderate: 1.6, aggressive: 1.8 },
  };

  const adjustment = deficitMap[goal]?.[aggressiveness] ?? 0;
  const proteinMultiplier = proteinMap[goal]?.[aggressiveness] ?? 1.6;

  const calories = Math.max(1200, tdee + adjustment);
  const protein = Math.round(profile.weightKg * proteinMultiplier);
  const proteinCals = protein * 4;
  const remaining = calories - proteinCals;
  const carbohydrates = Math.max(50, Math.round((remaining * 0.55) / 4));
  const fat = Math.max(30, Math.round((remaining * 0.30) / 9));
  const fiber = profile.sex === "female" ? 25 : 38;
  const sugar = Math.round(calories * 0.05);

  return { calories, protein, carbohydrates, fat, fiber, sugar };
}

// Default goals (moderate aggressiveness) — used right after onboarding
export function computeGoals(profile: Omit<UserProfile, "goals" | "tdee" | "planConfirmed">): NutritionGoals {
  const tdee = computeTDEE(profile);
  return computeGoalsForAggressiveness(profile, tdee, "moderate");
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch { return null; }
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function clearProfile() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(loadProfile);

  const saveAndSet = useCallback((p: UserProfile) => {
    saveProfile(p);
    setProfile(p);
  }, []);

  const confirmPlan = useCallback((goals: NutritionGoals, aggressiveness: Aggressiveness) => {
    setProfile(prev => {
      if (!prev) return prev;
      const updated: UserProfile = { ...prev, goals, aggressiveness, planConfirmed: true };
      saveProfile(updated);
      return updated;
    });
  }, []);

  const reset = useCallback(() => {
    clearProfile();
    setProfile(null);
  }, []);

  return { profile, saveAndSet, confirmPlan, reset };
}

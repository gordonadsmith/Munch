import { useState, useCallback } from "react";
import { WeightEntry, DailyCalorieEntry, ProgressData, CalorieStatus } from "./types";

const STORAGE_KEY = "munch-progress";

function load(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { weightHistory: [], calorieHistory: [] };
  } catch { return { weightHistory: [], calorieHistory: [] }; }
}

function save(data: ProgressData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function calcCalorieStatus(calories: number, goal: number): CalorieStatus {
  if (calories === 0) return "no_data";
  const diff = calories - goal;
  if (diff > 100) return "over";
  if (diff < -100) return "under";
  return "on_track";
}

export function useProgress() {
  const [data, setData] = useState<ProgressData>(load);

  const logWeight = useCallback((weightLbs: number, note?: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const weightKg = Math.round(weightLbs / 2.205 * 10) / 10;
    const entry: WeightEntry = { date: today, weightLbs, weightKg, note };
    setData(prev => {
      // Replace today's entry if it exists
      const filtered = prev.weightHistory.filter(e => e.date !== today);
      const next: ProgressData = {
        ...prev,
        weightHistory: [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)),
      };
      save(next);
      return next;
    });
  }, []);

  const logCalorieDay = useCallback((date: string, calories: number, goal: number) => {
    if (calories === 0) return; // don't log empty days
    const status = calcCalorieStatus(calories, goal);
    const entry: DailyCalorieEntry = { date, calories, goal, status };
    setData(prev => {
      const filtered = prev.calorieHistory.filter(e => e.date !== date);
      const next: ProgressData = {
        ...prev,
        calorieHistory: [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)),
      };
      save(next);
      return next;
    });
  }, []);

  const latestWeight = data.weightHistory.length > 0 ? data.weightHistory[data.weightHistory.length - 1] : null;

  const getRange = useCallback((days: number): { weight: WeightEntry[]; calories: DailyCalorieEntry[] } => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days + 1);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return {
      weight: data.weightHistory.filter(e => e.date >= cutoffStr),
      calories: data.calorieHistory.filter(e => e.date >= cutoffStr),
    };
  }, [data]);

  return { data, latestWeight, logWeight, logCalorieDay, getRange };
}

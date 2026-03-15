import { useState, useCallback, useMemo } from "react";
import { FoodEntry, DailyLog, DailyTotals, MealTime, NutritionData, InputMode } from "./types";

const TODAY = new Date().toISOString().slice(0, 10);
const STORAGE_KEY = `munch-log-${TODAY}`;

function loadLog(): DailyLog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DailyLog;
  } catch {}
  return { date: TODAY, entries: [] };
}

function saveLog(log: DailyLog) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(log)); } catch {}
}

export function useDailyLog() {
  const [log, setLog] = useState<DailyLog>(loadLog);

  const addEntry = useCallback((
    nutrition: NutritionData,
    inputMode: InputMode,
    mealTime: MealTime,
    imagePreview?: string
  ) => {
    const entry: FoodEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      addedAt: new Date().toISOString(),
      mealTime,
      inputMode,
      imagePreview,
      nutrition,
    };
    setLog(prev => {
      const next = { ...prev, entries: [...prev.entries, entry] };
      saveLog(next);
      return next;
    });
    return entry;
  }, []);

  const removeEntry = useCallback((id: string) => {
    setLog(prev => {
      const next = { ...prev, entries: prev.entries.filter(e => e.id !== id) };
      saveLog(next);
      return next;
    });
  }, []);

  const totals = useMemo((): DailyTotals => {
    return log.entries.reduce((acc, e) => ({
      calories: acc.calories + e.nutrition.calories,
      protein: acc.protein + e.nutrition.protein,
      carbohydrates: acc.carbohydrates + e.nutrition.carbohydrates,
      fat: acc.fat + e.nutrition.fat,
      fiber: acc.fiber + e.nutrition.fiber,
    }), { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });
  }, [log.entries]);

  return { log, totals, addEntry, removeEntry };
}
import { useState, useCallback } from "react";
import { WaterLog } from "./types";

const STORAGE_KEY = "munch-water";
const DEFAULT_GOAL_ML = 2500;
const CUP_ML = 240;

function load(): Record<string, WaterLog> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function save(data: Record<string, WaterLog>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useWater() {
  const [data, setData] = useState<Record<string, WaterLog>>(load);
  const today = new Date().toISOString().slice(0, 10);
  const todayLog = data[today] ?? { date: today, amountMl: 0, goalMl: DEFAULT_GOAL_ML };

  const addWater = useCallback((ml: number) => {
    setData(prev => {
      const existing = prev[today] ?? { date: today, amountMl: 0, goalMl: DEFAULT_GOAL_ML };
      const updated = { ...existing, amountMl: Math.max(0, existing.amountMl + ml) };
      const next = { ...prev, [today]: updated };
      save(next);
      return next;
    });
  }, [today]);

  const addCup = useCallback(() => addWater(CUP_ML), [addWater]);
  const removeCup = useCallback(() => addWater(-CUP_ML), [addWater]);

  const pct = Math.min(todayLog.amountMl / todayLog.goalMl, 1);
  const cupsConsumed = Math.floor(todayLog.amountMl / CUP_ML);
  const cupsGoal = Math.round(todayLog.goalMl / CUP_ML);
  const isOnTrack = todayLog.amountMl >= todayLog.goalMl * 0.75;

  return { todayLog, addCup, removeCup, addWater, pct, cupsConsumed, cupsGoal, isOnTrack, CUP_ML };
}

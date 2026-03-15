import { useState, useCallback } from "react";
import { FoodEntry, DailyTotals, NutritionGoals, DayScore, StreakData } from "./types";

const STORAGE_KEY = "munch-streak";
const STREAK_THRESHOLD = 55; // min score to count toward streak

function load(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { scores: [], currentStreak: 0, longestStreak: 0, lastScoreDate: null };
  } catch { return { scores: [], currentStreak: 0, longestStreak: 0, lastScoreDate: null }; }
}

function save(data: StreakData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function computeDayScore(
  entries: FoodEntry[],
  totals: DailyTotals,
  goals: NutritionGoals,
): DayScore {
  const today = new Date().toISOString().slice(0, 10);

  if (entries.length === 0) {
    return { date: today, score: 0, calorieScore: 0, proteinScore: 0, qualityScore: 0, logScore: 0, entriesLogged: 0 };
  }

  // Calorie adherence (30 pts) — ±100 kcal = full marks
  const calDiff = Math.abs(totals.calories - goals.calories);
  const calScore = calDiff <= 100 ? 30 : calDiff <= 250 ? 22 : calDiff <= 500 ? 12 : 4;

  // Protein adherence (25 pts)
  const proteinPct = totals.protein / Math.max(goals.protein, 1);
  const proteinScore = proteinPct >= 0.9 ? 25 : proteinPct >= 0.75 ? 18 : proteinPct >= 0.55 ? 10 : 4;

  // Food quality (25 pts) — average health rating across all entries
  const qualityAvg = entries.reduce((sum, e) => {
    return sum + (e.nutrition.healthRating === "great" ? 100 : e.nutrition.healthRating === "neutral" ? 55 : 10);
  }, 0) / entries.length;
  const qualityScore = Math.round((qualityAvg / 100) * 25);

  // Logging consistency (20 pts)
  const logScore = entries.length >= 4 ? 20 : entries.length === 3 ? 17 : entries.length === 2 ? 12 : 7;

  const score = Math.min(100, calScore + proteinScore + qualityScore + logScore);

  return { date: today, score, calorieScore: calScore, proteinScore, qualityScore, logScore, entriesLogged: entries.length };
}

function recomputeStreak(scores: DayScore[]): { currentStreak: number; longestStreak: number } {
  if (scores.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const sorted = [...scores].sort((a, b) => b.date.localeCompare(a.date));
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Current streak — must start from today or yesterday
  let currentStreak = 0;
  const latestDate = sorted[0].date;
  if (latestDate !== today && latestDate !== yesterday) {
    currentStreak = 0;
  } else {
    let checkDate = latestDate;
    for (const s of sorted) {
      if (s.date === checkDate && s.score >= STREAK_THRESHOLD) {
        currentStreak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().slice(0, 10);
      } else if (s.date === checkDate) {
        break;
      }
    }
  }

  // Longest streak
  let longest = 0;
  let running = 0;
  const sortedAsc = [...scores].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 0; i < sortedAsc.length; i++) {
    if (sortedAsc[i].score >= STREAK_THRESHOLD) {
      if (i === 0) { running = 1; continue; }
      const prev = new Date(sortedAsc[i - 1].date);
      prev.setDate(prev.getDate() + 1);
      if (prev.toISOString().slice(0, 10) === sortedAsc[i].date) {
        running++;
      } else {
        running = 1;
      }
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }
  longest = Math.max(longest, running, currentStreak);

  return { currentStreak, longestStreak: longest };
}

export function getScoreLabel(score: number): { label: string; color: string; emoji: string } {
  if (score >= 85) return { label: "Excellent",  color: "#15803d", emoji: "🏆" };
  if (score >= 70) return { label: "Great",       color: "#16a34a", emoji: "⭐" };
  if (score >= 55) return { label: "Good",        color: "#2563eb", emoji: "👍" };
  if (score >= 40) return { label: "Fair",        color: "#d97706", emoji: "💪" };
  return               { label: "Keep going",  color: "#dc2626", emoji: "🎯" };
}

export function useStreak() {
  const [data, setData] = useState<StreakData>(load);

  const recordScore = useCallback((dayScore: DayScore) => {
    if (dayScore.entriesLogged === 0) return;
    setData(prev => {
      const filtered = prev.scores.filter(s => s.date !== dayScore.date);
      const scores = [...filtered, dayScore].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 90); // keep 90 days
      const { currentStreak, longestStreak } = recomputeStreak(scores);
      const next: StreakData = { scores, currentStreak, longestStreak, lastScoreDate: dayScore.date };
      save(next);
      return next;
    });
  }, []);

  const todayScore = data.scores.find(s => s.date === new Date().toISOString().slice(0, 10)) ?? null;

  return { data, todayScore, recordScore };
}

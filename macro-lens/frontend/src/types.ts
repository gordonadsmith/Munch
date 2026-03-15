export type HealthRating = "great" | "neutral" | "bad";

export interface NutritionHighlight {
  type: "positive" | "negative";
  text: string;
}

export interface NutritionData {
  foodName: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  confidence: "high" | "medium" | "low";
  notes: string;
  ingredients?: string[];
  healthRating: HealthRating;
  healthSummary: string;
  highlights: NutritionHighlight[];
}

export interface AnalysisResult {
  success: boolean;
  data?: NutritionData;
  error?: string;
}

export type InputMode = "photo" | "describe" | "recipe" | "chat";
export type MealTime = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodEntry {
  id: string;
  addedAt: string;
  mealTime: MealTime;
  inputMode: InputMode;
  imagePreview?: string;
  nutrition: NutritionData;
}

export interface DailyLog {
  date: string;
  entries: FoodEntry[];
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
}

// ── User Profile ──────────────────────────────────────────────────────────────
export type Sex = "male" | "female" | "prefer_not";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose_weight" | "maintain" | "build_muscle" | "improve_fitness" | "eat_healthier";
export type DietaryPreference = "none" | "vegetarian" | "vegan" | "pescatarian" | "keto" | "paleo" | "gluten_free" | "dairy_free";
export type Aggressiveness = "conservative" | "moderate" | "aggressive";

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface UserProfile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  dietaryPreferences: DietaryPreference[];
  goals: NutritionGoals;
  tdee: number;                      // maintenance calories
  aggressiveness?: Aggressiveness;   // set during plan confirmation
  planConfirmed: boolean;            // true after setup chat completes
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export type MessageRole = "user" | "munch";
export interface ChatSuggestion { label: string; value: string; }
export interface FoodLogAction { nutrition: NutritionData; imagePreview?: string; }

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: string;
  suggestions?: ChatSuggestion[];
  foodAction?: FoodLogAction;
  mealSuggestions?: MealSuggestion[];
  isLoading?: boolean;
}

// ── Progress tracking ─────────────────────────────────────────────────────────
export interface WeightEntry {
  date: string;        // YYYY-MM-DD
  weightLbs: number;
  weightKg: number;
  note?: string;
}

export type CalorieStatus = "under" | "on_track" | "over" | "no_data";

export interface DailyCalorieEntry {
  date: string;        // YYYY-MM-DD
  calories: number;
  goal: number;
  status: CalorieStatus;
}

export interface ProgressData {
  weightHistory: WeightEntry[];
  calorieHistory: DailyCalorieEntry[];
}

// ── Scoring & Streaks ─────────────────────────────────────────────────────────
export interface DayScore {
  date: string;
  score: number;          // 0-100
  calorieScore: number;
  proteinScore: number;
  qualityScore: number;
  logScore: number;
  entriesLogged: number;
}

export interface StreakData {
  scores: DayScore[];
  currentStreak: number;
  longestStreak: number;
  lastScoreDate: string | null;
}

// ── Meal Suggestions ──────────────────────────────────────────────────────────
export interface MealSuggestion {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  why: string;            // reason it fits their remaining macros
}

// ── Food Search ───────────────────────────────────────────────────────────────
export interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  imageUrl?: string;
}

// ── Water tracking ────────────────────────────────────────────────────────────
export interface WaterLog {
  date: string;
  amountMl: number;    // total for the day
  goalMl: number;
}

// ── Recipes ───────────────────────────────────────────────────────────────────
export interface RecipeIngredient {
  id: string;
  name: string;
  amount: string;    // e.g. "200g", "1 cup"
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface SavedRecipe {
  id: string;
  name: string;
  emoji: string;
  servings: number;
  createdAt: string;
  ingredients: RecipeIngredient[];
  // Per-serving totals
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  healthRating: HealthRating;
  healthSummary: string;
}

// ── Weekly Report ─────────────────────────────────────────────────────────────
export interface WeeklyReportData {
  weekStart: string;    // YYYY-MM-DD (Monday)
  weekEnd: string;      // YYYY-MM-DD (Sunday)
  daysLogged: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  bestDay: { date: string; score: number } | null;
  hardestDay: { date: string; calories: number; goal: number } | null;
  topFoods: { name: string; count: number }[];
  totalScore: number;
  streak: number;
  summary: string;    // AI-generated
}

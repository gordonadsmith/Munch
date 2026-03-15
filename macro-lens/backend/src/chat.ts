import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NutritionData } from "./gemini";

export interface DailyContext {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  entries: { foodName: string; calories: number; mealTime: string; healthRating: string }[];
}

export interface UserGoals {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface UserProfileContext {
  name: string;
  age: number;
  sex: string;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  goal: string;
  dietaryPreferences: string[];
  goals: UserGoals;
}

export interface ChatResponse {
  text: string;
  suggestions?: string[];
  foodAnalysis?: NutritionData;
  mealSuggestions?: unknown[];
  intent: "conversation" | "food_logged" | "food_image" | "meal_suggestions";
}

const NUTRITION_JSON_FORMAT = `{
  "foodName": "name",
  "servingSize": "portion",
  "calories": 500,
  "protein": 30,
  "carbohydrates": 45,
  "fat": 20,
  "fiber": 5,
  "sugar": 8,
  "confidence": "high",
  "notes": "brief note",
  "ingredients": ["ingredient 1"],
  "healthRating": "REPLACE_WITH_RATING",
  "healthSummary": "One sentence verdict.",
  "highlights": [
    { "type": "positive", "text": "Good source of protein" },
    { "type": "negative", "text": "High in sodium" }
  ]
}`;


function buildSystemPrompt(profile?: UserProfileContext): string {
  const GOAL_LABELS: Record<string, string> = {
    lose_weight: "lose weight",
    build_muscle: "build muscle",
    improve_fitness: "improve overall fitness",
    eat_healthier: "eat healthier",
    maintain: "maintain their current weight",
  };

  const ACTIVITY_LABELS: Record<string, string> = {
    sedentary: "sedentary (desk job, little exercise)",
    light: "lightly active (1-3 days/week)",
    moderate: "moderately active (3-5 days/week)",
    active: "very active (6-7 days/week)",
    very_active: "an athlete with intense daily training",
  };

  let profileSection = "";
  if (profile) {
    const lbs = Math.round(profile.weightKg * 2.205);
    const feet = Math.floor(profile.heightCm / 30.48);
    const inches = Math.round((profile.heightCm / 30.48 - feet) * 12);
    const diets = profile.dietaryPreferences.filter(d => d !== "none").join(", ") || "no dietary restrictions";

    profileSection = `

## User Profile
- Name: ${profile.name}
- Age: ${profile.age}, ${profile.sex === "prefer_not" ? "sex not specified" : profile.sex}
- Height: ${feet}′${inches}″ (${profile.heightCm}cm), Weight: ${lbs}lbs (${profile.weightKg}kg)
- Activity level: ${ACTIVITY_LABELS[profile.activityLevel] || profile.activityLevel}
- Primary goal: ${GOAL_LABELS[profile.goal] || profile.goal}
- Dietary preferences: ${diets}

## Daily Targets (personalized to ${profile.name})
- Calories: ${profile.goals.calories} kcal
- Protein: ${profile.goals.protein}g
- Carbohydrates: ${profile.goals.carbohydrates}g
- Fat: ${profile.goals.fat}g
- Fiber: ${profile.goals.fiber}g
- Sugar: max ${profile.goals.sugar}g

Always address the user as ${profile.name}. Reference their goal (${GOAL_LABELS[profile.goal] || profile.goal}) when giving relevant advice. Respect their dietary preferences (${diets}) — never suggest foods that conflict with these.`;
  }

  return `You are Munch — a friendly, knowledgeable nutrition assistant. You have the personality of a warm, encouraging nutritionist friend: direct, non-judgmental, occasionally witty, always helpful.${profileSection}

Your job:
1. Answer nutrition questions clearly and conversationally
2. Help users log food by analyzing what they describe or photograph
3. Give advice that references their personal goals and targets when relevant
4. Be encouraging — celebrate good choices, gently flag concerns

Tone rules:
- Keep responses SHORT (2-4 sentences max unless a list is genuinely needed)
- Use casual, friendly language — not clinical
- Never be preachy or moralistic about food choices
- Reference the user's specific goals and numbers when it adds value
- Use "you" not "one"

When the user describes food they ate or want to log, ALWAYS include ONE nutrition JSON block for the most prominent food item. Detect food from phrases like "I had", "I ate", "for lunch", "can you log", "add", etc.

CRITICAL: Only ONE <food> block per response. Never more.

Rate food healthiness accurately — "great" for whole foods/lean proteins/vegetables, "neutral" for everyday mixed foods, "bad" for processed/high-sugar/fast food. Never default to "neutral" for clearly healthy foods.

When including food data, wrap the JSON in <food> tags:
<food>
${NUTRITION_JSON_FORMAT}
</food>

CRITICAL: When you include a <food> block, your text must NOT repeat the food name, calories, or any numbers — the UI card shows all of that. Write ONE short friendly sentence only.

For general questions, just respond conversationally. No JSON.

When the user asks what to eat, what they should have for their next meal, or asks for meal suggestions, respond with a <suggestions_list> block containing exactly 3 meal suggestions as JSON:
<suggestions_list>
[
  { "name": "Meal name", "description": "Brief description", "calories": 400, "protein": 35, "carbohydrates": 40, "fat": 12, "why": "Fits your remaining protein goal perfectly" },
  { "name": "Meal name 2", "description": "Brief description", "calories": 350, "protein": 28, "carbohydrates": 38, "fat": 11, "why": "Light and high in fiber" },
  { "name": "Meal name 3", "description": "Brief description", "calories": 420, "protein": 32, "carbohydrates": 45, "fat": 14, "why": "Quick and easy to make" }
]
</suggestions_list>
Choose suggestions that realistically fit the user's remaining calories and macros for the day. Tailor to their dietary preferences and goal. Before the block, write ONE sentence introducing the suggestions.

Always end with 2-3 suggestion chips:
<suggestions>
["Chip 1", "Chip 2", "Chip 3"]
</suggestions>`;
}

function getModel(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
    // Increased to 4096 to handle long recipes without truncation
    generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 4096 },
  });
}

function sanitizeText(text: string): string {
  return text
    .replace(/<food>[\s\S]*?<\/food>/gi, "")
    .replace(/<food>[\s\S]*/gi, "")
    .replace(/<suggestions>[\s\S]*?<\/suggestions>/gi, "")
    .replace(/<suggestions>[\s\S]*/gi, "")
    .replace(/<suggestions_list>[\s\S]*?<\/suggestions_list>/gi, "")
    .replace(/<suggestions_list>[\s\S]*/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseChatResponse(raw: string): ChatResponse {
  let text = raw.trim();
  let foodAnalysis: NutritionData | undefined;
  let suggestions: string[] = [];
  let mealSuggestions: unknown[] | undefined;

  // Extract first complete food block only
  const foodMatch = text.match(/<food>([\s\S]*?)<\/food>/i);
  if (foodMatch) {
    try {
      const jsonStr = foodMatch[1].trim();
      const start = jsonStr.indexOf("{");
      const end = jsonStr.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(jsonStr.slice(start, end + 1)) as NutritionData;
        const nums = ["calories", "protein", "carbohydrates", "fat", "fiber", "sugar"] as const;
        for (const f of nums) if (parsed[f] !== undefined) parsed[f] = Number(parsed[f]);
        if (!["great", "neutral", "bad"].includes(parsed.healthRating)) parsed.healthRating = "neutral";
        foodAnalysis = parsed;
      }
    } catch (e) {
      console.error("[chat] Failed to parse food JSON:", e);
    }
  }

  // Extract suggestions (only if complete block present)
  const suggestMatch = text.match(/<suggestions>([\s\S]*?)<\/suggestions>/i);
  if (suggestMatch) {
    try {
      const parsed = JSON.parse(suggestMatch[1].trim());
      if (Array.isArray(parsed)) suggestions = parsed as string[];
    } catch {}
  }

  // Extract meal suggestions list
  const mealSuggestMatch = text.match(/<suggestions_list>([\s\S]*?)<\/suggestions_list>/i);
  if (mealSuggestMatch) {
    try {
      const parsed = JSON.parse(mealSuggestMatch[1].trim());
      if (Array.isArray(parsed)) mealSuggestions = parsed;
    } catch {}
  }

  // Strip ALL tags and leaked content from display text
  text = sanitizeText(text);

  if (suggestions.length === 0) {
    suggestions = foodAnalysis
      ? ["Log another meal", "How am I doing today?", "What are the macros?"]
      : ["Log my breakfast", "How many calories today?", "What should I eat?"];
  }

  return {
    text: text || "Got it!",
    suggestions,
    foodAnalysis,
    mealSuggestions,
    intent: mealSuggestions ? "meal_suggestions" : foodAnalysis ? "food_logged" : "conversation",
  };
}

export interface ConversationTurn {
  role: "user" | "model";
  text: string;
}

export async function chat(
  message: string,
  history: ConversationTurn[],
  dailyContext?: DailyContext,
  imageBase64?: string,
  mimeType?: string,
  profile?: UserProfileContext,
): Promise<ChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = getModel(apiKey);

  // Build daily context note
  let contextNote = "";
  if (dailyContext && dailyContext.entries.length > 0) {
    const entryList = dailyContext.entries.map(e => `- ${e.foodName} (${e.calories} kcal, ${e.mealTime})`).join("\n");
    const goalCals = profile?.goals.calories ?? 2000;
    const remaining = goalCals - dailyContext.calories;
    contextNote = `\n\n[Today's log: ${dailyContext.calories}/${goalCals} kcal consumed, ${remaining > 0 ? remaining + " remaining" : Math.abs(remaining) + " over goal"}]\n${entryList}`;
  } else {
    contextNote = "\n\n[No food logged today yet]";
  }

  const systemPrompt = buildSystemPrompt(profile) + contextNote;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contents: any[] = [];

  for (const turn of history.slice(-10)) {
    contents.push({ role: turn.role, parts: [{ text: turn.text }] });
  }

  if (imageBase64 && mimeType) {
    contents.push({
      role: "user",
      parts: [
        { inlineData: { data: imageBase64, mimeType } },
        { text: message || "What is this food? Please analyze it." },
      ],
    });
  } else {
    contents.push({ role: "user", parts: [{ text: message }] });
  }

  const result = await model.generateContent({ systemInstruction: systemPrompt, contents });
  const raw = result.response.text().trim();
  console.log(`[chat] Raw preview: ${raw.slice(0, 200)}`);
  return parseChatResponse(raw);
}
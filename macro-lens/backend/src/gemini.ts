import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

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
  healthRating: "great" | "neutral" | "bad";
  healthSummary: string;
  highlights: NutritionHighlight[];
}

export interface AnalysisResult {
  success: boolean;
  data?: NutritionData;
  error?: string;
}

const JSON_FORMAT = `{
  "foodName": "descriptive name of the food/meal",
  "servingSize": "estimated serving size (e.g., '1 plate (~400g)')",
  "calories": 500,
  "protein": 30,
  "carbohydrates": 45,
  "fat": 20,
  "fiber": 5,
  "sugar": 8,
  "confidence": "high",
  "notes": "brief explanation of estimates and any caveats",
  "ingredients": ["ingredient 1", "ingredient 2", "up to 8 main ingredients"],
  "healthRating": "REPLACE_WITH_RATING",
  "healthSummary": "One honest sentence about the overall nutritional value.",
  "highlights": [
    { "type": "positive", "text": "Specific positive nutrient fact" },
    { "type": "negative", "text": "Specific concern or downside" }
  ]
}`;

const HEALTH_RATING_RULES = `
HEALTH RATING — you MUST apply these criteria honestly and specifically:

Rate as "great" if the food:
- Is primarily whole, minimally processed ingredients (vegetables, fruits, lean proteins, legumes, whole grains, nuts)
- Has a favorable protein-to-calorie ratio (e.g. >20g protein per 400 kcal)
- Is low in added sugar (under 8g) AND low in saturated fat
- Provides meaningful micronutrients or fiber
- Examples: grilled salmon with vegetables, Greek yogurt, a salad with lean protein, eggs with spinach, chicken breast, lentil soup, oatmeal with fruit

Rate as "neutral" if the food:
- Is a reasonable everyday food with a mix of pros and cons
- May be higher in carbs or fat but still provides nutrition
- Is not heavily processed but not optimally nutritious either
- Examples: pasta with tomato sauce, a sandwich, rice and beans, pizza with veggies, stir fry with noodles, chicken tacos, sushi rolls

Rate as "bad" if the food:
- Is heavily processed or fast food with very low nutritional density
- Is very high in added sugar (>25g), sodium (>1200mg), or saturated fat (>15g) per serving
- Provides mostly empty calories with little protein or fiber
- Examples: candy, soda, deep-fried fast food, donuts, chips, hot dogs, milkshakes, large desserts, alcohol

DO NOT default to "neutral" — most home-cooked meals with lean protein and vegetables should be "great". Be accurate and specific.`;

const RULES = `Rules:
- All numeric values must be plain numbers, never strings
- confidence must be exactly "high", "medium", or "low"
- healthRating must be exactly "great", "neutral", or "bad" — see rating criteria above
- highlights: provide 3-5 items mixing positives and negatives. Be specific (mention actual nutrients, quantities, health effects)
- healthSummary: one sentence, honest and direct — state the rating reason clearly
- Output raw JSON only — no markdown fences, no extra text`;

const IMAGE_PROMPT = `You are a registered dietitian analyzing a food image.

Analyze the visible food for both its nutritional content and overall healthiness.

${HEALTH_RATING_RULES}

Respond ONLY with this JSON format:
${JSON_FORMAT}

${RULES}`;

const TEXT_PROMPT = `You are a registered dietitian analyzing a food description or recipe.

Analyze the food for both its nutritional content and overall healthiness. If it's a full recipe, calculate per-serving nutrition.

${HEALTH_RATING_RULES}

Respond ONLY with this JSON format:
${JSON_FORMAT}

${RULES}`;

function getModel(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
    generationConfig: { temperature: 0.2, topP: 0.8, maxOutputTokens: 4096 },
  });
}

function parseResponse(text: string): NutritionData {
  console.log(`[gemini] Raw response preview: ${text.slice(0, 300)}`);
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error(`No JSON found in response: ${text.slice(0, 200)}`);
  const parsed: NutritionData = JSON.parse(text.slice(start, end + 1));
  const required = ["foodName", "servingSize", "calories", "protein", "carbohydrates", "fat", "healthRating", "healthSummary", "highlights"];
  for (const f of required) if (!(f in parsed)) throw new Error(`Missing required field: ${f}`);
  const nums = ["calories", "protein", "carbohydrates", "fat", "fiber", "sugar"] as const;
  for (const f of nums) if (parsed[f] !== undefined) parsed[f] = Number(parsed[f]);
  if (!["great", "neutral", "bad"].includes(parsed.healthRating)) parsed.healthRating = "neutral";
  return parsed;
}

export async function analyzeImage(imageBase64: string, mimeType: string): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { success: false, error: "GEMINI_API_KEY is not configured" };
  try {
    const model = getModel(apiKey);
    const result = await model.generateContent([IMAGE_PROMPT, { inlineData: { data: imageBase64, mimeType } }]);
    return { success: true, data: parseResponse(result.response.text().trim()) };
  } catch (err) { throw err; }
}

export async function analyzeText(description: string): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { success: false, error: "GEMINI_API_KEY is not configured" };
  try {
    const model = getModel(apiKey);
    const result = await model.generateContent(`${TEXT_PROMPT}\n\nUser input:\n${description}`);
    return { success: true, data: parseResponse(result.response.text().trim()) };
  } catch (err) { throw err; }
}

export async function analyzeCorrection(
  previousResult: NutritionData,
  correction: string,
  imageBase64?: string,
  mimeType?: string
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { success: false, error: "GEMINI_API_KEY is not configured" };
  try {
    const model = getModel(apiKey);
    const correctionPrompt = `You are a registered dietitian. The user is correcting a previous food analysis.

Previous analysis:
- Food: ${previousResult.foodName}
- Serving: ${previousResult.servingSize}
- Calories: ${previousResult.calories} kcal
- Protein: ${previousResult.protein}g, Carbs: ${previousResult.carbohydrates}g, Fat: ${previousResult.fat}g, Fiber: ${previousResult.fiber}g
- Health rating: ${previousResult.healthRating}

User's correction: "${correction}"

Re-evaluate nutrition AND health rating based on this correction.

${HEALTH_RATING_RULES}

Respond ONLY with this JSON format:
${JSON_FORMAT}

${RULES}
- In the "notes" field, briefly explain what changed based on the correction`;

    let result;
    if (imageBase64 && mimeType) {
      result = await model.generateContent([correctionPrompt, { inlineData: { data: imageBase64, mimeType } }]);
    } else {
      result = await model.generateContent(correctionPrompt);
    }
    return { success: true, data: parseResponse(result.response.text().trim()) };
  } catch (err) { throw err; }
}

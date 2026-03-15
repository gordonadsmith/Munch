import { AnalysisResult, NutritionData, UserProfile } from "./types";

async function handleResponse(res: Response): Promise<unknown> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Server error: ${res.status}`);
  }
  return res.json();
}

export async function analyzeImage(file: File): Promise<AnalysisResult & { imageBase64?: string; mimeType?: string }> {
  const formData = new FormData();
  formData.append("image", file);
  const result = await handleResponse(await fetch("/api/analyze/image", { method: "POST", body: formData })) as AnalysisResult;
  const imageBase64 = await fileToBase64(file);
  return { ...result, imageBase64, mimeType: file.type };
}

export async function analyzeText(description: string): Promise<AnalysisResult> {
  return handleResponse(
    await fetch("/api/analyze/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    })
  ) as Promise<AnalysisResult>;
}

export async function analyzeCorrection(
  previousResult: NutritionData,
  correction: string,
  imageBase64?: string,
  mimeType?: string
): Promise<AnalysisResult> {
  return handleResponse(
    await fetch("/api/analyze/correct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ previousResult, correction, imageBase64, mimeType }),
    })
  ) as Promise<AnalysisResult>;
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ConversationTurn { role: "user" | "model"; text: string; }
export interface DailyContextEntry { foodName: string; calories: number; mealTime: string; healthRating: string; }
export interface DailyContext {
  calories: number; protein: number; carbohydrates: number; fat: number; fiber: number;
  entries: DailyContextEntry[];
}

export interface ChatApiResponse {
  text: string;
  suggestions?: string[];
  foodAnalysis?: NutritionData;
  mealSuggestions?: unknown[];
  intent: "conversation" | "food_logged" | "food_image" | "meal_suggestions";
}

export async function sendChatMessage(
  message: string,
  history: ConversationTurn[],
  dailyContext?: DailyContext,
  imageBase64?: string,
  mimeType?: string,
  profile?: UserProfile,
): Promise<ChatApiResponse> {
  return handleResponse(
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, dailyContext, imageBase64, mimeType, profile }),
    })
  ) as Promise<ChatApiResponse>;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

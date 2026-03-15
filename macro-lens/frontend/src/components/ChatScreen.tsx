import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, NutritionData, MealTime, FoodEntry, MealSuggestion, SavedRecipe } from "../types";
import { sendChatMessage, ConversationTurn, DailyContext } from "../api";
import { DailyTotals, UserProfile } from "../types";
import FoodLogCard from "./FoodLogCard";
import FoodDetail from "./FoodDetail";
import FoodSearch from "./FoodSearch";
import RecipeLibrary from "./RecipeLibrary";
import MealSuggestCard from "./MealSuggestCard";

interface Props {
  totals: DailyTotals;
  entries: FoodEntry[];
  onLogFood: (nutrition: NutritionData, mealTime: MealTime, imagePreview?: string) => void;
  onRemoveEntry: (id: string) => void;
  profile?: UserProfile;
  recipes: SavedRecipe[];
  onSaveRecipe: (recipe: SavedRecipe) => void;
  onDeleteRecipe: (id: string) => void;
}

function cleanText(text: string): string {
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

function buildOpeningPrompt(entries: FoodEntry[], totals: DailyTotals, profile?: UserProfile): string {
  const name = profile?.name ?? "there";
  if (entries.length === 0) {
    return `[SYSTEM: The user just opened the app. They have not logged any food today. Send a warm, short opening message as Munch. Greet them as ${name}, note they haven't tracked anything yet, and encourage them to log their first meal or ask a question. Keep it to 2-3 sentences. Be friendly and motivating.]`;
  }
  const goal = profile?.goals;
  const calLeft = goal ? goal.calories - totals.calories : null;
  const proteinLeft = goal ? goal.protein - totals.protein : null;
  const mealList = entries.map(e => `${e.nutrition.foodName} (${e.nutrition.calories} kcal, ${e.mealTime})`).join(", ");
  return `[SYSTEM: The user just opened the app. They have logged ${entries.length} meal(s) today: ${mealList}. Total so far: ${totals.calories} kcal, ${totals.protein}g protein, ${totals.carbohydrates}g carbs, ${totals.fat}g fat.${goal ? ` Their daily goals are ${goal.calories} kcal, ${goal.protein}g protein. They have ${calLeft} kcal and ${proteinLeft}g protein remaining.` : ""}
Send a short, conversational check-in as Munch. Address them as ${name}. In 3-4 sentences: acknowledge what they've eaten, give one specific macro insight with actual numbers, give one actionable tip for the rest of the day. Be warm and encouraging. No lists.]`;
}

function MunchAvatar() {
  return (
    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--forest)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
      🥗
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "12px 16px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ink-4)", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
    </div>
  );
}

interface BubbleProps {
  message: ChatMessage;
  onSuggestion: (s: { label: string; value: string }) => void;
  onLogFood: (n: NutritionData, m: MealTime, img?: string) => void;
  onDismissFood: () => void;
  onSelectMealSuggestion: (s: MealSuggestion) => void;
}

function MessageBubble({ message, onSuggestion, onLogFood, onDismissFood, onSelectMealSuggestion }: BubbleProps) {
  const isUser = message.role === "user";
  const [logged, setLogged] = useState(false);
  const displayText = cleanText(message.text);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: "8px", animation: "fadeUp 0.25s ease" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", maxWidth: "88%" }}>
        {!isUser && <MunchAvatar />}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: isUser ? "flex-end" : "flex-start", maxWidth: "100%" }}>
          {isUser && message.foodAction?.imagePreview && !message.foodAction.nutrition?.foodName && (
            <img src={message.foodAction.imagePreview} alt="" style={{ width: 160, height: 120, objectFit: "cover", borderRadius: "var(--r)", boxShadow: "var(--shadow-sm)" }} />
          )}

          {displayText.length > 0 && (
            <div style={{ padding: "10px 14px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isUser ? "var(--forest)" : "var(--surface)", boxShadow: "var(--shadow-sm)", maxWidth: "100%" }}>
              <p style={{ fontSize: "14px", lineHeight: 1.55, color: isUser ? "#fff" : "var(--ink)", whiteSpace: "pre-wrap" }}>{displayText}</p>
            </div>
          )}

          {/* Food log card */}
          {!isUser && message.foodAction?.nutrition?.foodName && !logged && (
            <div style={{ width: "100%", maxWidth: "320px" }}>
              <FoodLogCard
                nutrition={message.foodAction.nutrition}
                imagePreview={message.foodAction.imagePreview}
                onAdd={(mealTime) => { onLogFood(message.foodAction!.nutrition, mealTime, message.foodAction?.imagePreview); setLogged(true); }}
                onDismiss={() => { onDismissFood(); setLogged(true); }}
              />
            </div>
          )}
          {logged && !isUser && message.foodAction?.nutrition?.foodName && (
            <p style={{ fontSize: "12px", color: "var(--ink-4)", fontStyle: "italic", paddingLeft: "4px" }}>✓ Logged</p>
          )}

          {/* Meal suggestions */}
          {!isUser && message.mealSuggestions && message.mealSuggestions.length > 0 && (
            <div style={{ width: "100%", maxWidth: "340px" }}>
              <MealSuggestCard
                suggestions={message.mealSuggestions as MealSuggestion[]}
                onSelect={onSelectMealSuggestion}
              />
            </div>
          )}
        </div>
      </div>

      {!isUser && message.suggestions && message.suggestions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingLeft: "38px" }}>
          {message.suggestions.map(s => (
            <button key={s.value} onClick={() => onSuggestion(s)} style={{
              background: "var(--surface)", border: "1.5px solid var(--border-strong)", borderRadius: "var(--r-full)", padding: "6px 13px",
              fontSize: "12px", fontWeight: 500, color: "var(--forest)", transition: "all 0.15s", boxShadow: "var(--shadow-sm)",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--forest-pale)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ChatScreen ────────────────────────────────────────────────────────────────
export default function ChatScreen({ totals, entries, onLogFood, onRemoveEntry, profile, recipes, onSaveRecipe, onDeleteRecipe }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openingLoading, setOpeningLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [detailEntry, setDetailEntry] = useState<FoodEntry | null>(null);
  const [pendingImageBase64, setPendingImageBase64] = useState<string | undefined>();
  const [pendingMimeType, setPendingMimeType] = useState<string | undefined>();
  const [pendingImagePreview, setPendingImagePreview] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const openingFiredRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, openingLoading]);

  // Fire opening message on mount
  useEffect(() => {
    if (openingFiredRef.current) return;
    openingFiredRef.current = true;

    const dailyContext: DailyContext = {
      calories: totals.calories, protein: totals.protein, carbohydrates: totals.carbohydrates, fat: totals.fat, fiber: totals.fiber,
      entries: entries.map(e => ({ foodName: e.nutrition.foodName, calories: e.nutrition.calories, mealTime: e.mealTime, healthRating: e.nutrition.healthRating })),
    };

    sendChatMessage(buildOpeningPrompt(entries, totals, profile), [], dailyContext, undefined, undefined, profile)
      .then(response => {
        setMessages([{
          id: "opening", role: "munch", timestamp: new Date().toISOString(),
          text: response.text,
          suggestions: response.suggestions?.map(s => ({ label: s, value: s })),
          mealSuggestions: response.mealSuggestions as MealSuggestion[] | undefined,
        }]);
      })
      .catch(() => {
        setMessages([{
          id: "opening", role: "munch", timestamp: new Date().toISOString(),
          text: entries.length === 0
            ? `Hey${profile?.name ? `, ${profile.name}` : ""}! 👋 You haven't logged anything today. Tell me what you've eaten or snap a photo of your meal.`
            : `Hey${profile?.name ? `, ${profile.name}` : ""}! 👋 You've logged ${entries.length} meal${entries.length > 1 ? "s" : ""} for ${totals.calories} kcal today. Keep it up!`,
          suggestions: entries.length === 0
            ? [{ label: "Log breakfast", value: "Log my breakfast" }, { label: "What should I eat?", value: "What should I eat today?" }]
            : [{ label: "Log a meal", value: "Log my next meal" }, { label: "What to eat next", value: "What should I eat next to hit my goals?" }],
        }]);
      })
      .finally(() => setOpeningLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getHistory = useCallback((): ConversationTurn[] => {
    return messages.filter(m => m.id !== "opening").map(m => ({
      role: m.role === "munch" ? "model" as const : "user" as const,
      text: cleanText(m.text),
    }));
  }, [messages]);

  const getDailyContext = useCallback((): DailyContext => ({
    calories: totals.calories, protein: totals.protein, carbohydrates: totals.carbohydrates, fat: totals.fat, fiber: totals.fiber,
    entries: entries.map(e => ({ foodName: e.nutrition.foodName, calories: e.nutrition.calories, mealTime: e.mealTime, healthRating: e.nutrition.healthRating })),
  }), [totals, entries]);

  const addUserMessage = (text: string, imagePreview?: string) => {
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", timestamp: new Date().toISOString(), text, ...(imagePreview ? { foodAction: { nutrition: {} as NutritionData, imagePreview } } : {}) }]);
  };

  const addMunchMessage = (text: string, opts?: Partial<ChatMessage>) => {
    setMessages(prev => [...prev, { id: `m-${Date.now()}`, role: "munch", timestamp: new Date().toISOString(), text, ...opts }]);
  };

  const sendMessage = useCallback(async (text: string, imageBase64?: string, imgMimeType?: string, imgPreview?: string) => {
    if ((!text.trim() && !imageBase64) || loading) return;
    addUserMessage(text || "📷 Photo", imgPreview);
    setInput("");
    setLoading(true);
    setPendingImageBase64(undefined); setPendingMimeType(undefined); setPendingImagePreview(undefined);

    try {
      const response = await sendChatMessage(text, getHistory(), getDailyContext(), imageBase64, imgMimeType, profile);
      addMunchMessage(response.text, {
        suggestions: response.suggestions?.map(s => ({ label: s, value: s })),
        mealSuggestions: response.mealSuggestions as MealSuggestion[] | undefined,
        ...(response.foodAnalysis ? { foodAction: { nutrition: response.foodAnalysis, imagePreview: imgPreview } } : {}),
      });
    } catch {
      addMunchMessage("Sorry, something went wrong. Try again?", { suggestions: [{ label: "Try again", value: text }] });
    } finally { setLoading(false); }
  }, [loading, getHistory, getDailyContext, profile]);

  const handleFile = useCallback(async (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowed.includes(file.type)) return;
    const preview = URL.createObjectURL(file);
    const base64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
    setPendingImageBase64(base64); setPendingMimeType(file.type); setPendingImagePreview(preview);
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (pendingImageBase64) sendMessage(input.trim(), pendingImageBase64, pendingMimeType, pendingImagePreview);
    else if (input.trim()) sendMessage(input.trim());
  };

  const handleSelectMealSuggestion = (suggestion: MealSuggestion) => {
    sendMessage(`Can you log "${suggestion.name}" for me?`);
  };

  const handleSearchSelect = (nutrition: NutritionData, mealTime: MealTime) => {
    onLogFood(nutrition, mealTime);
    setShowSearch(false);
    addMunchMessage(`Logged ${nutrition.foodName} (${nutrition.calories} kcal) to your ${mealTime}! Great choice. 🎯`, {
      suggestions: [{ label: "Log something else", value: "I had something else too" }, { label: "How am I doing?", value: "How am I doing with my goals?" }],
    });
  };

  const canSend = (input.trim().length > 0 || !!pendingImageBase64) && !loading;
  const remainingCals = profile?.goals.calories ? profile.goals.calories - totals.calories : null;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {openingLoading && (
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", animation: "fadeUp 0.2s ease" }}>
              <MunchAvatar />
              <div style={{ background: "var(--surface)", borderRadius: "18px 18px 18px 4px", boxShadow: "var(--shadow-sm)" }}><TypingIndicator /></div>
            </div>
          )}

          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onSuggestion={s => sendMessage(s.value)}
              onLogFood={(nutrition, mealTime, imgPreview) => onLogFood(nutrition, mealTime, imgPreview)}
              onDismissFood={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, foodAction: undefined } : m))}
              onSelectMealSuggestion={handleSelectMealSuggestion}
            />
          ))}

          {loading && (
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", animation: "fadeUp 0.2s ease" }}>
              <MunchAvatar />
              <div style={{ background: "var(--surface)", borderRadius: "18px 18px 18px 4px", boxShadow: "var(--shadow-sm)" }}><TypingIndicator /></div>
            </div>
          )}
        </div>

        {/* Pending image strip */}
        {pendingImagePreview && (
          <div style={{ padding: "8px 16px 0", display: "flex", alignItems: "center", gap: "10px", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
            <div style={{ position: "relative" }}>
              <img src={pendingImagePreview} alt="" style={{ width: 48, height: 48, borderRadius: "var(--r-sm)", objectFit: "cover" }} />
              <button onClick={() => { setPendingImageBase64(undefined); setPendingMimeType(undefined); setPendingImagePreview(undefined); }} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "var(--ink-2)", color: "#fff", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>×</button>
            </div>
            <p style={{ fontSize: "12px", color: "var(--ink-4)" }}>Photo ready — add a note or just send</p>
          </div>
        )}

        {/* Input bar + fixed action buttons */}
        <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          {/* Always-visible action row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "5px", padding: "8px 12px 0" }}>
            <button
              onClick={() => sendMessage("What should I eat next to hit my goals?")}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "var(--forest-xpale)", border: "1px solid rgba(26,71,49,0.15)", borderRadius: "var(--r)", padding: "8px 4px", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--forest-pale)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--forest-xpale)"; }}
            >
              <span style={{ fontSize: "16px" }}>💡</span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--forest)", textAlign: "center", lineHeight: 1.2 }}>
                {remainingCals && remainingCals > 0 ? `${remainingCals} kcal left` : "Suggest meal"}
              </span>
            </button>
            <button
              onClick={() => setShowSearch(true)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "var(--bg)", border: "1px solid var(--border-mid)", borderRadius: "var(--r)", padding: "8px 4px", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--border)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
            >
              <span style={{ fontSize: "16px" }}>🔍</span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink-2)" }}>Search foods</span>
            </button>
            <button
              onClick={() => sendMessage("How am I doing with my goals today?")}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "var(--bg)", border: "1px solid var(--border-mid)", borderRadius: "var(--r)", padding: "8px 4px", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--border)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
            >
              <span style={{ fontSize: "16px" }}>📊</span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink-2)" }}>My progress</span>
            </button>
            <button
              onClick={() => setShowRecipes(true)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "var(--bg)", border: "1px solid var(--border-mid)", borderRadius: "var(--r)", padding: "8px 4px", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--border)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
            >
              <span style={{ fontSize: "16px" }}>📖</span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--ink-2)" }}>Recipes</span>
            </button>
          </div>

        <div style={{ padding: "8px 12px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", background: "var(--bg)", borderRadius: "24px", padding: "8px 8px 8px 14px", border: "1.5px solid var(--border)", transition: "border-color 0.15s" }}
            onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; }}
            onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
          >
            <button onClick={() => fileRef.current?.click()} style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", opacity: 0.55, transition: "opacity 0.15s", cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.55"; }}
            >📷</button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
              style={{ display: "none" }} />

            <textarea ref={inputRef} value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask Munch anything…"
              rows={1} disabled={loading}
              style={{ flex: 1, fontSize: "14px", lineHeight: 1.5, maxHeight: "120px", overflowY: "auto", background: "transparent", border: "none", outline: "none", color: "var(--ink)" }}
            />

            <button onClick={handleSend} disabled={!canSend} style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: canSend ? "var(--forest)" : "var(--border)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", cursor: canSend ? "pointer" : "default" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8h12M10 4l4 4-4 4" stroke={canSend ? "#fff" : "var(--ink-4)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        </div>

        {detailEntry && (
          <FoodDetail entry={detailEntry} onClose={() => setDetailEntry(null)} onRemove={() => { onRemoveEntry(detailEntry.id); setDetailEntry(null); }} />
        )}
      </div>

      {/* Recipe library overlay */}
      {showRecipes && (
        <RecipeLibrary
          recipes={recipes}
          onLog={(nutrition, mealTime) => { onLogFood(nutrition, mealTime); setShowRecipes(false); addMunchMessage(`Logged ${nutrition.foodName} (${nutrition.calories} kcal)! 🎯`, { suggestions: [{ label: "Log another", value: "I had something else too" }, { label: "How am I doing?", value: "How am I doing with my goals?" }] }); }}
          onSave={onSaveRecipe}
          onDelete={onDeleteRecipe}
          onDismiss={() => setShowRecipes(false)}
        />
      )}

      {/* Food search overlay */}
      {showSearch && (
        <FoodSearch
          onSelect={handleSearchSelect}
          onDismiss={() => setShowSearch(false)}
        />
      )}
    </>
  );
}

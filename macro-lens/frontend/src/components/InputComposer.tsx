import { useState, useRef, useCallback } from "react";
import { InputMode, NutritionData, MealTime } from "../types";
import { analyzeImage, analyzeText } from "../api";
import NutritionPreview from "./NutritionPreview";

interface Props {
  onAdd: (nutrition: NutritionData, mode: InputMode, mealTime: MealTime, imagePreview?: string) => void;
}

const MODES: { id: InputMode; label: string; icon: string }[] = [
  { id: "photo", label: "Photo", icon: "📷" },
  { id: "describe", label: "Describe", icon: "✍️" },
  { id: "recipe", label: "Recipe", icon: "📋" },
];

const SUGGESTIONS = [
  "Chicken Caesar salad",
  "Big Mac meal, large",
  "Overnight oats with berries",
  "Avocado toast, 2 eggs",
  "Pepperoni pizza, 2 slices",
];

type State = "idle" | "loading" | "preview" | "error";

export default function InputComposer({ onAdd }: Props) {
  const [mode, setMode] = useState<InputMode>("describe");
  const [text, setText] = useState("");
  const [state, setState] = useState<State>("idle");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [imageMimeType, setImageMimeType] = useState<string | undefined>();
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const reset = useCallback(() => {
    setState("idle"); setImagePreview(null); setImageBase64(undefined);
    setImageMimeType(undefined); setNutrition(null); setError(""); setText("");
  }, []);

  const analyze = useCallback(async (file?: File, desc?: string) => {
    setState("loading"); setError("");
    try {
      let result;
      if (file) {
        result = await analyzeImage(file);
        if (result.imageBase64) setImageBase64(result.imageBase64);
        if (result.mimeType) setImageMimeType(result.mimeType);
      } else {
        result = await analyzeText(desc!);
      }
      if (!result.success || !result.data) { setError(result.error || "Analysis failed."); setState("error"); return; }
      setNutrition(result.data);
      setState("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!["image/jpeg","image/png","image/webp","image/heic"].includes(file.type)) { setError("Use JPEG, PNG, or WebP."); setState("error"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10 MB."); setState("error"); return; }
    setImagePreview(URL.createObjectURL(file));
    analyze(file);
  }, [analyze]);

  const handleConfirm = useCallback((data: NutritionData, mealTime: MealTime) => {
    onAdd(data, mode, mealTime, imagePreview || undefined);
    reset();
  }, [mode, imagePreview, onAdd, reset]);

  const isLoading = state === "loading";

  if (state === "preview" && nutrition) {
    return (
      <NutritionPreview
        data={nutrition}
        imagePreview={imagePreview || undefined}
        imageBase64={imageBase64}
        mimeType={imageMimeType}
        onAdd={handleConfirm}
        onDiscard={reset}
      />
    );
  }

  return (
    <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
      {/* Mode tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); reset(); }}
            style={{
              flex: 1, padding: "12px 8px 10px",
              fontSize: "12px", fontWeight: mode === m.id ? 600 : 400,
              color: mode === m.id ? "var(--forest)" : "var(--ink-4)",
              borderBottom: `2px solid ${mode === m.id ? "var(--forest)" : "transparent"}`,
              transition: "all 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
            }}>
            <span style={{ fontSize: "14px" }}>{m.icon}</span> {m.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "14px 16px 24px" }}>
        {/* PHOTO */}
        {mode === "photo" && (
          <div
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => !isLoading && fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "var(--forest)" : "var(--border-strong)"}`,
              borderRadius: "var(--r)",
              background: dragging ? "var(--forest-pale)" : "var(--bg)",
              minHeight: 110,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px",
              cursor: isLoading ? "wait" : "pointer", transition: "all 0.2s", overflow: "hidden", position: "relative",
            }}>
            {isLoading && imagePreview ? (
              <>
                <img src={imagePreview} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "rgba(30,77,53,0.65)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <p style={{ color: "#fff", fontSize: "13px", fontWeight: 500 }}>Analyzing…</p>
                </div>
              </>
            ) : (
              <>
                <span style={{ fontSize: "24px" }}>📷</span>
                <p style={{ fontSize: "13px", color: "var(--ink-3)", fontWeight: 500 }}>Drop a photo or tap to browse</p>
                <p style={{ fontSize: "11px", color: "var(--ink-4)" }}>JPEG, PNG, WebP · max 10 MB</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
              style={{ display: "none" }} disabled={isLoading} />
          </div>
        )}

        {/* DESCRIBE / RECIPE */}
        {(mode === "describe" || mode === "recipe") && (
          <>
            <div style={{ background: "var(--bg)", borderRadius: "var(--r)", border: "1.5px solid transparent", padding: "11px 14px", marginBottom: "10px", transition: "border-color 0.15s" }}
              onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; }}
              onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}>
              <textarea ref={textRef} value={text} onChange={e => setText(e.target.value)}
                placeholder={mode === "recipe" ? "Paste ingredients or a full recipe…\n\ne.g. 200g chicken breast, 1 cup rice, 1 tbsp olive oil\nServes 2" : "What did you eat?\n\ne.g. Large chicken tikka masala with naan and rice"}
                rows={mode === "recipe" ? 4 : 3} disabled={isLoading}
                style={{ width: "100%", fontSize: "14px", lineHeight: 1.6, color: "var(--ink)", background: "transparent", fontFamily: "var(--font)" }}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) { if (text.trim().length >= 3) analyze(undefined, text.trim()); }}}
              />
            </div>

            {mode === "describe" && text.length === 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => { setText(s); textRef.current?.focus(); }}
                    style={{ background: "var(--bg)", border: "1px solid var(--border-strong)", borderRadius: "99px", padding: "5px 11px", fontSize: "12px", color: "var(--ink-3)", transition: "all 0.15s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--forest)"; (e.currentTarget as HTMLElement).style.color = "var(--forest)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLElement).style.color = "var(--ink-3)"; }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => { if (text.trim().length >= 3) analyze(undefined, text.trim()); }}
              disabled={isLoading || text.trim().length < 3}
              style={{
                width: "100%", padding: "13px",
                background: isLoading || text.trim().length < 3 ? "var(--border)" : "var(--forest)",
                border: "none", borderRadius: "var(--r)",
                fontSize: "14px", fontWeight: 600,
                color: isLoading || text.trim().length < 3 ? "var(--ink-4)" : "#fff",
                cursor: isLoading || text.trim().length < 3 ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
              {isLoading ? (<><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Analyzing…</>) : "Analyze"}
            </button>
          </>
        )}

        {state === "error" && (
          <div style={{ marginTop: "10px", background: "var(--red-pale)", borderRadius: "var(--r-sm)", padding: "10px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--red)", flex: 1 }}>{error}</p>
            <button onClick={reset} style={{ fontSize: "12px", color: "var(--red)", fontWeight: 600 }}>Retry</button>
          </div>
        )}
      </div>
    </div>
  );
}
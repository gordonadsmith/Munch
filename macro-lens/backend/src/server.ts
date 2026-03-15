import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { analyzeImage, analyzeText, analyzeCorrection, AnalysisResult, NutritionData } from "./gemini";
import { chat, ConversationTurn, DailyContext, UserProfileContext } from "./chat";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "20mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only JPEG, PNG, WebP, and HEIC images are supported."));
  },
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/analyze/image", upload.single("image"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { res.status(400).json({ success: false, error: "No image file provided." }); return; }
    const result: AnalysisResult = await analyzeImage(req.file.buffer.toString("base64"), req.file.mimetype);
    if (!result.success) { res.status(500).json(result); return; }
    res.json(result);
  } catch (err) { next(err); }
});

app.post("/api/analyze/text", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description } = req.body as { description?: string };
    if (!description || description.trim().length < 3) { res.status(400).json({ success: false, error: "Please provide a food description." }); return; }
    const result: AnalysisResult = await analyzeText(description.trim());
    if (!result.success) { res.status(500).json(result); return; }
    res.json(result);
  } catch (err) { next(err); }
});

app.post("/api/analyze/correct", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { previousResult, correction, imageBase64, mimeType } = req.body as { previousResult?: NutritionData; correction?: string; imageBase64?: string; mimeType?: string };
    if (!previousResult || !correction || correction.trim().length < 3) { res.status(400).json({ success: false, error: "previousResult and correction are required." }); return; }
    const result = await analyzeCorrection(previousResult, correction.trim(), imageBase64, mimeType);
    if (!result.success) { res.status(500).json(result); return; }
    res.json(result);
  } catch (err) { next(err); }
});

app.post("/api/chat", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history, dailyContext, imageBase64, mimeType, profile } = req.body as {
      message: string;
      history?: ConversationTurn[];
      dailyContext?: DailyContext;
      imageBase64?: string;
      mimeType?: string;
      profile?: UserProfileContext;
    };
    if (!message && !imageBase64) { res.status(400).json({ error: "message or imageBase64 required" }); return; }
    const response = await chat(message || "", history || [], dailyContext, imageBase64, mimeType, profile);
    res.json(response);
  } catch (err) { next(err); }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[error]", err.message);
  res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
});

app.listen(PORT, () => {
  console.log(`✅ Munch backend running on http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) console.warn("⚠️  GEMINI_API_KEY is not set!");
});

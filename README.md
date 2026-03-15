# MacroLens 🔬

> AI-powered food photo & recipe analyzer. Drop a meal photo or recipe screenshot — get instant calorie and macro breakdowns powered by Google Gemini.

---

## Project Structure

```
macro-lens/
├── backend/          # Express + TypeScript API
│   ├── src/
│   │   ├── server.ts     # Express app, routes, middleware
│   │   └── gemini.ts     # Gemini Vision API service
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/         # React + TypeScript + Vite
    ├── src/
    │   ├── App.tsx             # Main app shell & state machine
    │   ├── api.ts              # Backend API calls
    │   ├── types.ts            # Shared TypeScript interfaces
    │   ├── index.css           # Design system / global styles
    │   ├── main.tsx            # React entry point
    │   └── components/
    │       ├── ImageUploader.tsx   # Drag-and-drop image input
    │       ├── NutritionCard.tsx   # Results display
    │       └── MacroBar.tsx        # Animated macro progress bar
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

---

## Prerequisites

- **Node.js** v18+ and **npm** v9+
- A **Google Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

## Setup

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the key — you'll need it in step 3

---

### 2. Install dependencies

Open **two terminals**.

**Terminal 1 — Backend:**
```bash
cd macro-lens/backend
npm install
```

**Terminal 2 — Frontend:**
```bash
cd macro-lens/frontend
npm install
```

---

### 3. Configure environment variables

```bash
cd macro-lens/backend
cp .env.example .env
```

Open `.env` and fill in your key:
```env
GEMINI_API_KEY=AIzaSy...your_key_here...
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

### 4. Run in development

**Terminal 1 — Start the backend:**
```bash
cd macro-lens/backend
npm run dev
# ✅ MacroLens backend running on http://localhost:3001
```

**Terminal 2 — Start the frontend:**
```bash
cd macro-lens/frontend
npm run dev
# ➜  Local:   http://localhost:5173/
```

Open [http://localhost:5173](http://localhost:5173) and upload a food photo!

---

## How It Works

```
User drops image
      │
      ▼
React frontend (port 5173)
  → POST /api/analyze (multipart/form-data)
      │
      ▼
Vite dev proxy → Express backend (port 3001)
  → Converts file buffer to base64
  → Calls Gemini 1.5 Flash with vision + nutrition prompt
  → Parses structured JSON response
  → Returns NutritionData
      │
      ▼
Frontend renders NutritionCard with:
  - Calories
  - Protein / Carbs / Fat / Fiber / Sugar
  - Macro calorie split bar
  - Detected ingredients
  - Confidence level + analyst notes
```

---

## API Reference

### `POST /api/analyze`

Analyzes a food image and returns nutritional data.

**Request:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| `image` | File | JPEG, PNG, WebP, or HEIC — max 10 MB |

**Response:**
```json
{
  "success": true,
  "data": {
    "foodName": "Grilled Chicken Caesar Salad",
    "servingSize": "1 large plate (~450g)",
    "calories": 520,
    "protein": 42,
    "carbohydrates": 18,
    "fat": 32,
    "fiber": 4,
    "sugar": 3,
    "confidence": "high",
    "notes": "Estimate based on standard Caesar dressing (3 tbsp) and croutons visible in image.",
    "ingredients": ["chicken breast", "romaine lettuce", "parmesan", "croutons", "caesar dressing"]
  }
}
```

**Error response:**
```json
{
  "success": false,
  "error": "Only JPEG, PNG, WebP, and HEIC images are supported."
}
```

---

## Building for Production

**Backend:**
```bash
cd backend
npm run build       # Compiles TypeScript to dist/
npm start           # Runs compiled JS
```

**Frontend:**
```bash
cd frontend
npm run build       # Outputs to dist/
npm run preview     # Preview the production build locally
```

For production, update `FRONTEND_URL` in your backend `.env` to your deployed frontend URL, and set the `VITE_API_BASE` environment variable in your frontend build.

---

## Expanding the App (Next Steps)

The MVP gives you the core analysis engine. Here's what to add next:

- **Auth** — Supabase or Clerk for user accounts
- **Food log** — Store daily meals in a database (Postgres/SQLite)
- **Daily dashboard** — Aggregate macros with charts
- **Barcode scanner** — Add Open Food Facts API for packaged foods
- **Custom goals** — Let users set calorie/macro targets
- **Mobile app** — React Native or Expo wrapping the same API

---

## Notes & Limitations

- All values are **estimates** based on visual analysis — accuracy varies by image quality and food complexity
- Complex mixed dishes have lower confidence than simple whole foods
- The Gemini API has rate limits on the free tier (15 RPM, 1.5M TPD)
- This app is not a substitute for medical/dietitian advice

# Casefile · AI Mystery Room

A darkroom-style deduction game. Write a premise or choose a preset, inspect the evidence, interview the suspects on paper, and file an accusation.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`. Add `GEMINI_API_KEY` for AI generated cases and `MONGODB_URI` to persist cases across server restarts. Both are optional; without them, the app uses its built-in case and keeps sessions in memory.
3. Install dependencies with `npm install`.
4. Start both the API and Vite with `npm run dev`.
5. Open the Vite URL printed in the terminal (usually `http://localhost:5173`).

For a production bundle, run `npm run build`. The API listens on port 4000 by default; set `PORT` to change it. The Vite development server proxies `/api` requests to the API.

## API

- `POST /api/cases/generate` — accepts `{ "scenario": "..." }` and returns a sanitized case file.
- `GET /api/cases/:id` — retrieves a sanitized case file.
- `POST /api/cases/:id/accuse` — accepts `{ "suspectId": "...", "playerReasoning": "..." }` and returns the verdict and solution.

The culprit and solution stay server side until the player submits an accusation. MongoDB persistence is enabled when `MONGODB_URI` is configured. Gemini generation uses `gemini-2.5-flash`; failed generation falls back to the included playable case.

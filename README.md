# MeetPilot AI

**From Conversations to Decisions. From Decisions to Action.**

MeetPilot AI is a meeting intelligence workspace that turns transcripts into structured decisions, owned tasks, and an ongoing meeting memory. It is built as a focused hackathon MVP: React + Vite on the frontend, Node + Express on the backend, and Google Gemini for analysis.

> **Current status:** the application includes dashboard, meeting history, Gemini analysis, report review/save, task and decision management, decision comparison, grounded AI chat, live microphone capture, and uploaded/recorded audio transcription.

---

## What works today

- Premium dark SaaS interface with responsive sidebar, topbar, and mobile drawer.
- Dashboard with **computed** statistics — no hardcoded numbers or fake trends.
- Meeting history list with search and full report rendering.
- Task management: status updates, editing, search, status/owner filters, overdue detection, missing-owner and missing-deadline signals.
- Confirmed decision ledger with source meeting, date, and transcript evidence.
- Settings page with live API health, storage details, and Gemini configuration guidance.
- Express API with validation, structured errors, CORS, and a local JSON data store.
- Clean empty states for every module.
- Verified desktop and mobile layouts, with no horizontal overflow.
- Live browser speech recognition where supported, plus Gemini audio transcription for recordings and uploads.
- Supabase publishable-client configuration, magic-link authentication, and SQL/RLS migration for cloud persistence.

### Supabase setup status

- Publishable client configuration and magic-link sign-in are integrated.
- SQL and RLS policies are provided for meetings, decisions, tasks, and conflict records.
- Cloud persistence requires running the SQL migration and migrating from the active JSON fallback.

---

## Architecture

```text
React SPA (Vite)
   │  fetch /api  (Vite dev proxy)
   ▼
Express API
   ├── routes → controllers → services
   ├── JSON fallback store  → backend/data/db.json
   └── Gemini analysis and audio transcription (server-only)
```

Design decisions:

- **The browser never calls Gemini.** The API key lives only in `backend/.env`.
- **Confirmed records are separate from AI output.** A meeting keeps the raw analysis, while tasks and decisions are only created when the user confirms them.
- **Storage is behind a service boundary.** The current JSON file store can be replaced with Supabase without changing the UI.
- **Statistics are derived from real data** on every render.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router, Lucide React |
| Styling | Modern CSS (custom design system, no UI framework) |
| Backend | Node.js, Express 5, CORS, dotenv |
| AI | `@google/genai` (Google Gemini) |
| Storage | Local JSON fallback (Supabase-ready) |

---

## Folder structure

```text
meetpilot-ai/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # AppLayout, Sidebar, Topbar
│   │   │   └── ui/              # Alert, Badge, Button, Card, DateTile,
│   │   │                        # EmptyState, LoadingState, Modal, PageHeader, StatCard
│   │   ├── context/
│   │   │   └── WorkspaceContext.jsx
│   │   ├── pages/               # Dashboard, Meetings, NewMeeting, MeetingReport,
│   │   │                        # Decisions, Tasks, Assistant, Settings, NotFound
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/               # format.js, stats.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── config/env.js
│   ├── controllers/             # health, meetings, tasks, decisions
│   ├── middleware/              # errorHandler, notFound
│   ├── routes/                  # API route modules
│   ├── services/                # store, meetingService, taskService, decisionService
│   ├── utils/                   # AppError, asyncHandler, validation
│   ├── data/                    # generated at runtime, gitignored
│   ├── .env                     # local secrets, gitignored
│   ├── .env.example
│   ├── .gitignore
│   ├── app.js
│   ├── server.js
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

---

## Run locally (Windows PowerShell)

### 1. Install dependencies

From `C:\Users\LENOVO\meetpilot-ai`:

```powershell
npm run install:all
```

### 2. Add your Gemini API key

Open `backend\.env` in Notepad:

```powershell
notepad backend\.env
```

Set the key (get one from https://aistudio.google.com/apikey):

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Save the file. Never commit `.env` — it is already ignored.

### 3. Start both apps

```powershell
npm run dev
```

Then open **http://localhost:5173**. The API runs on **http://localhost:5000**; health check: **http://localhost:5000/api/health**.

> Real Gemini analysis is enabled once `GEMINI_API_KEY` is set in `backend/.env`. The app never substitutes fake AI output.

---

## API endpoints

| Method | Endpoint | Status |
| --- | --- | --- |
| GET | `/api/health` | Implemented |
| GET | `/api/meetings` | Implemented |
| POST | `/api/meetings` | Implemented (save a confirmed report) |
| GET | `/api/meetings/:id` | Implemented |
| GET | `/api/tasks` | Implemented |
| PATCH | `/api/tasks/:id` | Implemented |
| GET | `/api/decisions` | Implemented |
| POST | `/api/meetings/analyze` | Implemented |
| POST | `/api/meetings/transcribe` | Implemented |
| POST | `/api/decisions/compare` | Implemented |
| POST | `/api/assistant/chat` | Implemented |

Example health response:

```json
{
  "data": {
    "status": "ok",
    "storage": "json-file",
    "ai": { "configured": false, "provider": "Google Gemini", "model": "gemini-2.5-flash" },
    "counts": { "meetings": 0, "tasks": 0, "decisions": 0 }
  }
}
```

---

## Data model

- **Meeting** — title, date, transcript, executive summary, full structured analysis, timestamps.
- **Task** — meeting reference, title, description, owner, deadline, status (`pending`, `in_progress`, `completed`).
- **Decision** — meeting reference, confirmed decision text, evidence, status.
- **Decision conflict** — previous decision, new decision, explanation, review status.

The local fallback database is created automatically at `backend/data/db.json` on first use. It is excluded from git.

---

## Testing performed

- API: create/list/fetch meetings, task status updates, validation errors, 404 handling — all passing.
- Browser: desktop (1440px) and mobile (390px) layouts, sidebar navigation, active-route highlighting, task editing, status changes, filters, search, and empty states — verified in Chromium with zero console errors.
- Test data was removed after verification; the repository ships empty.

---

## Security notes

- `backend/.env` is gitignored and contains the only copy of the Gemini key.
- The key is never exposed through a `VITE_` variable or a frontend request.
- The frontend only calls the local API.
- Supabase service-role keys (when added) must stay on the backend; only the anon key may be used client-side with row-level security.

---

## Suggested next steps

1. Set a newly issued Gemini API key in `backend/.env`.
2. Run `backend/supabase/schema.sql` in the Supabase SQL editor.
3. Enable an authentication provider for magic-link sign-in.
4. Add a Supabase storage adapter and migrate the local JSON records.

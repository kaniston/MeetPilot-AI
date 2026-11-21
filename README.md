# MeetPilot AI
### From Conversations to Decisions. From Decisions to Action.

<p align="center">
  <strong>An AI-Powered Meeting Intelligence Platform</strong>
</p>

<p align="center">
  Transform meeting conversations into meaningful summaries, decisions, tasks, and actionable insights using Artificial Intelligence.
</p>

<p align="center">
  <a href="https://meetpilot-ai-ten.vercel.app/">
    <img src="https://img.shields.io/badge/LIVE%20DEMO-Visit%20MeetPilot%20AI-637653?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo">
  </a>
  <a href="https://github.com/kaniston/MeetPilot-AI">
    <img src="https://img.shields.io/badge/GitHub-Repository-263329?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=flat-square&logo=react&logoColor=black">
  <img src="https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=flat-square&logo=vite&logoColor=white">
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=nodedotjs&logoColor=white">
  <img src="https://img.shields.io/badge/Express.js-API-000000?style=flat-square&logo=express&logoColor=white">
  <img src="https://img.shields.io/badge/Google%20Gemini-AI-8E75B2?style=flat-square&logo=googlegemini&logoColor=white">
  <img src="https://img.shields.io/badge/Supabase-Database-3FCF8E?style=flat-square&logo=supabase&logoColor=white">
</p>

---

## Overview

**MeetPilot AI** is an AI-powered meeting intelligence platform designed to simplify meeting documentation and improve productivity.

Meetings often contain valuable discussions, important decisions, and responsibilities. However, manually organizing this information can be time-consuming and challenging.

MeetPilot AI uses Artificial Intelligence to transform meeting transcripts and supported audio input into structured information.

It helps users understand what happened during a meeting, what decisions were discussed, and what actions need to happen next.

### Live Application

**Try MeetPilot AI:**  
https://meetpilot-ai-ten.vercel.app/

---

## The Problem

Traditional meeting management often creates several challenges:

- Important discussion points may be forgotten.
- Manual note-taking consumes time.
- Decisions are difficult to track.
- Task ownership may be unclear.
- Deadlines and follow-ups can be missed.
- Meeting information becomes scattered across documents.

## Our Solution

MeetPilot AI brings meeting intelligence into one organized workspace.

It helps users:

- Generate AI-powered meeting summaries.
- Identify important discussion points.
- Extract decisions and action items.
- Track responsibilities and deadlines.
- Identify unresolved questions and risks.
- Maintain organized meeting history.
- Ask questions about available meeting information.

---

## Key Features

| Feature | Description |
|---|---|
| Dashboard | Overview of meetings, tasks, and decisions |
| Meeting Management | Create and organize meeting records |
| Transcript Input | Submit meeting transcripts for analysis |
| Audio Recording | Capture supported browser audio |
| AI Analysis | Generate structured meeting insights |
| Smart Summaries | Convert long discussions into concise summaries |
| Decision Tracking | Review and manage meeting decisions |
| Task Management | Organize action items and their status |
| Meeting History | Access previous meeting information |
| AI Assistant | Ask questions using available meeting context |
| Report Generation | Prepare structured meeting reports |

*Feature availability depends on the configured services and application deployment.*

---

## How It Works

```text
        USER
          |
          v
    CREATE MEETING
          |
          v
  TRANSCRIPT / AUDIO INPUT
          |
          v
     AI PROCESSING
      (GEMINI API)
          |
          v
   MEETING ANALYSIS
          |
    +-----+-----+
    |     |     |
    v     v     v
 SUMMARY DECISIONS TASKS
    |     |     |
    +-----+-----+
          |
          v
     HUMAN REVIEW
          |
          v
    SAVE & TRACK
          |
          v
    MEETING HISTORY
```

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React.js | Component-based user interface |
| Vite | Fast development and production builds |
| JavaScript ES6+ | Application functionality |
| CSS3 | Responsive styling and visual design |
| Lucide React | Interface icons |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API development |
| Google GenAI SDK | Gemini AI integration |

### Database & Services

| Technology | Purpose |
|---|---|
| Supabase | Database and authentication integration |
| Google Gemini API | AI-powered meeting analysis |
| MediaRecorder API | Browser audio recording |
| Web Speech API | Supported browser speech recognition |
| Git & GitHub | Version control and project management |
| Vercel | Frontend hosting |

---

## AI Capabilities

MeetPilot AI uses Google Gemini to analyze meeting content and generate structured outputs.

The analysis can include:

- Executive summaries
- Discussion points
- Confirmed decisions
- Suggested decisions
- Action items
- Responsible owners when explicitly mentioned
- Deadlines when explicitly mentioned
- Unresolved questions
- Risks and dependencies

**Human Review:** AI-generated suggestions should be reviewed before becoming confirmed meeting records. The system should not invent task owners or deadlines.

---

## System Architecture

```text
       REACT FRONTEND
             |
             v
       EXPRESS API
             |
       +-----+------+
       |            |
       v            v
   GEMINI API    SUPABASE
       |            |
       v            v
   AI RESULTS   DATA STORAGE
       |            |
       +------+-----+
              |
              v
       FRONTEND DISPLAY
```

---

## Project Structure

```text
MeetPilot-AI/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── services/
│   ├── supabase/
│   ├── package.json
│   └── .env
│
├── .gitignore
├── package.json
└── README.md
```

*The structure above illustrates the main project organization; individual folders may vary in the current implementation.*

---

## Installation & Setup

### Prerequisites

- Node.js
- npm
- Git
- Visual Studio Code
- Supabase account
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/kaniston/MeetPilot-AI.git
```

### 2. Navigate to the Project

```bash
cd MeetPilot-AI
```

### 3. Install Dependencies

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
```

### 4. Configure Environment Variables

Create the appropriate environment files based on the existing project configuration.

Frontend environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Backend environment variables:

```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
GEMINI_MODEL=your_supported_gemini_model
```

Use the exact variable names required by the application code. Never commit real API keys or secret credentials.

### 5. Start the Application

```bash
npm run dev
```

The frontend and backend development servers are started using the root development script, if configured.

---

## Production Build

Build the frontend:

```bash
npm --prefix frontend run build
```

The production build generates optimized static assets in:

```text
frontend/dist/
```

The frontend build has been verified successfully with Vite, including code splitting.

---

## Security Considerations

- Keep Gemini API keys on the backend.
- Never expose service-role keys in frontend code.
- Use appropriate Supabase Row Level Security policies.
- Validate incoming API requests.
- Protect meeting records with authentication and authorization.
- Use persistent database storage for production.
- Do not commit `.env` files to GitHub.

---

## Future Enhancements

The following are potential future improvements:

- Real-time collaborative meetings
- Multilingual speech transcription
- Speaker identification
- Calendar integration
- Email notifications and reminders
- Advanced meeting analytics
- External task-management integrations
- Improved meeting search and filtering

---

## Deployment

**Frontend Demo:**  
https://meetpilot-ai-ten.vercel.app/

**Source Code:**  
https://github.com/kaniston/MeetPilot-AI

The frontend is deployed using Vercel. Backend production availability, API connectivity, and persistent Supabase storage should be verified separately.

---

## Project Goals

MeetPilot AI aims to make meeting outcomes more organized, accessible, and actionable.

It is designed to help individuals and teams spend less time organizing meeting notes and more time completing meaningful work.

---

## Developer

**Kaniston S.**

B.Sc. Computer Science Student  
Loyola College

Interested in Full-Stack Development, Artificial Intelligence, and building practical software solutions.

<p align="center">
  <strong>MeetPilot AI</strong>
  <br>
  <em>From Conversations to Decisions. From Decisions to Action.</em>
</p>

<p align="center">
  Built with dedication and powered by AI.
</p>

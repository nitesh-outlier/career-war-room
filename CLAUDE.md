# AI Career War Room

## Project Overview
Multi-agent AI debate platform for career decisions. 5 AI advisors debate
across 3 rounds, then synthesize a War Room Brief.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + Framer Motion (port 5173)
- Backend: Node.js + Express (port 3001)
- AI: Anthropic Claude API (claude-sonnet-4-20250514)
- Streaming: Server-Sent Events (SSE)

## How to Run
```bash
# Backend
cd backend && npm run dev

# Frontend (separate terminal)
cd frontend && npm run dev
```

## Conventions
- ES modules (import/export, not require)
- Async/await everywhere
- Tailwind CSS for all styling (no separate CSS files)
- All AI agent logic in /backend/agents/
- All API routes in /backend/server.js
- Component files use PascalCase.jsx
- Dark theme with amber/gold (#d4a853) accents

## Environment
- ANTHROPIC_API_KEY in .env (never commit this)

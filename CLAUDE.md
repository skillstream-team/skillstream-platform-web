# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server on http://localhost:3000 (esbuild + express, hot-reload)
npm run build        # Production build to dist/
npm run typecheck    # tsc --noEmit (zero errors expected)
npm run lint         # ESLint, max-warnings 0
npm run quality      # typecheck + lint + build (full pre-push check)

npm run backend:test # Run edge function unit tests (node --test)

supabase start       # Start local Supabase (requires Docker)
supabase db reset    # Apply all migrations from scratch locally
supabase db push     # Push new migrations to remote (prompts for confirmation)
supabase functions deploy          # Deploy all edge functions to remote
supabase functions deploy <name>   # Deploy one edge function
```

**Kill dev server if port 3000 is busy:** `kill -9 $(lsof -ti:3000)`

## Architecture

### Bundler
This project uses a **custom esbuild + express dev server** (`scripts/dev.js`), not Vite. CSS is processed separately via PostCSS/Tailwind and written to `dist/bundle.css`. JS entry is `src/main.tsx` → `dist/bundle.js`. Environment variables are inlined at build time via esbuild `define` — they must be prefixed `REACT_APP_`.

### State management
All app state lives in **Zustand stores** (`src/store/`):
- `auth.ts` — session, user, login/register/logout. Owns the **demo mode** logic.
- `teacherHub.ts` — the primary data store (2400+ lines). Classes, lessons, students, assignments, messages, conversations, payments. Every page reads from here.
- `adminHub.ts` — admin-only data (users, invites, system stats).
- `preferences.ts` — per-user preferences (notifications, AI features, etc.).
- `sessionUi.ts` — live session UI state (Daily.co frame, recording, chat).
- `theme.ts` — light/dark/system theme.

### Demo mode
Three hardcoded accounts bypass Supabase entirely and use localStorage:
- `teacher@skillstream.demo` / `student@skillstream.demo` / `admin@skillstream.demo`
- Password: `SkillStreamDemo123!`
- Controlled by `REACT_APP_ENABLE_DEMO_ACCOUNTS` (defaults `true`)
- The `isDemoUser()` check is used throughout stores to branch between local state mutations and Supabase calls.

### Supabase integration
`src/lib/supabase.ts` exports `supabase` (client) and `hasSupabaseConfig` (boolean). Every store action guards with `if (!hasSupabaseConfig) { /* demo path */ return; }` before touching Supabase. Without env vars the app runs fully in demo mode.

Required env vars (`.env` or `.env.local`):
```
REACT_APP_SUPABASE_URL=https://<ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>
REACT_APP_DAILY_DEFAULT_DOMAIN=<domain>.daily.co
```

### Routing & access control
Three route guards in `App.tsx`:
- `ProtectedRoute` — requires any logged-in user
- `PublicRoute` — redirects logged-in users to `/dashboard`
- `RoleRoute` — requires specific roles (`TEACHER`, `STUDENT`, `ADMIN`)

Roles are uppercase in the frontend (`TEACHER`/`STUDENT`/`ADMIN`) and lowercase in the database (`teacher`/`student`/`admin`). `mapRole()` in `auth.ts` handles the conversion.

### Theming
Two CSS variable namespaces defined in `src/styles/index.css`:
- `--hub-*` — used in teacher/admin hub pages (blue primary)
- `--edu-*` — used in student-facing and auth pages (navy primary)

Dark mode is toggled via `document.documentElement.classList.toggle('dark', ...)` and overrides both sets of variables under `.dark {}`.

### Live sessions
`LiveSessionPage.tsx` integrates Daily.co (`@daily-co/daily-js`). The flow:
1. Teacher calls `daily-token` edge function to get a room URL + owner token
2. Students call it to get a participant token
3. `daily-webhook` edge function receives recording/attendance events from Daily

`src/lib/realtime.ts` subscribes to Supabase Realtime postgres_changes for `direct_messages` and `class_messages`. Requires `replica identity full` on both tables (already applied).

### Edge functions
Located in `supabase/functions/`. Shared utilities in `_shared/`. Required secrets:
- `DAILY_API_KEY` — for `daily-token`, `daily-recording`, `daily-webhook`
- `DAILY_WEBHOOK_HMAC` — for webhook signature verification
- `OPS_CRON_SECRET` — for `ops-cron` scheduled trigger

### Data types
Canonical TypeScript interfaces for hub data are in `src/data/teacherHub.ts`. The Supabase row types (snake_case) are defined inline inside `src/store/teacherHub.ts` and mapped to the camelCase interface types before being stored in state.

### Payments
`PaymentsPage.tsx` has the full UI (Creator/Studio/Academy plan tiers + learner invoices table) but **no payment backend**. The database schema is ready for Stripe integration — this is the only major remaining feature.

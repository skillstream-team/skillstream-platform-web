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
- `sessionUi.ts` — live session UI state (recording, chat).
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
`LiveSessionPage.tsx` integrates **SignalWire** (`@signalwire/js`) for video/audio. The flow:
1. Teacher or student calls `signalwire-token` edge function — it calls SignalWire's REST API and returns a short-lived room token
2. Frontend creates `Video.RoomSession({ token, rootElement })` — SignalWire handles WebRTC and renders video tiles into `rootElement`
3. Participant list is maintained via `room.joined` / `member.joined` / `member.left` / `member.updated` events
4. Teacher mute/kick signals use Supabase Realtime broadcast on `session:<roomName>`; teacher-initiated removes also use `roomSession.removeMember()`
5. Recording uses browser `getDisplayMedia` + `MediaRecorder` → Supabase Storage `recordings` bucket

Required Supabase secrets: `SIGNALWIRE_SPACE_URL`, `SIGNALWIRE_PROJECT_ID`, `SIGNALWIRE_API_TOKEN`

`src/lib/signalwireLive.ts` — types (`SWSessionConfig`, `SWParticipant`, `LiveSessionMode`) and `roomNameFromLessonId()`.
`src/lib/realtime.ts` subscribes to Supabase Realtime postgres_changes for `direct_messages` and `class_messages`. Requires `replica identity full` on both tables (already applied).

### Edge functions
Located in `supabase/functions/`. Shared utilities in `_shared/`. Required secrets:
- `SIGNALWIRE_SPACE_URL`, `SIGNALWIRE_PROJECT_ID`, `SIGNALWIRE_API_TOKEN` — for `signalwire-token`
- `ANTHROPIC_API_KEY` — for all `ai-*` edge functions
- `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `DODO_ENV`, `DODO_PRODUCT_CREATOR`, `DODO_PRODUCT_STUDIO`, `DODO_PRODUCT_ACADEMY`, `DODO_PRODUCT_LESSON` — for `dodo-checkout` / `dodo-webhook`
- `OPS_CRON_SECRET` — for `ops-cron` scheduled trigger

Note: `daily-token`, `daily-recording`, `daily-webhook` are legacy functions that are no longer called by the frontend. They reference the dropped `daily_room_url` column and should be deleted once confirmed unused.

### Data types
Canonical TypeScript interfaces for hub data are in `src/data/teacherHub.ts`. The Supabase row types (snake_case) are defined inline inside `src/store/teacherHub.ts` and mapped to the camelCase interface types before being stored in state.

### Payments
`PaymentsPage.tsx` has the full UI (Creator/Studio/Academy plan tiers + learner invoices table). The payment backend is implemented via **Dodo Payments**: `dodo-checkout` edge function creates a hosted checkout session and returns a redirect URL; `dodo-webhook` handles `subscription.active`, `subscription.cancelled`, `subscription.renewed`, and `payment.succeeded` (lesson tickets) events and writes to `teacher_subscriptions`. Requires Dodo secrets to be set before payments go live.

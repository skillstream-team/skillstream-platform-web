# SkillStream Backend Setup (Supabase + Daily)

This project now includes a production-grade Supabase backend starter:
- Core schema + RLS policies
- Learning feature schema (messages, assignments, topic insights, student insights, user preferences)
- Billing plan model for your hybrid pricing
- Live session config + paid one-off purchase gating
- Daily token edge function
- Daily webhook edge function stub for attendance sync
- Analytics ingestion edge function (rate-limited)
- Ops cron edge function (analytics rollup + maintenance)
- Rule-based AI helper functions (`ai-insights`, `ai-summarize`, `ai-tutor`) with no external model dependency

## 1) Prerequisites
- Supabase CLI installed
- Docker running (for local Supabase)
- A Supabase project (cloud)
- A Daily account + API key

## 2) Local setup
From project root:

```bash
supabase start
supabase db reset
```

This applies:
- `/supabase/migrations/20260412154500_init_skillstream_core.sql`
- `/supabase/migrations/20260412162000_learning_features.sql`
- `/supabase/migrations/20260412173500_user_preferences.sql`
- `/supabase/migrations/20260412180500_admin_hub.sql`
- `/supabase/migrations/20260412184000_admin_auth_hardening.sql`
- `/supabase/migrations/20260412191500_ops_analytics_security_auth.sql`
- `/supabase/migrations/20260412203000_admin_dispatch_and_notifications.sql`
- `/supabase/migrations/20260412214500_security_hardening_invites_and_ai.sql`
- `/supabase/migrations/20260412223000_invite_expiry_defaults.sql`

## 3) Deploy DB schema to cloud

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## 4) Deploy edge functions

```bash
supabase functions deploy daily-token
supabase functions deploy daily-webhook
supabase functions deploy analytics-ingest
supabase functions deploy ops-cron
supabase functions deploy ai-insights
supabase functions deploy ai-summarize
supabase functions deploy ai-tutor
```

Set required secrets:

```bash
supabase secrets set DAILY_API_KEY=<daily_api_key>
supabase secrets set DAILY_WEBHOOK_HMAC=<base64_hmac_from_daily_webhook>
supabase secrets set OPS_CRON_SECRET=<strong_random_secret>
```

Supabase automatically provides:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 5) Daily configuration
In Daily dashboard:
1. Create your domain/rooms strategy.
2. Configure webhook URL to:
`https://<your-project-ref>.functions.supabase.co/daily-webhook`
3. Daily will send `X-Webhook-Signature` and `X-Webhook-Timestamp`.
Use the webhook `hmac` value (base64) from Daily as `DAILY_WEBHOOK_HMAC` in Supabase secrets.

## 6) What the backend already supports
- User profiles with roles: `teacher`, `student`, `admin`
- Classes, class members, lessons
- Lesson-level Daily live setup:
  - `daily_room_url`
  - `session_mode` (`free` or `paid`)
  - `ticket_price_gbp`
- Paid one-off event purchases (`lesson_live_purchases`)
- Attendance events (`live_attendance_events`)
- Hybrid pricing plans and teacher subscriptions

## 7) Security model (RLS)
RLS is enabled on all core tables.
- Students can only read their own or enrolled class data.
- Teachers can manage their own classes/lessons/live configs.
- Paid one-off join is gated by `lesson_live_purchases.status = 'paid'`.
- Admin has full control.

## 8) Frontend integration target (next step)
Auth + core workspace + settings are now Supabase-backed in the frontend code.
Remaining backend-to-frontend work after this setup is mostly:
1. Payments backend integration (currently intentionally deferred)
2. Live token wiring in frontend join flow for production rollout
3. Attendance/reporting enrichment via `daily-webhook`

## 9) Environment variables for frontend
Frontend now requires Supabase config:

```bash
REACT_APP_SUPABASE_URL=https://<your-project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<your-anon-key>
```

You can find these in Supabase dashboard:
- Project Settings -> API

You also have Daily room suggestion support in frontend.
Add:

```bash
REACT_APP_DAILY_DEFAULT_DOMAIN=<your-domain>.daily.co
```

## 10) Important note
Payment provider integration (Stripe/etc.) is intentionally not implemented yet, per your scope.
The schema is ready so we can plug payments in without redesign.

## 11) New backend additions (admin/auth hardening)
- Teacher signup is invite-based for role `teacher`.
- Admin can generate/revoke teacher invites from the admin UI.
- Admin broadcasts now support dispatch RPC and in-app notification fanout.
- Background ops can run through `ops-cron` (intended for scheduled trigger).
- AI-looking UI surfaces are wired to rule-based backend logic, so you can swap internals to OpenAI later without changing function names.

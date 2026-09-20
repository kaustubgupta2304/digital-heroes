# Digital Heroes

A full-stack implementation of the Digital Heroes Level 1 PRD: subscription-led golf score tracking, monthly draws, prize-pool logic, charity selection, winner verification data model, user dashboard and admin operations.

## Stack
- Next.js 15 + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- Stripe Checkout route (optional live payment configuration)
- Vercel deployment

## Local setup
1. Create a new Supabase project and run `supabase/schema.sql` in SQL Editor.
2. Copy `.env.example` to `.env.local` and fill Supabase values.
3. `npm install && npm run dev`.
4. Register a user. To make an admin, run: `update public.profiles set role='admin' where id='<AUTH_USER_UUID>';`
5. For live payments, add Stripe secret/webhook keys and set `NEXT_PUBLIC_APP_URL`.

## Deployment
Use a fresh Vercel account and a fresh Supabase project as required by the PRD. Add all variables from `.env.example` to Vercel. The public site, auth, dashboard and admin panel are then available at the Vercel URL.

## Notes on PRD ambiguity
A score ticket is modeled as the user's latest five Stableford scores; the monthly draw selects five unique numbers in the 1–45 Stableford range. Winners can then be recorded at 3/4/5-match tiers. This interpretation is isolated in the draw data model so the algorithm can be replaced without changing the UI.

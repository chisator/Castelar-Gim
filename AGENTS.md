# AGENTS.md — Castelar Gimnasio

## Overview

Gym management PWA for Castelar Gimnasio. Members (deportistas) view routines and log workouts; trainers (entrenadores) create routines for assigned members; admins manage users, classes, banners, and notifications.

## Tech Stack

- **Framework:** Next.js 14 (App Router, `output: 'standalone'`)
- **Language:** TypeScript (strict mode)
- **UI:** React 18, Tailwind CSS v4, shadcn/ui (new-york style, `@/components/ui`)
- **Database/Auth:** Supabase (SSR package `@supabase/ssr`)
- **PWA:** `@ducanh2912/next-pwa`
- **Forms:** react-hook-form + zod
- **Deployment:** Docker (see `Dockerfile`)

## Commands

| Action | Command |
|---|---|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Production start | `npm start` |

Always run `npm run lint` after changes. There is no separate typecheck script — `tsc --noEmit` can be run manually.

## Project Structure

```
app/
  layout.tsx          # Root layout with ThemeProvider, BottomNav, GlobalNotification
  page.tsx            # Landing page
  template.tsx        # Page transition template
  auth/               # Login & sign-up (public routes)
  admin/              # Admin dashboard (users, routines, exercises, banners, notifications)
  entrenador/         # Trainer dashboard (create/edit routines)
  deportista/         # Member dashboard (view routines, log workouts, progress)
  unauthorized/       # Unauthorized page
  actions/            # Server Actions ("use server") — all DB operations go here
components/           # Shared client components
components/ui/        # shadcn/ui primitives
lib/
  server.ts           # createServerClient() — for Server Components & Actions
  client.ts           # createBrowserClient() — for Client Components
  middleware.ts        # Session refresh + role-based route protection
  utils.ts            # cn() helper
supabase/migrations/  # SQL schema migrations
```

## Key Conventions

- **Language:** All UI text, comments, and user-facing strings are in **Spanish**.
- **Server Actions:** All database mutations live in `app/actions/*.ts` files with `"use server"` directive. Never call Supabase directly from components.
- **Supabase clients:** Use `lib/server.ts` (server components/actions) or `lib/client.ts` (client components). Never mix them.
- **Admin operations** that need elevated permissions use `SUPABASE_SERVICE_ROLE_KEY` with a separate `createClient` from `@supabase/supabase-js` (not the SSR one).
- **Role system:** Three roles stored in `profiles.role` and synced to `auth.users.raw_user_meta_data` via trigger: `deportista`, `entrenador`, `administrador`.
- **Route protection:** Middleware in `lib/middleware.ts` handles auth redirects and role-based access. `/admin/ejercicios` and `/admin/eventos` are also accessible to trainers.
- **Path aliases:** `@/*` maps to project root (e.g., `@/components`, `@/lib`).
- **Component library:** Use shadcn/ui components from `@/components/ui`. Add new ones with `npx shadcn@latest add <component>`.
- **Styling:** Tailwind CSS v4 with `tailwind-merge` and `clsx` via `cn()` utility. Dark mode supported via `next-themes`.
- **Forms:** Use `react-hook-form` with `zod` resolvers for validation.
- **Toast notifications:** Use `sonner` (imported from `@/components/ui/sonner`).
- **Icons:** `lucide-react`.
- **Dates:** `date-fns`.

## Database Tables (Key)

| Table | Purpose |
|---|---|
| `profiles` | User profiles with role, credits, linked to `auth.users` |
| `routines` | Workout routines created by trainers |
| `routine_user_assignments` | Which routines are assigned to which members |
| `trainer_user_assignments` | Which trainers are assigned to which members |
| `workout_logs` / `workout_log_entries` | Member workout history |
| `exercise_catalog` | Shared exercise library |
| `gym_classes` | Scheduled classes/events |
| `reservations` | Class bookings by members |
| `sports` | Sport/activity types |

## Common Pitfalls

1. **Two Supabase clients:** `lib/server.ts` uses `@supabase/ssr` (cookie-based). Admin actions import `createClient` from `@supabase/supabase-js` directly for service-role access. Don't confuse the two imports.
2. **`cookies()` is async:** In Next.js 14+, `cookies()` returns a Promise. Always `await cookies()`.
3. **No `revalidatePath` in components:** Only call it inside Server Actions.
4. **Middleware matcher:** Static assets are excluded. Don't add API routes to the matcher without considering auth.
5. **Docker build:** Requires `@tailwindcss/oxide-linux-x64-gnu` installed explicitly (see `Dockerfile`).
6. **User deletion cascade:** Deleting a user requires cleaning up assignments, routines, logs, and classes in the correct order due to FK constraints. See `deleteUser` in `admin-actions.ts`.
7. **RLS policies:** Most tables have Row Level Security enabled. Queries respect the authenticated user's role. Admin bypass uses `is_admin()` SQL function.
8. **PWA disabled in dev:** Service worker is only active in production (`process.env.NODE_ENV === "development"` disables it).

## Environment Variables

| Variable | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server only, for admin ops) |

# Writers Room

A collaborative writing platform where authors publish projects, invite editors, manage suggestions, and discover contributors.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm --filter @workspace/writers-room run dev` — Frontend (uses $PORT)
- `pnpm --filter @workspace/db run push` — Push DB schema (has unique-constraint bug; prefer direct SQL)
- Requires: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Set `ADMIN_EMAIL` to the email of the first admin user — on each boot the server promotes that address to `is_admin = true`

## Stack

- **Monorepo**: pnpm workspaces, TypeScript 5.9, Node 24
- **API**: Express 5 + tsx dev runner, Drizzle ORM, PostgreSQL
- **Frontend**: React + Vite + Tailwind + shadcn/ui + Wouter + React Query + Framer Motion
- **Auth**: Custom JWT (no library) — Google OAuth callback at `/auth/callback`

## Where Things Live

- `artifacts/api-server/src/routes/` — all API route files
- `artifacts/writers-room/src/pages/` — all page components
- `lib/db/src/schema/` — Drizzle table definitions (source of truth)
- `artifacts/writers-room/src/hooks/use-auth.tsx` — AuthContext + `updateUser()`
- User credentials JSON stored in `users.credentials` TEXT column

## Architecture Decisions

- **Direct SQL for new tables**: drizzle-kit push has unique constraint issues — always `CREATE TABLE IF NOT EXISTS` via `psql $DATABASE_URL` directly
- **Route ordering**: `searchRouter` + `pitchesRouter` BEFORE `publishingRouter` + `projectsRouter`; `GET /users/me` MUST come before any `GET /users/:id` parameterized route
- **No email in public APIs**: `GET /contributors/search` and `GET /users/:id/public` never return email; messaging is in-app only
- **Auth state**: stored in localStorage key `writers_room_user` and AuthContext; use `updateUser()` to sync both after PATCH
- **Credentials**: JSON blob in `users.credentials` — `{ professionalTitle?, isPublishedAuthor, publishedWorks[], website?, linkedin?, patreon?, substack?, editingSpecialties?, experienceLevel?, availableForWork? }`

## Product

- **Projects**: Create book/script projects; full Fountain script editor; collaborator limits + join requests
- **Suggestions**: Contributors highlight text and suggest edits; owners accept/discard with diffs
- **Pitches**: Early-stage idea pitching with invites to contributors (`pitch_invites` table)
- **Contributors**: Discovery page with filtering by genre, specialty, experience; bookmarking/shortlisting
- **Public Profiles**: `/profile/:id` — read-only public profile (no email exposed)
- **In-app Messaging**: Authors message contributors directly; inbox visible on contributor's profile page
- **Shortlist**: Authors star/bookmark contributors; shortlist shown on author's profile page
- **Publishing**: Granular visibility and feedback controls; browse + rate published projects
- **Google OAuth**: Full sign-in/sign-up flow

## Gotchas

- `GET /users/:id/public` uses `/public` suffix to avoid Express route conflicts with `/users/me`
- `messages` and `contributor_bookmarks` tables created via direct SQL (not drizzle schema push)
- Frontend TypeScript `tsc --noEmit` has pre-existing errors (isAdmin, api-zod exports) unrelated to features — runtime is fine via tsx
- `suggestionsTable` uses `submitterId` (not contributorId) for the contributor FK

## Pointers

- DB schema: `lib/db/src/schema/`
- API routes skill: `.local/skills/pnpm-workspace/SKILL.md`

# Writers Room

## Overview

Writers Room is a collaborative writing platform where authors upload books/scripts, invite collaborators, and manage suggested edits with accept/discard workflows.

## Key Features

- **Fountain Script Editor**: Script-type projects have a fullscreen block-based screenplay editor (Tab cycles element types: Scene Heading, Action, Character, Dialogue, Parenthetical, Transition)
- **Fountain Rendering**: Reading view for scripts parses and renders Fountain format with proper screenplay layout
- **Collaborator Limit**: Owners can set a cap on collaborator count (1–50)
- **Join Requests**: Non-collaborators can request to join; owners can accept/decline (with ownership terms disclosure)
- **Suggestions**: Collaborators highlight text and suggest edits; owners accept/discard
- **Pitches**: Early-stage idea pitching with responses
- **Publishing**: Granular readership and feedback controls
- **Browse & Rate**: Discover and rate published projects
- **Google OAuth**: Full Google sign-in/sign-up (callback at /auth/callback, token exchange at /api/auth/token/:token)
- **Credentials**: Multi-step sign-up with professional credentials (title, published works, website). Authors get 2 steps; contributors/both get 3 steps (basic → interests → credentials). Stored as JSON in `credentials` column. Published Author badge shown on contributor cards and profile.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Routing**: Wouter
- **Data fetching**: React Query + generated hooks
- **Animations**: Framer Motion

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── writers-room/       # React + Vite frontend (served at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- **users**: id, name, email (unique), createdAt
- **projects**: id, title, type (book/script), content, ownerId, createdAt, updatedAt
- **collaborators**: id, projectId, userId, addedAt (unique per project+user)
- **suggestions**: id, projectId, submitterId, originalText, suggestedText, comment, status (pending/accepted/discarded), ownerNote, createdAt, updatedAt

## Key Features

- **User identity**: No auth library; users enter name/email, stored in localStorage. API calls pass userId in body/query params.
- **Projects**: Create book/script projects with text content. View a dashboard of owned + collaborated projects.
- **Suggestions**: Collaborators select text in the document and suggest a replacement. The diff is shown (original in red, suggested in green).
- **Acceptance workflow**: Project owners accept (applies replacement to document content), discard, or leave notes on suggestions.
- **Invitations**: Owners invite collaborators by email (user must have signed in previously).

## API Routes

All routes under `/api`:

- `POST /users` — create/login user
- `GET /users/me?email=` — get user by email
- `GET /projects?userId=` — list user's projects
- `POST /projects` — create project
- `GET /projects/:id?userId=` — get project detail + role
- `PATCH /projects/:id` — update project (owner only)
- `DELETE /projects/:id` — delete project (owner only)
- `GET /projects/:id/collaborators` — list collaborators
- `POST /projects/:id/invite` — invite collaborator (owner only)
- `DELETE /projects/:id/collaborators/:collaboratorId` — remove collaborator (owner only)
- `GET /projects/:id/suggestions?status=` — list suggestions
- `POST /projects/:id/suggestions` — create suggestion (collaborators/owner)
- `PATCH /projects/:id/suggestions/:suggestionId` — accept/discard (owner only, accept applies text change)
- `DELETE /projects/:id/suggestions/:suggestionId` — delete (submitter or owner)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Development Commands

- `pnpm --filter @workspace/api-server run dev` — API server dev mode
- `pnpm --filter @workspace/writers-room run dev` — Frontend dev mode
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API types
- `pnpm --filter @workspace/db run push` — Push DB schema changes

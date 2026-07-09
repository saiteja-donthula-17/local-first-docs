# Local-First Docs

A **local-first, collaborative document editor** with offline editing, deterministic
(CRDT) conflict resolution, and safe version history — built for the House of EdTech
Full-Stack assignment.

> **Status:** Phases 1–5 complete — auth + tenant-scoped CRUD, a local-first
> (Tiptap + Yjs + IndexedDB) editor, real-time multi-client sync with live
> presence, server-enforced roles on the socket (Viewers can't push, even via a
> hacked client), and version history with CRDT-safe time-travel restore.
> AI features + deploy next.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, Turbopack) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Auth.js (NextAuth v5), Credentials + JWT sessions |
| Database | PostgreSQL + Prisma (local dev → Neon in prod) |
| CRDT / editor | Yjs + Tiptap (Collaboration + presence carets) |
| Realtime | Hocuspocus WebSocket server (Postgres-persisted) |
| Testing | Playwright (offline persistence + live convergence) |

## Monorepo layout

```
apps/web            Next.js 16 app (UI, API routes, server actions, auth)
apps/collab-server  Hocuspocus realtime server (Yjs relay + Postgres persistence)
packages/db         Shared Prisma schema + client (@repo/db)
```

## Local development

Prerequisites: Node 20+, a running PostgreSQL.

```bash
# 1. install
npm install

# 2. configure env
cp .env.example packages/db/.env          # Prisma CLI
cp .env.example apps/web/.env.local       # Next app (generate AUTH_SECRET: openssl rand -base64 32)
cp .env.example apps/collab-server/.env   # collab server (needs DATABASE_URL + PORT=1234)

# 3. database
npm run db:migrate    # apply schema
npm run db:seed       # seed demo users + a shared document

# 4. run BOTH the web app + the collab server
npm run dev           # web → http://localhost:3000 · ws → ws://localhost:1234
```

To see real-time sync: open the seeded document in two browsers (e.g. Alice +
Bob), and watch edits + cursors sync live. Toggle DevTools ▸ Network ▸ Offline
to confirm editing continues locally and re-syncs on reconnect.

### Demo accounts (password: `password`)

| Email | Role on the shared doc |
|---|---|
| alice@demo.dev | Owner |
| bob@demo.dev | Editor |
| carol@demo.dev | Viewer |

## Scripts

`npm run dev` (web + ws) · `npm run dev:web` · `npm run dev:server` ·
`npm run build` · `npm run lint` · `npm run test:e2e` · `npm run db:migrate` ·
`npm run db:seed` · `npm run db:studio`

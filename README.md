# Local-First Docs

A **local-first, collaborative document editor** with offline editing, deterministic
(CRDT) conflict resolution, and safe version history — built for the House of EdTech
Full-Stack assignment.

> **Status:** Phase 1 complete — monorepo, auth, and tenant-scoped document CRUD.
> Editor + offline sync + version history land in the following phases.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, Turbopack) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Auth.js (NextAuth v5), Credentials + JWT sessions |
| Database | PostgreSQL + Prisma (local dev → Neon in prod) |
| CRDT / editor | Yjs + Tiptap _(incoming)_ |
| Realtime | Hocuspocus WebSocket server _(incoming)_ |

## Monorepo layout

```
apps/web            Next.js 16 app (UI, API routes, server actions, auth)
apps/collab-server  Hocuspocus realtime server        (incoming)
packages/db         Shared Prisma schema + client (@repo/db)
```

## Local development

Prerequisites: Node 20+, a running PostgreSQL.

```bash
# 1. install
npm install

# 2. configure env (copy the example, then fill in DATABASE_URL + AUTH_SECRET)
cp .env.example packages/db/.env      # for the Prisma CLI
cp .env.example apps/web/.env.local   # for the Next app  (generate AUTH_SECRET: openssl rand -base64 32)

# 3. database
npm run db:migrate    # apply schema
npm run db:seed       # seed demo users + a shared document

# 4. run
npm run dev           # http://localhost:3000
```

### Demo accounts (password: `password`)

| Email | Role on the shared doc |
|---|---|
| alice@demo.dev | Owner |
| bob@demo.dev | Editor |
| carol@demo.dev | Viewer |

## Scripts

`npm run dev` · `npm run build` · `npm run lint` · `npm run db:migrate` ·
`npm run db:seed` · `npm run db:studio`

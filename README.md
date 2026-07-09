# Local-First Docs

A **local-first, collaborative document editor** with offline editing, deterministic
(CRDT) conflict resolution, and safe version history — built for the House of EdTech
Full-Stack assignment.

> **Status:** Feature-complete. Local-first (Tiptap + Yjs + IndexedDB) editor,
> real-time multi-client sync with live presence, server-enforced roles on the
> socket (Viewers can't push, even via a hacked client), CRDT-safe time-travel
> version restore, an AI "explain what changed" version-diff, and hardening
> (payload cap + rate limit, tenant isolation). CI green; ready to deploy.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, Turbopack) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Auth.js (NextAuth v5), Credentials + JWT sessions |
| Database | PostgreSQL + Prisma (local dev → Neon in prod) |
| CRDT / editor | Yjs + Tiptap (Collaboration + presence carets) |
| Realtime | Hocuspocus WebSocket server (Postgres-persisted) |
| AI | Vercel AI SDK + Groq (streamed "what changed" version-diff) |
| Testing | Vitest (unit) + Playwright (offline / convergence / restore) |

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

## Security & real-world considerations

### Authentication & authorization
Auth.js v5 (Credentials + JWT). Documents carry three roles via `DocumentAccess`:
**Owner / Editor / Viewer**. Page/API access is gated, and — critically — so is the
**WebSocket**: every connection presents a short-lived HMAC handshake token; the
collab server verifies it and looks up the user's role in the DB. Non-members are
**refused**, and **Viewers connect read-only** (the server drops any update they
send) — so a hacked client can't push edits. Covered by unit tests.

### How do we stop a malicious/malformed payload from OOMing the server?
1. **Transport cap** — the WS server drops any frame larger than **1 MB** *before*
   parsing it (`websocketOptions.maxPayload`). This is the primary OOM defense.
2. **App-level size check** — `beforeHandleMessage` rejects updates over the cap.
3. **Per-connection rate limit** — a token bucket (200 burst / 100 msg·s⁻¹) throttles
   floods; buckets are freed on disconnect so the map can't grow unbounded.
4. **API routes** — Zod validation + explicit caps (e.g. an 8 MB base64 ceiling on
   snapshot uploads) on every mutation.

### How do we ensure tenant isolation?
Every query is scoped through the `DocumentAccess` join — **never** a client-supplied
role or ownership claim — via a single `getAccess` / `assertAccess(userId, docId, minRole)`
choke point. Non-members receive a `404` (so existence isn't leaked) on pages and
APIs, and a refused socket. We use **strict ORM scoping** (equivalent to Postgres RLS,
with the policy kept in one auditable place).

### Document state growth over time
- **Yjs garbage collection** is enabled, collecting tombstones of deleted content.
- The server persists a single **compacted** `Y.encodeStateAsUpdate` snapshot per
  document (not an ever-growing op-log), debounced 2–10 s.
- Version snapshots are compacted binaries; auto-snapshots (e.g. the backup taken
  before a restore) can be pruned to the last *N* in production.
- Binary on the wire; base64 only at the JSON API boundary.

### Deployment & ops
- Next app → **Vercel**; collab server → **Render**; Postgres → **Neon**.
- Render's free tier sleeps after 15 min — a keep-warm health ping avoids a cold
  socket during evaluation; production would use an always-on instance.
- Realtime scale-out: Hocuspocus + Redis pub/sub across nodes (single node suffices
  here). The editor degrades gracefully to local-first when the socket is down.

### Performance
- **React Compiler** (Next 16) auto-memoizes components → no re-render lag while typing.
- The editor is **code-split** (dynamic import) to keep the initial bundle small.
- Yjs ships compact **incremental** updates, never whole-document diffs.

## Deployment

Three pieces: **Neon** (Postgres) · **Vercel** (Next app) · **Render** (collab server).
CI runs on every push (`.github/workflows/ci.yml`: lint, typecheck, unit + e2e, build).

**1. Database — Neon.** Create a project, copy the **pooled** connection string, then
apply the schema:
```bash
DATABASE_URL="<neon-url>" npm run db:migrate:deploy
DATABASE_URL="<neon-url>" npm run db:seed   # optional demo data
```

**2. Collab server — Render.** New → **Blueprint** → pick this repo (it reads
`render.yaml`). Set env vars: `DATABASE_URL` (Neon) and `COLLAB_TOKEN_SECRET`
(generate one). Note the URL, e.g. `https://local-first-collab.onrender.com`.

**3. Web app — Vercel.** Import the repo, set **Root Directory = `apps/web`**
(installs from the workspace root; Prisma generates via `@repo/db` postinstall).
Env vars:

| Var | Value |
|---|---|
| `DATABASE_URL` | Neon pooled URL |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` |
| `COLLAB_TOKEN_SECRET` | **same value as Render** |
| `NEXT_PUBLIC_WS_URL` | `wss://local-first-collab.onrender.com` |
| `GROQ_API_KEY` | optional — enables the AI diff |

**4. Keep-warm (optional).** Set the repo **variable** `COLLAB_SERVER_URL` to the
Render URL; `.github/workflows/keep-warm.yml` pings it every 10 min so the free
tier never cold-starts during evaluation.

## Scripts

`npm run dev` (web + ws) · `npm run dev:web` · `npm run dev:server` ·
`npm run build` · `npm run lint` · `npm run test:e2e` · `npm run db:migrate` ·
`npm run db:seed` · `npm run db:studio`

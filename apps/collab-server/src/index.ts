import "dotenv/config";
import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { prisma } from "@repo/db";

const port = Number(process.env.PORT ?? 1234);

/**
 * Hocuspocus WebSocket server — relays Yjs updates between collaborators and
 * persists a compacted document state to Postgres (Document.ydocState).
 *
 * Phase 3: sync + persistence.
 * Phase 4 will add `onAuthenticate` (JWT + role) so Viewers can't push updates.
 */
const server = new Server({
  port,

  // Debounce persistence so rapid typing doesn't hammer Postgres. Hocuspocus
  // calls store on a trailing debounce, with a hard ceiling via maxDebounce.
  debounce: 2000,
  maxDebounce: 10000,

  extensions: [
    new Database({
      // Cold start / new collaborator: hydrate the Y.Doc from the last snapshot.
      fetch: async ({ documentName }) => {
        const doc = await prisma.document.findUnique({
          where: { id: documentName },
          select: { ydocState: true },
        });
        return doc?.ydocState ? new Uint8Array(doc.ydocState) : null;
      },
      // Persist the compacted Y.Doc state. updateMany() = no throw if the row
      // was deleted mid-session; it just no-ops.
      store: async ({ documentName, state }) => {
        await prisma.document.updateMany({
          where: { id: documentName },
          data: { ydocState: new Uint8Array(state) },
        });
      },
    }),
  ],
});

server.listen().then(() => {
  // eslint-disable-next-line no-console
  console.log(`⚡ Collab server (Hocuspocus) listening on ws://localhost:${port}`);
});

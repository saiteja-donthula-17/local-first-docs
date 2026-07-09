import "dotenv/config";
import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { prisma } from "@repo/db";
import { authorizeConnection } from "./auth";

const port = Number(process.env.PORT ?? 1234);

/**
 * Hocuspocus WebSocket server — relays Yjs updates between collaborators and
 * persists a compacted document state to Postgres (Document.ydocState).
 *
 * Auth: every connection must present a valid handshake token AND have a
 * DocumentAccess row for the requested document; Viewers connect read-only.
 */
const server = new Server({
  port,

  // Reject connections that fail authorization; mark Viewers read-only so the
  // server drops any document updates a hacked Viewer client tries to send.
  onAuthenticate: async ({ token, documentName, connectionConfig }) => {
    const { userId, role, readOnly } = await authorizeConnection(
      token,
      documentName,
    );
    connectionConfig.readOnly = readOnly;
    return { userId, role };
  },

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

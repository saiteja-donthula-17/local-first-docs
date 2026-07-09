import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import { restoreSnapshotIntoDoc } from "./yjs-restore";

/** Replace the doc's default fragment with a single paragraph of `text`. */
function setParagraph(doc: Y.Doc, text: string) {
  const frag = doc.getXmlFragment("default");
  doc.transact(() => {
    frag.delete(0, frag.length);
    const p = new Y.XmlElement("paragraph");
    const t = new Y.XmlText();
    t.insert(0, text);
    p.insert(0, [t]);
    frag.insert(0, [p]);
  });
}

const readText = (doc: Y.Doc) => doc.getXmlFragment("default").toString();

/** Wire two docs together like a sync provider would, guarding against echo. */
function connect(a: Y.Doc, b: Y.Doc) {
  a.on("update", (u, origin) => {
    if (origin !== "peer") Y.applyUpdate(b, u, "peer");
  });
  b.on("update", (u, origin) => {
    if (origin !== "peer") Y.applyUpdate(a, u, "peer");
  });
}

describe("restoreSnapshotIntoDoc", () => {
  it("reverts document content to the snapshot", () => {
    const doc = new Y.Doc();
    setParagraph(doc, "version one");
    const snapshot = Y.encodeStateAsUpdate(doc);

    setParagraph(doc, "version two");
    expect(readText(doc)).toContain("version two");

    expect(restoreSnapshotIntoDoc(doc, snapshot)).toBe(true);
    expect(readText(doc)).toContain("version one");
    expect(readText(doc)).not.toContain("version two");
  });

  it("restores in place (same doc instance) and broadcasts to peers", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    connect(docA, docB);

    setParagraph(docA, "keep me");
    const snapshot = Y.encodeStateAsUpdate(docA);
    setParagraph(docA, "throwaway edit");
    expect(readText(docB)).toContain("throwaway edit"); // B is in sync

    const guidBefore = docA.guid;
    restoreSnapshotIntoDoc(docA, snapshot);

    // Same live doc (not replaced) — restore is a normal edit...
    expect(docA.guid).toBe(guidBefore);
    // ...that converged on the peer without any reset/reconnect.
    expect(readText(docB)).toContain("keep me");
    expect(readText(docB)).not.toContain("throwaway edit");
  });

  it("returns false on undecodable snapshot bytes", () => {
    const doc = new Y.Doc();
    expect(restoreSnapshotIntoDoc(doc, new Uint8Array([255, 255, 255, 255]))).toBe(
      false,
    );
  });
});

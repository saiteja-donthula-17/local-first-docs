import * as Y from "yjs";

function nodeText(node: Y.XmlElement | Y.XmlText | Y.XmlHook): string {
  if (node instanceof Y.XmlText) {
    return node
      .toDelta()
      .map((op: { insert?: unknown }) =>
        typeof op.insert === "string" ? op.insert : "",
      )
      .join("");
  }
  if (node instanceof Y.XmlElement) {
    return node
      .toArray()
      .map((child) => nodeText(child))
      .join("");
  }
  return "";
}

/**
 * Extract plain text from a Yjs document snapshot (Y.encodeStateAsUpdate bytes).
 * Top-level blocks are separated by newlines — enough context for an LLM to
 * describe what changed between two versions.
 */
export function snapshotToText(update: Uint8Array): string {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, update);
  const fragment = doc.getXmlFragment("default");
  const text = fragment
    .toArray()
    .map((node) => nodeText(node))
    .join("\n")
    .trim();
  doc.destroy();
  return text;
}

import * as Y from "yjs";

type XmlNode = Y.XmlElement | Y.XmlText;

/**
 * Deep-clone a Yjs XML node into fresh, unattached Yjs types. Yjs types can't be
 * moved between documents, so a version restore must rebuild them. (Tiptap docs
 * only ever contain XmlElement + XmlText — never XmlHook.)
 */
function cloneXmlNode(node: XmlNode): XmlNode {
  if (node instanceof Y.XmlText) {
    const text = new Y.XmlText();
    text.applyDelta(node.toDelta());
    return text;
  }
  const element = new Y.XmlElement(node.nodeName);
  const attrs = node.getAttributes();
  for (const key of Object.keys(attrs)) {
    element.setAttribute(key, attrs[key] as string);
  }
  element.insert(
    0,
    node.toArray().map((child) => cloneXmlNode(child as XmlNode)),
  );
  return element;
}

/**
 * CRDT-safe "time travel" restore.
 *
 * Rather than replacing/resetting the live Y.Doc (which would corrupt other
 * collaborators' sessions), we decode the snapshot into a scratch doc and, in a
 * single transaction on the LIVE doc, replace the shared fragment's children
 * with clones of the snapshot's. This is just another collaborative edit: it
 * broadcasts to everyone and merges deterministically with concurrent typing.
 *
 * Returns false if the snapshot couldn't be decoded.
 */
export function restoreSnapshotIntoDoc(
  liveDoc: Y.Doc,
  snapshotUpdate: Uint8Array,
  field = "default",
): boolean {
  const snapshotDoc = new Y.Doc();
  try {
    Y.applyUpdate(snapshotDoc, snapshotUpdate);
  } catch {
    return false;
  }

  const source = snapshotDoc.getXmlFragment(field);
  const target = liveDoc.getXmlFragment(field);

  liveDoc.transact(() => {
    target.delete(0, target.length);
    target.insert(
      0,
      source.toArray().map((child) => cloneXmlNode(child as XmlNode)),
    );
  });

  snapshotDoc.destroy();
  return true;
}

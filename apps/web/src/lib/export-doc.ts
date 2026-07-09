// Minimal ProseMirror-JSON → Markdown for the node types StarterKit provides.

type PMNode = {
  type?: string;
  text?: string;
  content?: PMNode[];
  marks?: { type: string }[];
  attrs?: Record<string, unknown>;
};

function applyMarks(text: string, marks?: { type: string }[]): string {
  let out = text;
  for (const m of marks ?? []) {
    if (m.type === "bold") out = `**${out}**`;
    else if (m.type === "italic") out = `*${out}*`;
    else if (m.type === "strike") out = `~~${out}~~`;
    else if (m.type === "code") out = `\`${out}\``;
  }
  return out;
}

function inline(node: PMNode): string {
  if (node.type === "text") return applyMarks(node.text ?? "", node.marks);
  return (node.content ?? []).map(inline).join("");
}

function block(node: PMNode): string {
  switch (node.type) {
    case "heading":
      return `${"#".repeat(Number(node.attrs?.level ?? 1))} ${(node.content ?? []).map(inline).join("")}`;
    case "paragraph":
      return (node.content ?? []).map(inline).join("");
    case "bulletList":
      return (node.content ?? [])
        .map((li) => `- ${(li.content ?? []).map(block).join(" ")}`)
        .join("\n");
    case "orderedList":
      return (node.content ?? [])
        .map((li, i) => `${i + 1}. ${(li.content ?? []).map(block).join(" ")}`)
        .join("\n");
    case "blockquote":
      return (node.content ?? []).map((c) => `> ${block(c)}`).join("\n");
    case "codeBlock":
      return "```\n" + (node.content ?? []).map((c) => c.text ?? "").join("") + "\n```";
    default:
      return (node.content ?? []).map(block).join("");
  }
}

export function docJsonToMarkdown(doc: unknown): string {
  const root = doc as PMNode;
  return (
    (root.content ?? [])
      .map(block)
      .filter((s) => s.length > 0)
      .join("\n\n")
      .trim() + "\n"
  );
}

export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function safeFilename(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "document"
  );
}

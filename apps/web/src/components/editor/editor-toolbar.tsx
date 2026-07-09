"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Check,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export type LocalSaveState = "loading" | "saving" | "saved";

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      data-active={active || undefined}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground",
        "disabled:pointer-events-none disabled:opacity-40",
        "data-active:bg-primary data-active:text-primary-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function LocalIndicator({
  state,
  className,
}: {
  state: LocalSaveState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
      aria-live="polite"
    >
      {state === "saved" ? (
        <>
          <Check className="size-3.5 text-emerald-500" aria-hidden />
          Saved locally
        </>
      ) : (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          {state === "loading" ? "Loading…" : "Saving…"}
        </>
      )}
    </span>
  );
}

export function WordCount({ editor }: { editor: Editor }) {
  const stats = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const text = e.getText().trim();
      return {
        words: text ? text.split(/\s+/).length : 0,
        chars: e.getText().length,
      };
    },
  });
  return (
    <span
      className="text-xs tabular-nums text-muted-foreground"
      title={`${stats.chars} characters`}
    >
      {stats.words} {stats.words === 1 ? "word" : "words"}
    </span>
  );
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      canUndo: e.can().undo?.() ?? false,
      canRedo: e.can().redo?.() ?? false,
    }),
  });

  return (
    <div className="editor-toolbar-root flex flex-wrap items-center gap-1 border-b border-border/60 px-2 py-1.5">
      <ToolbarButton
        label="Bold"
        active={s.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={s.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={s.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Inline code"
        active={s.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 !h-6" />

      <ToolbarButton
        label="Heading 1"
        active={s.h1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={s.h2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        active={s.bullet}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Ordered list"
        active={s.ordered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={s.quote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 !h-6" />

      <ToolbarButton
        label="Undo"
        disabled={!s.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!s.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

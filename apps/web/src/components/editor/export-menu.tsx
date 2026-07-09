"use client";

import type { Editor } from "@tiptap/react";
import { Download, FileDown, Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { docJsonToMarkdown, downloadText, safeFilename } from "@/lib/export-doc";

export function ExportMenu({
  editor,
  title,
}: {
  editor: Editor;
  title: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="gap-1.5" />}
      >
        <Download className="size-4" aria-hidden />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() =>
            downloadText(
              `${safeFilename(title)}.md`,
              docJsonToMarkdown(editor.getJSON()),
              "text/markdown",
            )
          }
        >
          <FileDown className="size-4" aria-hidden />
          Download Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden />
          Print / Save as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

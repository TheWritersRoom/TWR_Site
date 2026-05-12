import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import TiptapUnderline from "@tiptap/extension-underline";
import {
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
} from "lucide-react";
import { useEffect } from "react";

function plaintextToHtml(text: string): string {
  if (!text) return "<p></p>";
  if (text.trimStart().startsWith("<")) return text;
  return text
    .split(/\n\n+/)
    .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

interface ProseEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
}

export function ProseEditor({ initialContent, onChange }: ProseEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TiptapUnderline,
      CharacterCount,
    ],
    content: plaintextToHtml(initialContent),
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose-editor-content focus:outline-none",
        spellCheck: "true",
      },
    },
  });

  useEffect(() => {
    return () => { editor?.destroy(); };
  }, [editor]);

  if (!editor) return null;

  const words: number = editor.storage.characterCount.words();
  const chars: number = editor.storage.characterCount.characters();

  const toolBtn = (active: boolean) =>
    `inline-flex items-center justify-center rounded px-2 py-1.5 transition-colors ${
      active
        ? "bg-[#1A1614]/8 border border-[#1A1614]/25 text-[#1A1614]"
        : "border border-transparent text-[#7A6B5E] hover:bg-[#1A1614]/5 hover:text-[#1A1614]"
    }`;

  const labelBtn = (active: boolean) =>
    `px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
      active
        ? "bg-[#1A1614]/8 border border-[#1A1614]/25 text-[#1A1614]"
        : "border border-transparent text-[#7A6B5E] hover:bg-[#1A1614]/5 hover:text-[#1A1614]"
    }`;

  const sep = <div className="w-px h-5 bg-[#1A1614]/15 mx-0.5 self-center shrink-0" />;

  return (
    <div className="border border-[#1A1614]/15 shadow-sm bg-white rounded-sm overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="sticky top-[73px] z-10 border-b border-[#1A1614]/10 px-4 py-2 bg-[#F9F6EE] flex flex-wrap items-center gap-1 select-none">

        {/* Heading / paragraph types */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
            className={labelBtn(editor.isActive("heading", { level: 1 }))}
            title="Chapter heading (H1)"
          >
            Chapter
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
            className={labelBtn(editor.isActive("heading", { level: 2 }))}
            title="Section heading (H2)"
          >
            Section
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
            className={labelBtn(editor.isActive("heading", { level: 3 }))}
            title="Sub-heading (H3)"
          >
            Sub
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().setParagraph().run(); }}
            className={labelBtn(!editor.isActive("heading"))}
            title="Body paragraph"
          >
            Body
          </button>
        </div>

        {sep}

        {/* Inline formatting */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
            className={toolBtn(editor.isActive("bold"))}
            title="Bold (⌘B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
            className={toolBtn(editor.isActive("italic"))}
            title="Italic (⌘I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
            className={toolBtn(editor.isActive("underline"))}
            title="Underline (⌘U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {sep}

        {/* Alignment */}
        <div className="flex items-center gap-0.5">
          {([
            { align: "left",    Icon: AlignLeft,    label: "Align left" },
            { align: "center",  Icon: AlignCenter,  label: "Align centre" },
            { align: "right",   Icon: AlignRight,   label: "Align right" },
            { align: "justify", Icon: AlignJustify, label: "Justify" },
          ] as const).map(({ align, Icon, label }) => (
            <button
              key={align}
              type="button"
              onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign(align).run(); }}
              className={toolBtn(editor.isActive({ textAlign: align }))}
              title={label}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-2" />

        {/* Word / char counter */}
        <div className="text-[10px] text-[#7A6B5E] font-medium tabular-nums whitespace-nowrap">
          <span className="font-bold text-[#1A1614]">{words.toLocaleString()}</span>
          {" "}words
          <span className="mx-1.5 opacity-30">·</span>
          <span className="font-bold text-[#1A1614]">{chars.toLocaleString()}</span>
          {" "}chars
        </div>
      </div>

      {/* ── Editor area ─────────────────────────────────────────── */}
      <EditorContent editor={editor} className="px-12 py-14 min-h-[65vh]" />
    </div>
  );
}

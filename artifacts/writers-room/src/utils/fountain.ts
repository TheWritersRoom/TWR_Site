export type BlockType =
  | "scene-heading"
  | "action"
  | "character"
  | "parenthetical"
  | "dialogue"
  | "transition";

export type ScriptBlock = {
  id: string;
  type: BlockType;
  text: string;
};

let _idCounter = 0;
export function genId() {
  return `b${++_idCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

const SCENE_RE = /^(INT\.|EXT\.|I\/E\.|INT\/EXT\.|EST\.)/i;
const TRANSITION_WORDS = /^(FADE IN:|FADE OUT:|FADE TO:|CUT TO:|SMASH CUT TO:|WIPE TO:|DISSOLVE TO:|MATCH CUT TO:|JUMP CUT TO:|END OF ACT|TAG:|COLD OPEN:)/i;

export function parseFountain(content: string): ScriptBlock[] {
  if (!content.trim()) {
    return [{ id: genId(), type: "action", text: "" }];
  }

  const lines = content.split("\n");
  const blocks: ScriptBlock[] = [];
  let prevType: BlockType | "blank" = "blank";

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      prevType = "blank";
      continue;
    }

    // Forced scene heading
    if (trimmed.startsWith(".") && !trimmed.startsWith("..")) {
      blocks.push({ id: genId(), type: "scene-heading", text: trimmed.slice(1).trim().toUpperCase() });
      prevType = "scene-heading";
      continue;
    }

    // Forced character
    if (trimmed.startsWith("@")) {
      blocks.push({ id: genId(), type: "character", text: trimmed.slice(1).trim() });
      prevType = "character";
      continue;
    }

    // Transition (> prefix)
    if (trimmed.startsWith(">") && !trimmed.endsWith("<")) {
      blocks.push({ id: genId(), type: "transition", text: trimmed.slice(1).trim().toUpperCase() });
      prevType = "transition";
      continue;
    }

    // Parenthetical
    if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
      blocks.push({ id: genId(), type: "parenthetical", text: trimmed });
      prevType = "parenthetical";
      continue;
    }

    // Natural scene heading
    if (SCENE_RE.test(trimmed)) {
      blocks.push({ id: genId(), type: "scene-heading", text: trimmed.toUpperCase() });
      prevType = "scene-heading";
      continue;
    }

    // Transition keywords
    if (TRANSITION_WORDS.test(trimmed) || (trimmed.endsWith(":") && trimmed === trimmed.toUpperCase() && trimmed.length < 40)) {
      blocks.push({ id: genId(), type: "transition", text: trimmed.toUpperCase() });
      prevType = "transition";
      continue;
    }

    // Character name: all caps, preceded by blank/heading/transition, followed by content
    const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && !/[.]{2,}/.test(trimmed);
    const afterBreak = prevType === "blank" || prevType === "scene-heading" || prevType === "transition";
    const nextTrimmed = lines[i + 1]?.trim() ?? "";
    if (isAllCaps && afterBreak && nextTrimmed.length > 0 && !SCENE_RE.test(nextTrimmed)) {
      blocks.push({ id: genId(), type: "character", text: trimmed });
      prevType = "character";
      continue;
    }

    // Dialogue: follows character or parenthetical
    if (prevType === "character" || prevType === "parenthetical" || prevType === "dialogue") {
      blocks.push({ id: genId(), type: "dialogue", text: trimmed });
      prevType = "dialogue";
      continue;
    }

    // Default: action
    blocks.push({ id: genId(), type: "action", text: trimmed });
    prevType = "action";
  }

  return blocks.length > 0 ? blocks : [{ id: genId(), type: "action", text: "" }];
}

export function serializeFountain(blocks: ScriptBlock[]): string {
  const lines: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const prev = i > 0 ? blocks[i - 1] : null;

    const needsBlankBefore = (types: BlockType[]) =>
      prev && !types.includes(prev.type) && lines[lines.length - 1] !== "";

    switch (b.type) {
      case "scene-heading":
        if (needsBlankBefore([])) lines.push("");
        lines.push(b.text.toUpperCase());
        lines.push("");
        break;
      case "action":
        lines.push(b.text);
        lines.push("");
        break;
      case "character":
        if (prev && prev.type !== "scene-heading" && lines[lines.length - 1] !== "") lines.push("");
        lines.push(b.text.toUpperCase());
        break;
      case "parenthetical":
        lines.push(b.text.startsWith("(") ? b.text : `(${b.text})`);
        break;
      case "dialogue":
        lines.push(b.text);
        break;
      case "transition":
        if (lines[lines.length - 1] !== "") lines.push("");
        lines.push(`> ${b.text.toUpperCase()}`);
        lines.push("");
        break;
    }
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  "scene-heading": "Scene Heading",
  action: "Action",
  character: "Character",
  dialogue: "Dialogue",
  parenthetical: "Parenthetical",
  transition: "Transition",
};

export const BLOCK_CYCLE: BlockType[] = [
  "action",
  "scene-heading",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
];

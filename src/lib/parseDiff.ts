import type { DiffLine, Hunk } from "@/features/git/git.types";

const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/;

/**
 * Parse a unified-diff text (as emitted by `git diff`) into a list of hunks.
 * Skips the diff header lines (`diff --git`, `index`, `---`, `+++`).
 */
export function parseUnifiedDiff(diffText: string): Hunk[] {
  if (!diffText) return [];
  const lines = diffText.split("\n");
  const hunks: Hunk[] = [];
  let current: Hunk | null = null;
  let oldNo = 0;
  let newNo = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("diff --git") || line.startsWith("index ")) continue;
    if (line.startsWith("--- ") || line.startsWith("+++ ")) continue;
    if (line.startsWith("\\ No newline at end of file")) continue;
    if (line.startsWith("Binary files ")) continue;

    const hunkMatch = HUNK_RE.exec(line);
    if (hunkMatch) {
      if (current) hunks.push(current);
      const oldStart = Number(hunkMatch[1]);
      const newStart = Number(hunkMatch[3]);
      oldNo = oldStart;
      newNo = newStart;
      current = {
        header: line,
        oldStart,
        newStart,
        lines: [],
      };
      continue;
    }
    if (!current) continue;

    const first = line[0];
    const text = line.slice(1);
    let entry: DiffLine;
    if (first === "+") {
      entry = { t: "add", n_old: null, n_new: newNo, text };
      newNo++;
    } else if (first === "-") {
      entry = { t: "del", n_old: oldNo, n_new: null, text };
      oldNo++;
    } else if (first === " " || line === "") {
      entry = { t: "ctx", n_old: oldNo, n_new: newNo, text };
      oldNo++;
      newNo++;
    } else {
      continue;
    }
    current.lines.push(entry);
  }
  if (current) hunks.push(current);
  return hunks;
}

/**
 * Build a synthetic "added" hunk when there's no diff but only new content
 * (e.g. an untracked file shown for the first time).
 */
export function syntheticAddedHunk(newContent: string): Hunk {
  const arr = newContent.split("\n");
  if (arr.length && arr[arr.length - 1] === "") arr.pop();
  return {
    header: `@@ -0,0 +1,${arr.length} @@`,
    oldStart: 0,
    newStart: 1,
    lines: arr.map<DiffLine>((text, i) => ({
      t: "add",
      n_old: null,
      n_new: i + 1,
      text,
    })),
  };
}

/**
 * Build a synthetic "deleted" hunk from old content (no new content to compare).
 */
export function syntheticDeletedHunk(oldContent: string): Hunk {
  const arr = oldContent.split("\n");
  if (arr.length && arr[arr.length - 1] === "") arr.pop();
  return {
    header: `@@ -1,${arr.length} +0,0 @@`,
    oldStart: 1,
    newStart: 0,
    lines: arr.map<DiffLine>((text, i) => ({
      t: "del",
      n_old: i + 1,
      n_new: null,
      text,
    })),
  };
}

import type {
  ChangedFileStatus,
  DiffLine,
  Hunk,
} from "@/features/git/git.types";

export type DiffSection =
  | { kind: "hunk"; hunkIdx: number; hunk: Hunk }
  | { kind: "filler"; lines: DiffLine[] };

/**
 * Convert a list of hunks into a list of sections for rendering.
 *
 * `"hunks"` mode keeps the classic compact diff (a section per hunk).
 *
 * `"full"` mode injects `filler` sections — context lines drawn from
 * `newContent` — between/around the hunks so the whole file appears with
 * continuous line numbers. The hunks themselves are passed through untouched
 * so per-hunk staging still works.
 *
 * Added / deleted / untracked files are pass-through: their synthetic hunks
 * already span the whole file.
 */
export function buildSections(
  hunks: Hunk[],
  oldContent: string,
  newContent: string,
  mode: "full" | "hunks",
  status: ChangedFileStatus,
): DiffSection[] {
  const passthrough: DiffSection[] = hunks.map((h, hunkIdx) => ({
    kind: "hunk",
    hunkIdx,
    hunk: h,
  }));
  if (mode !== "full" || status !== "modified") return passthrough;
  if (!newContent && !oldContent) return passthrough;

  const newLines = splitNoTrail(newContent);
  const sections: DiffSection[] = [];
  let oldCursor = 1;
  let newCursor = 1;

  hunks.forEach((h, hunkIdx) => {
    if (newCursor < h.newStart) {
      const fill = h.newStart - newCursor;
      const lines: DiffLine[] = [];
      for (let i = 0; i < fill; i++) {
        lines.push({
          t: "ctx",
          n_old: oldCursor + i,
          n_new: newCursor + i,
          text: newLines[newCursor + i - 1] ?? "",
        });
      }
      if (lines.length > 0) sections.push({ kind: "filler", lines });
      oldCursor += fill;
      newCursor += fill;
    }
    sections.push({ kind: "hunk", hunkIdx, hunk: h });
    const lastOld = lastWith(h.lines, "n_old");
    const lastNew = lastWith(h.lines, "n_new");
    if (lastOld != null) oldCursor = lastOld + 1;
    if (lastNew != null) newCursor = lastNew + 1;
  });

  if (newCursor <= newLines.length) {
    const lines: DiffLine[] = [];
    for (let n = newCursor; n <= newLines.length; n++) {
      lines.push({
        t: "ctx",
        n_old: oldCursor + (n - newCursor),
        n_new: n,
        text: newLines[n - 1] ?? "",
      });
    }
    if (lines.length > 0) sections.push({ kind: "filler", lines });
  }
  return sections;
}

function splitNoTrail(s: string): string[] {
  const arr = s.split("\n");
  if (arr.length && arr[arr.length - 1] === "") arr.pop();
  return arr;
}

function lastWith(
  lines: DiffLine[],
  key: "n_old" | "n_new",
): number | null {
  for (let i = lines.length - 1; i >= 0; i--) {
    const v = lines[i][key];
    if (v != null) return v;
  }
  return null;
}

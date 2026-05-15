import type { DiffLine, Hunk } from "@/features/git/git.types";

/**
 * Build a minimal unified-diff patch for a subset of hunks of a single file.
 * The result can be piped into `git apply --cached` (stage) or
 * `git apply --cached --reverse` (unstage).
 *
 * The hunks are assumed to have come straight from `git diff` and to still
 * apply cleanly against whichever side (index or working tree) the caller
 * intends to target.
 */
export function buildPatch(
  filePath: string,
  hunks: Hunk[],
  oldPath?: string,
): string {
  const a = oldPath ?? filePath;
  const lines: string[] = [
    `diff --git a/${a} b/${filePath}`,
    `--- a/${a}`,
    `+++ b/${filePath}`,
  ];
  for (const h of hunks) {
    lines.push(h.header);
    for (const l of h.lines) {
      lines.push(prefixFor(l) + l.text);
    }
  }
  // Trailing newline matters — `git apply` rejects patches missing it.
  return lines.join("\n") + "\n";
}

function prefixFor(line: DiffLine): string {
  if (line.t === "add") return "+";
  if (line.t === "del") return "-";
  return " ";
}

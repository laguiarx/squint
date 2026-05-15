import { Fragment, type ReactNode } from "react";
import type {
  ChangedFileStatus,
  DiffLine,
} from "@/features/git/git.types";
import type { LineHighlightMap } from "@/lib/findInDiff";
import type { DiffSection } from "@/lib/sections";
import { HLLine } from "./HLLine";
import { DiffSingle } from "./DiffSingle";
import { HunkActionBar, type HunkActions } from "./HunkActionBar";
import { FoldButton } from "./FoldButton";

type Props = {
  sections: DiffSection[];
  lang: string;
  status: ChangedFileStatus;
  lineHighlights?: LineHighlightMap;
  hunkActions?: HunkActions | null;
  popoverHunkIdx?: number | null;
  popoverNode?: ReactNode;
  collapsedHunks?: Set<number>;
  onToggleHunk?: (hunkIdx: number) => void;
};

export function DiffSideBySide({
  sections,
  lang,
  status,
  lineHighlights,
  hunkActions,
  popoverHunkIdx,
  popoverNode,
  collapsedHunks,
  onToggleHunk,
}: Props) {
  // For whole-file added / deleted / untracked, fall back to single-column.
  if (status === "added" || status === "untracked") {
    const hunks = sections.flatMap((s) => (s.kind === "hunk" ? [s.hunk] : []));
    return (
      <>
        <WholeFileBanner status={status} />
        <DiffSingle
          hunks={hunks}
          lang={lang}
          side="add"
          lineHighlights={lineHighlights}
          hunkActions={hunkActions}
        />
      </>
    );
  }
  if (status === "deleted") {
    const hunks = sections.flatMap((s) => (s.kind === "hunk" ? [s.hunk] : []));
    return (
      <>
        <WholeFileBanner status={status} />
        <DiffSingle
          hunks={hunks}
          lang={lang}
          side="del"
          lineHighlights={lineHighlights}
          hunkActions={hunkActions}
        />
      </>
    );
  }

  return (
    <div className="diff-sbs">
      {sections.map((sec, si) => {
        if (sec.kind === "filler") {
          return (
            <div key={si} className="diff-filler">
              <div className="diff-grid">
                {sec.lines.map((l, li) => (
                  <Fragment key={li}>
                    <SbsCell
                      line={l}
                      side="left"
                      lang={lang}
                      highlight={lineHighlights?.get(`${si}:${li}`)}
                    />
                    <SbsCell
                      line={l}
                      side="right"
                      lang={lang}
                      highlight={lineHighlights?.get(`${si}:${li}`)}
                    />
                  </Fragment>
                ))}
              </div>
            </div>
          );
        }

        const h = sec.hunk;
        const hi = sec.hunkIdx;
        const paired = pairSides(h.lines);
        const collapsed = collapsedHunks?.has(hi) ?? false;
        return (
          <div key={si} className="diff-hunk" data-hunk-idx={hi}>
            <div className="diff-hunk-header">
              <FoldButton
                collapsed={collapsed}
                onClick={() => onToggleHunk?.(hi)}
              />
              <span className="mono dim">{h.header}</span>
              {hunkActions ? (
                <HunkActionBar hunkIdx={hi} actions={hunkActions} />
              ) : null}
            </div>
            {popoverHunkIdx === hi && popoverNode ? (
              <div className="hunk-popover-host">{popoverNode}</div>
            ) : null}
            {!collapsed ? (
              <div className="diff-grid">
                {paired.map((row, ri) => (
                  <Fragment key={ri}>
                    <SbsCell
                      line={row.left}
                      side="left"
                      lang={lang}
                      highlight={
                        row.leftLineIdx != null
                          ? lineHighlights?.get(`${si}:${row.leftLineIdx}`)
                          : undefined
                      }
                    />
                    <SbsCell
                      line={row.right}
                      side="right"
                      lang={lang}
                      highlight={
                        row.rightLineIdx != null
                          ? lineHighlights?.get(`${si}:${row.rightLineIdx}`)
                          : undefined
                      }
                    />
                  </Fragment>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function SbsCell({
  line,
  side,
  lang,
  highlight,
}: {
  line: DiffLine | null;
  side: "left" | "right";
  lang: string;
  highlight: { ranges: [number, number, boolean][] } | undefined;
}) {
  const cls = "diff-side diff-" + side + " " + sideClass(line);
  const num = line == null ? "" : side === "left" ? (line.n_old ?? "") : (line.n_new ?? "");
  return (
    <div className={cls}>
      <span className="diff-gut diff-gut-num">{num}</span>
      <span className="diff-gut diff-gut-mark">{markFor(line)}</span>
      <span className="diff-code">
        {line ? <HLLine text={line.text} lang={lang} highlight={highlight} /> : ""}
      </span>
    </div>
  );
}

type PairedRow = {
  left: DiffLine | null;
  leftLineIdx: number | null;
  right: DiffLine | null;
  rightLineIdx: number | null;
};

function pairSides(lines: DiffLine[]): PairedRow[] {
  const rows: PairedRow[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.t === "ctx") {
      rows.push({ left: l, leftLineIdx: i, right: l, rightLineIdx: i });
      i++;
    } else {
      const delPairs: { line: DiffLine; idx: number }[] = [];
      const addPairs: { line: DiffLine; idx: number }[] = [];
      while (i < lines.length && lines[i].t === "del") {
        delPairs.push({ line: lines[i], idx: i });
        i++;
      }
      while (i < lines.length && lines[i].t === "add") {
        addPairs.push({ line: lines[i], idx: i });
        i++;
      }
      const len = Math.max(delPairs.length, addPairs.length);
      for (let k = 0; k < len; k++) {
        rows.push({
          left: delPairs[k]?.line ?? null,
          leftLineIdx: delPairs[k]?.idx ?? null,
          right: addPairs[k]?.line ?? null,
          rightLineIdx: addPairs[k]?.idx ?? null,
        });
      }
    }
  }
  return rows;
}

function sideClass(line: DiffLine | null): string {
  if (!line) return "diff-empty-side";
  if (line.t === "add") return "diff-row-add";
  if (line.t === "del") return "diff-row-del";
  return "diff-row-ctx";
}

function markFor(line: DiffLine | null): string {
  if (!line) return "";
  if (line.t === "add") return "+";
  if (line.t === "del") return "−";
  return "";
}

function WholeFileBanner({ status }: { status: ChangedFileStatus }) {
  const map: Partial<Record<ChangedFileStatus, { text: string; color: string }>> = {
    added: {
      text: "New file — no previous version to compare against.",
      color: "var(--diff-add-mark)",
    },
    deleted: {
      text: "Deleted file — showing the last contents before removal.",
      color: "var(--diff-del-mark)",
    },
    untracked: {
      text: "Untracked file — not yet known to git.",
      color: "var(--git-unt)",
    },
  };
  const m = map[status];
  if (!m) return null;
  return (
    <div className="diff-whole-banner" style={{ color: m.color }}>
      <span className="diff-whole-banner-dot" />
      <span style={{ color: "var(--fg-1)" }}>{m.text}</span>
    </div>
  );
}

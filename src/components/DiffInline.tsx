import type { ReactNode } from "react";
import type { DiffLine } from "@/features/git/git.types";
import type { LineHighlightMap } from "@/lib/findInDiff";
import type { DiffSection } from "@/lib/sections";
import { HLLine } from "./HLLine";
import { HunkActionBar, type HunkActions } from "./HunkActionBar";
import { FoldButton } from "./FoldButton";

type Props = {
  sections: DiffSection[];
  lang: string;
  lineHighlights?: LineHighlightMap;
  hunkActions?: HunkActions | null;
  popoverHunkIdx?: number | null;
  popoverNode?: ReactNode;
  collapsedHunks?: Set<number>;
  onToggleHunk?: (hunkIdx: number) => void;
};

export function DiffInline({
  sections,
  lang,
  lineHighlights,
  hunkActions,
  popoverHunkIdx,
  popoverNode,
  collapsedHunks,
  onToggleHunk,
}: Props) {
  return (
    <div className="diff-inline">
      {sections.map((sec, si) => {
        if (sec.kind === "filler") {
          return (
            <div key={si} className="diff-filler">
              <div className="diff-inline-rows">
                {sec.lines.map((l, li) => (
                  <InlineRow
                    key={li}
                    line={l}
                    lang={lang}
                    highlight={lineHighlights?.get(`${si}:${li}`)}
                  />
                ))}
              </div>
            </div>
          );
        }
        const h = sec.hunk;
        const hi = sec.hunkIdx;
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
              <div className="diff-inline-rows">
                {h.lines.map((l, li) => (
                  <InlineRow
                    key={li}
                    line={l}
                    lang={lang}
                    highlight={lineHighlights?.get(`${si}:${li}`)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function InlineRow({
  line,
  lang,
  highlight,
}: {
  line: DiffLine;
  lang: string;
  highlight: { ranges: [number, number, boolean][] } | undefined;
}) {
  return (
    <div className={"diff-row diff-row-" + line.t}>
      <span className="diff-gut diff-gut-num">{line.n_old ?? ""}</span>
      <span className="diff-gut diff-gut-num">{line.n_new ?? ""}</span>
      <span className="diff-gut diff-gut-mark">
        {line.t === "add" ? "+" : line.t === "del" ? "−" : ""}
      </span>
      <span className="diff-code">
        <HLLine text={line.text} lang={lang} highlight={highlight} />
      </span>
    </div>
  );
}

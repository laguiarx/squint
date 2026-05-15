import { useState } from "react";
import type { Hunk } from "@/features/git/git.types";
import type { LineHighlightMap } from "@/lib/findInDiff";
import { HLLine } from "./HLLine";
import { HunkActionBar, type HunkActions } from "./HunkActionBar";
import { FoldButton } from "./FoldButton";

type Props = {
  hunks: Hunk[];
  lang: string;
  side: "add" | "del";
  lineHighlights?: LineHighlightMap;
  hunkActions?: HunkActions | null;
};

export function DiffSingle({
  hunks,
  lang,
  side,
  lineHighlights,
  hunkActions,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());
  const toggle = (hi: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(hi)) next.delete(hi);
      else next.add(hi);
      return next;
    });
  return (
    <div className="diff-single">
      {hunks.map((h, hi) => {
        const isCollapsed = collapsed.has(hi);
        return (
          <div key={hi} className="diff-hunk">
            <div className="diff-hunk-header">
              <FoldButton collapsed={isCollapsed} onClick={() => toggle(hi)} />
              <span className="mono dim">{h.header}</span>
              {hunkActions ? (
                <HunkActionBar hunkIdx={hi} actions={hunkActions} />
              ) : null}
            </div>
            {!isCollapsed ? (
              <div className="diff-single-rows">
                {h.lines.map((l, li) => {
                  const cls = l.t === "add" ? "is-add" : l.t === "del" ? "is-del" : "";
                  const num = side === "add" ? (l.n_new ?? "") : (l.n_old ?? "");
                  return (
                    <div
                      key={li}
                      className={"diff-row " + cls}
                      data-line-key={`${hi}:${li}`}
                    >
                      <span className="diff-gut diff-gut-num">{num}</span>
                      <span className="diff-gut diff-gut-mark">
                        {l.t === "add" ? "+" : l.t === "del" ? "−" : ""}
                      </span>
                      <span className="diff-code">
                        <HLLine
                          text={l.text}
                          lang={lang}
                          highlight={lineHighlights?.get(`${hi}:${li}`)}
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

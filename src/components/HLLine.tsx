import { memo, useMemo } from "react";
import { tokenizeCode, type Token } from "@/lib/tokenize";

type HighlightRange = [start: number, end: number, isCurrent: boolean];

export type HighlightSpec = {
  ranges: HighlightRange[];
};

type Props = {
  text: string;
  lang: string;
  highlight?: HighlightSpec;
};

// Memoized so unchanged lines skip reconciliation when the parent re-renders
// (e.g. every keystroke in the editor). `highlight` shallow-compared is
// usually undefined on most lines; only the matched lines pass a new object.
export const HLLine = memo(function HLLine({ text, lang, highlight }: Props) {
  const tokens = useMemo(() => tokenizeCode(text, lang), [text, lang]);

  if (!highlight || highlight.ranges.length === 0) {
    return (
      <>
        {tokens.map((tk, i) => (
          <span key={i} className={"tk-" + tk.kind}>
            {tk.text}
          </span>
        ))}
      </>
    );
  }

  const segs = splitTokensByRanges(tokens, highlight.ranges);
  return (
    <>
      {segs.map((s, i) => {
        const cls =
          "tk-" +
          s.kind +
          (s.matchKind === "current"
            ? " hl-match hl-current"
            : s.matchKind === "match"
              ? " hl-match"
              : "");
        return (
          <span key={i} className={cls}>
            {s.text}
          </span>
        );
      })}
    </>
  );
});

type Seg = {
  text: string;
  kind: Token["kind"];
  matchKind: false | "match" | "current";
};

function splitTokensByRanges(tokens: Token[], ranges: HighlightRange[]): Seg[] {
  const out: Seg[] = [];
  let pos = 0;
  for (const tk of tokens) {
    const start = pos;
    const end = pos + tk.text.length;
    // collect boundaries that fall strictly inside this token
    const boundaries = new Set<number>([start, end]);
    for (const r of ranges) {
      if (r[0] > start && r[0] < end) boundaries.add(r[0]);
      if (r[1] > start && r[1] < end) boundaries.add(r[1]);
    }
    const points = [...boundaries].sort((a, b) => a - b);
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const seg = tk.text.slice(a - start, b - start);
      const containing = ranges.find((r) => r[0] <= a && r[1] >= b);
      const matchKind: Seg["matchKind"] = containing
        ? containing[2]
          ? "current"
          : "match"
        : false;
      out.push({ text: seg, kind: tk.kind, matchKind });
    }
    pos = end;
  }
  return out;
}

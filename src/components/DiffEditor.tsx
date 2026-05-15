import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import type { LineHighlightMap } from "@/lib/findInDiff";
import { HLLine } from "./HLLine";

type Props = {
  value: string;
  onChange: (value: string) => void;
  lang: string;
  lineHighlights?: LineHighlightMap;
  /** 1-indexed line numbers to paint with a "modified" stripe in the gutter. */
  changedLines?: Set<number>;
};

export type DiffEditorHandle = {
  /**
   * Position the editor on a range. When `focus` is false (default for the
   * in-file search) the textarea is *not* focused — the caller's input keeps
   * focus so the user can keep typing. The matched line is still scrolled
   * into view.
   */
  selectRange: (start: number, end: number, focus?: boolean) => void;
};

/**
 * Wrap-on editor. Layout: a CSS grid with one row per logical line where
 * column 1 is the gutter cell (line number) and column 2 is the highlighted
 * overlay text. Because both cells use the same font/size and wrap with
 * `pre-wrap`, the grid row height grows naturally when a long line wraps —
 * the gutter number stays anchored at the top of the row and the rest of
 * the column is empty space, matching VS Code's `editor.wordWrap: on`
 * behavior.
 *
 * The textarea is absolutely positioned over column 2 with the same wrap
 * rules, transparent text and a visible caret. The whole editor scrolls
 * vertically via the outer wrap — no horizontal scroll is exposed.
 */
export const DiffEditor = forwardRef<DiffEditorHandle, Props>(function DiffEditor(
  { value, onChange, lang, lineHighlights, changedLines },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const lines = useMemo(() => value.split("\n"), [value]);

  // Keep the textarea height matching the rendered grid so the caret can
  // reach the last line even when wrapping makes some lines tall. The
  // ResizeObserver covers both content edits (which re-flow the grid) AND
  // viewport-width changes (which re-wrap without a value change) — so we
  // don't also need a separate `useEffect(..., [value])` doing the same
  // work twice on every keystroke.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    const ta = textareaRef.current;
    if (!grid || !ta) return;
    let last = 0;
    const sync = () => {
      const h = grid.offsetHeight;
      if (h !== last) {
        last = h;
        ta.style.height = `${h}px`;
      }
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(grid);
    return () => ro.disconnect();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      selectRange(start: number, end: number, focus = true) {
        const ta = textareaRef.current;
        const wrap = wrapRef.current;
        const grid = gridRef.current;
        if (!ta) return;
        if (focus) {
          ta.focus();
          ta.setSelectionRange(start, end);
        }
        // Scroll the OUTER wrap (the only scroll container now) to bring
        // the matched logical line into view.
        if (wrap && grid) {
          const before = ta.value.slice(0, start);
          const lineIdx = (before.match(/\n/g) || []).length;
          // Find the overlay cell for that logical line and scroll its
          // offsetTop into view. Falls back to a rough estimate if the
          // node isn't there yet.
          const cell = grid.querySelector<HTMLElement>(
            `[data-line="${lineIdx}"]`,
          );
          const top = cell ? cell.offsetTop : lineIdx * 18.6;
          const height = cell ? cell.offsetHeight : 18.6;
          const visibleTop = wrap.scrollTop;
          const visibleBottom = visibleTop + wrap.clientHeight;
          if (top < visibleTop + 24) {
            wrap.scrollTop = Math.max(0, top - 48);
          } else if (top + height > visibleBottom - 24) {
            wrap.scrollTop = top - wrap.clientHeight + height + 48;
          }
        }
      },
    }),
    [],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.slice(0, start) + "  " + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }

  return (
    <div className="editor-wrap" ref={wrapRef}>
      <div className="editor-grid" ref={gridRef}>
        {lines.map((line, i) => {
          const n = i + 1;
          const isChanged = changedLines?.has(n) ?? false;
          return (
            <div className="editor-row" key={i}>
              <div
                className={`editor-gutter-line${isChanged ? " is-changed" : ""}`}
              >
                <span>{n}</span>
              </div>
              <div
                className="editor-overlay-line"
                data-line={i}
                aria-hidden="true"
              >
                <HLLine
                  text={line}
                  lang={lang}
                  highlight={lineHighlights?.get(`${i}`)}
                />
                {/* Force the cell to render its own line-box even when the
                    source line is empty, so the row keeps its height. */}
                {line.length === 0 ? "​" : null}
              </div>
            </div>
          );
        })}
        {/* Textarea is `position: absolute` over column 2 of the grid.
            Previously it was a grid-item with `grid-row: 1 / -1`, but with
            no explicit `grid-template-rows` the `-1` resolved to row 1 —
            the textarea crowded out the gutter/overlay auto-placement and
            only the first row rendered. Position-absolute spans the whole
            grid height regardless of row count. */}
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
});

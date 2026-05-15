import {
  Fragment,
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
  selectRange: (start: number, end: number, focus?: boolean) => void;
};

/**
 * Single-block overlay-textarea editor.
 *
 * Gutter + overlay + textarea are all single `<pre>` / `<textarea>`
 * elements so the browser computes one line metric per element — no
 * per-row rounding drift. Caret is the native textarea bar (OS-controlled
 * blink rate).
 */
export const DiffEditor = forwardRef<DiffEditorHandle, Props>(function DiffEditor(
  { value, onChange, lang, lineHighlights, changedLines },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const overlayRef = useRef<HTMLPreElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const lines = useMemo(() => value.split("\n"), [value]);

  // Keep the textarea height matching the overlay so the caret can reach
  // the last line.
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const ta = textareaRef.current;
    if (!overlay || !ta) return;
    let last = 0;
    const sync = () => {
      const h = overlay.offsetHeight;
      if (h !== last) {
        last = h;
        ta.style.height = `${h}px`;
      }
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(overlay);
    return () => ro.disconnect();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      selectRange(start: number, end: number, focus = true) {
        const ta = textareaRef.current;
        const wrap = wrapRef.current;
        const overlay = overlayRef.current;
        if (!ta) return;
        if (focus) {
          ta.focus();
          ta.setSelectionRange(start, end);
        }
        if (wrap && overlay) {
          const before = ta.value.slice(0, start);
          const lineIdx = (before.match(/\n/g) || []).length;
          const styles = window.getComputedStyle(overlay);
          const lineHeight = parseFloat(styles.lineHeight) || 19;
          const top = lineIdx * lineHeight;
          const visibleTop = wrap.scrollTop;
          const visibleBottom = visibleTop + wrap.clientHeight;
          if (top < visibleTop + 24) {
            wrap.scrollTop = Math.max(0, top - 48);
          } else if (top + lineHeight > visibleBottom - 24) {
            wrap.scrollTop = top - wrap.clientHeight + lineHeight + 48;
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
      <div className="editor-grid">
        <pre className="editor-gutter mono" aria-hidden="true">
          {lines.map((_, i) => {
            const n = i + 1;
            const isChanged = changedLines?.has(n) ?? false;
            return (
              <Fragment key={i}>
                <span
                  className={`editor-gutter-num${isChanged ? " is-changed" : ""}`}
                >
                  {n}
                </span>
                {i < lines.length - 1 ? "\n" : null}
              </Fragment>
            );
          })}
        </pre>
        <div className="editor-content">
          <pre className="editor-overlay mono" ref={overlayRef} aria-hidden="true">
            {lines.map((line, i) => (
              <Fragment key={i}>
                <HLLine
                  text={line}
                  lang={lang}
                  highlight={lineHighlights?.get(`${i}`)}
                />
                {i < lines.length - 1 ? "\n" : null}
              </Fragment>
            ))}
          </pre>
          <textarea
            ref={textareaRef}
            className="editor-textarea mono"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>
    </div>
  );
});

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { I, type IconName } from "./Icons";
import { Kbd, splitShortcut } from "./Kbd";

export type CommandItem = {
  id: string;
  name: string;
  sub?: string;
  section: string;
  icon: IconName;
  keywords?: string;
  badge?: string;
  kbd?: string[];
  run: () => void;
};

export type PaletteMode = "files" | "commands";

type Props = {
  open: boolean;
  mode: PaletteMode;
  onClose: () => void;
  onSwitchMode: (mode: PaletteMode) => void;
  commands: CommandItem[];
  /** When true, render a loading hint (in lieu of results). */
  loading?: boolean;
  /** Below this query length, hide results and show a hint. Default 0. */
  minQueryLength?: number;
};

const MAX_VISIBLE = 200;

const PLACEHOLDER: Record<PaletteMode, string> = {
  files: "Search files by name…",
  commands: "Type a command…",
};

const TOO_SHORT_HINT: Record<PaletteMode, string> = {
  files: "Start typing to find a file.",
  commands: "Type to search commands.",
};

const NO_MATCH_HINT: Record<PaletteMode, (q: string) => string> = {
  files: (q) => `No files match "${q}"`,
  commands: (q) => `No commands match "${q}"`,
};

export function CommandPalette({
  open,
  mode,
  onClose,
  onSwitchMode,
  commands,
  loading = false,
  minQueryLength = 0,
}: Props) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Bug guard: when the user navigates with arrow keys the list auto-scrolls.
  // A stationary cursor then ends up over a *new* row, which fires `mouseenter`
  // and would change `active` again — causing an infinite scroll loop.
  //
  // We track real mouse activity and only honour `mouseenter` after an actual
  // pointer move. `keyboardNavRef` separately gates the auto-scroll effect so
  // hovering never triggers scroll on its own.
  const mouseDrivenRef = useRef(false);
  const keyboardNavRef = useRef(true);

  useEffect(() => {
    if (!open) return;
    mouseDrivenRef.current = false;
    keyboardNavRef.current = true;
    function onMove() {
      mouseDrivenRef.current = true;
    }
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      mouseDrivenRef.current = false;
      keyboardNavRef.current = true;
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open, mode]);

  const showResults = q.length >= minQueryLength;

  const filtered = useMemo(() => {
    if (!showResults) return [] as (CommandItem & { _score: number })[];
    if (!q) return commands.map((c) => ({ ...c, _score: 0 }));
    const scored = commands
      .map((c) => ({ ...c, _score: scoreItem(q, c) }))
      .filter((c) => c._score > 0);
    scored.sort((a, b) => b._score - a._score);
    return scored;
  }, [q, commands, showResults]);

  const visible = useMemo(
    () => filtered.slice(0, MAX_VISIBLE),
    [filtered],
  );

  const groups = useMemo(() => {
    const m = new Map<string, CommandItem[]>();
    visible.forEach((c) => {
      const arr = m.get(c.section) ?? [];
      arr.push(c);
      m.set(c.section, arr);
    });
    return [...m.entries()];
  }, [visible]);

  useEffect(() => {
    if (active >= visible.length) {
      setActive(Math.max(0, visible.length - 1));
    }
  }, [visible.length, active]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        mouseDrivenRef.current = false;
        keyboardNavRef.current = true;
        setActive((a) => Math.min(visible.length - 1, a + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        mouseDrivenRef.current = false;
        keyboardNavRef.current = true;
        setActive((a) => Math.max(0, a - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = visible[active];
        if (cmd) {
          cmd.run();
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, visible, active, onClose]);

  useEffect(() => {
    // Mouse-driven active changes never auto-scroll — the hovered row is, by
    // definition, already under the cursor and therefore already visible.
    if (!keyboardNavRef.current) return;
    const el = listRef.current?.querySelector(
      ".palette-item.is-active",
    ) as HTMLElement | null;
    if (!el || !listRef.current) return;
    const parent = listRef.current;
    const top = el.offsetTop;
    const bot = top + el.offsetHeight;
    if (top < parent.scrollTop) parent.scrollTop = top - 4;
    else if (bot > parent.scrollTop + parent.clientHeight)
      parent.scrollTop = bot - parent.clientHeight + 4;
  }, [active]);

  if (!open) return null;

  const truncated = filtered.length - visible.length;
  let runningIdx = 0;

  return (
    <div
      className="overlay-back"
      style={{ paddingTop: 110 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="palette">
        <div className="palette-input-wrap">
          <span className="palette-mode-tag mono">
            {mode === "files" ? "Files" : "Commands"}
          </span>
          {I.search}
          <input
            ref={inputRef}
            className="palette-input"
            type="text"
            value={q}
            placeholder={PLACEHOLDER[mode]}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="palette-hint">ESC</span>
        </div>
        <div className="palette-results" ref={listRef}>
          {!showResults ? (
            <div className="palette-empty">{TOO_SHORT_HINT[mode]}</div>
          ) : loading ? (
            <div className="palette-empty">
              <span className="ai-spinner" style={{ marginRight: 8, verticalAlign: "middle" }} />
              Indexing repository…
            </div>
          ) : groups.length === 0 ? (
            <div className="palette-empty">{NO_MATCH_HINT[mode](q)}</div>
          ) : (
            groups.map(([section, items]) => (
              <div key={section}>
                {section ? (
                  <div className="palette-section-head">{section}</div>
                ) : null}
                {items.map((item) => {
                  const isActive = runningIdx === active;
                  const myIdx = runningIdx;
                  runningIdx++;
                  return (
                    <button
                      key={item.id}
                      className={cn("palette-item", isActive && "is-active")}
                      onMouseEnter={() => {
                        // Ignore mouseenter events caused by the list scrolling
                        // under a stationary cursor — only act on real movement.
                        if (!mouseDrivenRef.current) return;
                        keyboardNavRef.current = false;
                        setActive(myIdx);
                      }}
                      onMouseMove={() => {
                        // Real movement → re-enable hover updates and adopt
                        // this row as active.
                        mouseDrivenRef.current = true;
                        if (active !== myIdx) {
                          keyboardNavRef.current = false;
                          setActive(myIdx);
                        }
                      }}
                      onClick={() => {
                        item.run();
                        onClose();
                      }}
                    >
                      <span className="palette-item-icon">
                        {I[item.icon] ?? I.search}
                      </span>
                      <span className="palette-item-label">
                        <span className="palette-item-name">{item.name}</span>
                        {item.sub ? (
                          <span className="palette-item-sub">{item.sub}</span>
                        ) : null}
                      </span>
                      {item.badge ? (
                        <span className="palette-item-badge">{item.badge}</span>
                      ) : (
                        <span />
                      )}
                      {item.kbd ? (
                        <span className="palette-item-kbd">
                          {item.kbd.map((chord, ci) => (
                            <span key={ci} className="palette-kbd-chord">
                              {splitShortcut(chord).map((k, ki) => (
                                <span key={ki} className="kbd">
                                  {k}
                                </span>
                              ))}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
          {truncated > 0 ? (
            <div className="palette-truncated mono dim">
              … {truncated.toLocaleString()} more — refine your query
            </div>
          ) : null}
        </div>
        <div className="palette-footer">
          <span>
            <span className="kbd">↑↓</span> navigate
          </span>
          <span>
            <span className="kbd">↵</span> select
          </span>
          <span>
            <span className="kbd">esc</span> close
          </span>
          <span className="flex-spacer" />
          <button
            className="palette-mode-switch"
            onClick={() =>
              onSwitchMode(mode === "files" ? "commands" : "files")
            }
            title={
              mode === "files"
                ? "Switch to commands palette (⌘⇧P)"
                : "Switch to file picker (⌘P)"
            }
          >
            {mode === "files" ? (
              <>
                <Kbd>⌘⇧P</Kbd>
                <span style={{ marginLeft: 6 }}>commands</span>
              </>
            ) : (
              <>
                <Kbd>⌘P</Kbd>
                <span style={{ marginLeft: 6 }}>files</span>
              </>
            )}
          </button>
          <span>
            {showResults
              ? `${filtered.length.toLocaleString()} result${filtered.length === 1 ? "" : "s"}`
              : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Score how well `query` matches a command. Strategy:
 *   1. Substring of `name` (filename) → highest score, boosted toward start
 *   2. Substring of full keywords (path) → mid score
 *   3. Subsequence in name → low score, only if consecutive runs are meaningful
 *
 * Returns 0 when nothing matches.
 */
function scoreItem(query: string, c: CommandItem): number {
  const q = query.toLowerCase();
  const name = c.name.toLowerCase();
  const keys = (c.keywords ?? "").toLowerCase();

  // Strong: substring in name
  const inName = name.indexOf(q);
  if (inName !== -1) {
    // Earlier-in-name + starting-on-word-boundary wins.
    const boundary =
      inName === 0 || /[\s\-_./]/.test(name[inName - 1] ?? "") ? 200 : 0;
    return 1000 + boundary - inName;
  }

  // Medium: substring in keywords (path)
  const inKeys = keys.indexOf(q);
  if (inKeys !== -1) {
    return 400 - Math.min(inKeys, 200);
  }

  // Weak: subsequence in keywords with consecutive-run requirement
  let qi = 0;
  let ti = 0;
  let runs = 0;
  let bestRun = 0;
  let cur = 0;
  let last = -2;
  while (qi < q.length && ti < keys.length) {
    if (q[qi] === keys[ti]) {
      if (ti - last === 1) cur++;
      else {
        if (cur > bestRun) bestRun = cur;
        cur = 1;
        runs++;
      }
      last = ti;
      qi++;
    }
    ti++;
  }
  if (cur > bestRun) bestRun = cur;

  if (qi < q.length) return 0;
  // Reject if the best run is less than ~half the query (kills `pack` → `workspace`).
  if (bestRun < Math.max(2, Math.ceil(q.length / 2))) return 0;
  return Math.min(200, bestRun * 30 - runs * 5);
}

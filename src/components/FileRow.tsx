import { useEffect, useRef, useState } from "react";
import type { ChangedFile } from "@/features/git/git.types";
import { cn } from "@/lib/utils";
import { I, STATUS_META } from "./Icons";
import { Kbd } from "./Kbd";

type Props = {
  file: ChangedFile;
  selected: boolean;
  /** Same path is currently open (possibly in file-view) but not as this exact diff variant. */
  active?: boolean;
  /** Part of a multi-select group (⌘/Ctrl-click or ⇧-click). */
  multiSelected?: boolean;
  /** Receives the click event so callers can read shift/meta/ctrl modifiers. */
  onSelect: (e: React.MouseEvent) => void;
  onToggleStage: () => void;
  onToggleReviewed: () => void;
  onDiscard: () => void;
};

/**
 * File row layout:
 *   [status]  filename + dir   (+stats)  [+ stage]  [⋯ more]
 *
 * Previously the trailing strip had review + discard + stage all inline,
 * which was unreadable and ran off the right edge at narrow sidebar
 * widths. Now it's two affordances: a primary Stage toggle (most-used) and
 * an overflow menu for Mark reviewed / Discard.
 */
export function FileRow({
  file,
  selected,
  active,
  multiSelected,
  onSelect,
  onToggleStage,
  onToggleReviewed,
  onDiscard,
}: Props) {
  const meta = STATUS_META[file.status];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close the popover on outside-click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node | null;
      if (menuRef.current && t && !menuRef.current.contains(t)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div
      className={cn(
        "file-row",
        selected && "is-selected",
        !selected && multiSelected && "is-selected is-multi",
        !selected && !multiSelected && active && "is-active",
        file.reviewed && "is-reviewed",
      )}
      onMouseDown={(e) => {
        // Shift-click starts text selection on `mousedown` — long before
        // our `click` handler can call `removeAllRanges()`. That's the
        // flash the user sees. Suppress it at the source: when the
        // modifier is held, the row is acting as a range-select trigger,
        // not as a text cursor.
        if (e.shiftKey) e.preventDefault();
      }}
      onClick={onSelect}
    >
      <span
        className="file-status"
        style={{ color: meta.color }}
        title={meta.label}
      >
        {meta.letter}
      </span>
      <span className="file-pathwrap">
        <span className="file-name" title={file.path}>
          {file.path.split("/").pop()}
        </span>
        {file.path.includes("/") ? (
          <span className="file-dir">
            {file.path.slice(0, file.path.lastIndexOf("/"))}
          </span>
        ) : null}
      </span>
      <span className="file-stats mono">
        {file.additions > 0 ? (
          <span className="diffstat-add">+{file.additions}</span>
        ) : null}
        {file.deletions > 0 ? (
          <span className="diffstat-del">−{file.deletions}</span>
        ) : null}
      </span>
      <span className="file-actions">
        <button
          className={cn("file-stage-btn", file.staged && "is-staged")}
          title={file.staged ? "Unstage" : "Stage"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStage();
          }}
          type="button"
        >
          {file.staged ? I.check : "+"}
        </button>
        <div className="file-more-wrap" ref={menuRef}>
          <button
            className={cn(
              "file-action-btn file-more-btn",
              menuOpen && "is-active",
              file.reviewed && "is-reviewed",
            )}
            title="More actions"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {I.ellipsis}
          </button>
          {menuOpen ? (
            <div
              className="file-more-menu"
              role="menu"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                role="menuitem"
                className="file-more-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onToggleReviewed();
                }}
                type="button"
              >
                <span className="file-more-item-icon">{I.review}</span>
                <span>
                  {file.reviewed ? "Unmark reviewed" : "Mark reviewed"}
                </span>
                <Kbd>⌘⇧M</Kbd>
              </button>
              <button
                role="menuitem"
                className="file-more-item is-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDiscard();
                }}
                type="button"
              >
                <span className="file-more-item-icon">{I.discard}</span>
                <span>Discard changes</span>
                <Kbd>⌘⌫</Kbd>
              </button>
            </div>
          ) : null}
        </div>
      </span>
    </div>
  );
}

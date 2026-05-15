import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRepoStore } from "@/features/repository/repository.store";
import { cn } from "@/lib/utils";
import { I } from "./Icons";

type Anchor = { top: number; right: number };

/**
 * Read the trigger's viewport-relative position so the portal-mounted menu
 * can sit just under it regardless of any ancestor stacking contexts /
 * overflow / transforms.
 */
function computeAnchor(): Anchor {
  const trigger = document.querySelector<HTMLElement>(
    ".editor-launcher-trigger",
  );
  if (!trigger) return { top: 60, right: 16 };
  const rect = trigger.getBoundingClientRect();
  return {
    top: rect.bottom + 6,
    right: Math.max(8, window.innerWidth - rect.right),
  };
}

export function EditorMenu() {
  const open = useRepoStore((s) => s.editorMenuOpen);
  const setOpen = useRepoStore((s) => s.setEditorMenuOpen);
  const editors = useRepoStore((s) => s.editors);
  const fetchEditors = useRepoStore((s) => s.fetchEditors);
  const preferred = useRepoStore((s) => s.settings.preferredEditor);
  const setPreferred = useRepoStore((s) => s.setPreferredEditor);
  const pushToast = useRepoStore((s) => s.pushToast);

  const ref = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<Anchor>({ top: 60, right: 16 });

  // Recompute the trigger position when the menu opens, and keep it in sync
  // if the user resizes the window or scrolls a parent while it's open.
  useLayoutEffect(() => {
    if (!open) return;
    setAnchor(computeAnchor());
    const onResize = () => setAnchor(computeAnchor());
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    fetchEditors().catch(() => {
      /* error already surfaced */
    });
  }, [open, fetchEditors]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (ref.current && target && !ref.current.contains(target)) {
        // Don't close if the click was on the launcher chevron — it owns toggling.
        const trigger = document.querySelector(".editor-launcher-trigger");
        if (trigger && trigger.contains(target)) return;
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  if (!open) return null;

  // Portal-mounted at body so the menu is at the document root — escapes
  // any stacking context, overflow:hidden, or transform-creating ancestor
  // in the topbar / workspace tree.
  return createPortal(
    <div
      className="editor-menu editor-menu-portal"
      ref={ref}
      style={{ top: anchor.top, right: anchor.right }}
    >
      <div className="editor-menu-head dim">Default editor</div>
      {editors.length === 0 ? (
        <div className="editor-menu-empty dim">
          No supported editors detected on this machine.
        </div>
      ) : (
        editors.map((e) => (
          <button
            key={e.id}
            className={cn(
              "editor-menu-item",
              preferred === e.id && "is-preferred",
            )}
            onClick={() => {
              if (preferred !== e.id) {
                setPreferred(e.id);
                pushToast(`${e.name} is now the default editor`);
              }
              setOpen(false);
            }}
            title={
              preferred === e.id
                ? `${e.name} is the default`
                : `Set ${e.name} as default editor`
            }
          >
            <span className="editor-menu-item-mark">
              {preferred === e.id ? I.check : null}
            </span>
            <span className="editor-menu-item-name">{e.name}</span>
            {preferred === e.id ? (
              <span className="editor-menu-item-tag mono dim">default</span>
            ) : null}
          </button>
        ))
      )}
    </div>,
    document.body,
  );
}

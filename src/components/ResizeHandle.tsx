import { useRepoStore } from "@/features/repository/repository.store";
import { cn } from "@/lib/utils";

type Props = {
  /** "left" → handle sits on the right edge of the left sidebar (drag right grows). */
  /** "right" → handle sits on the left edge of the right panel (drag left grows). */
  side: "left" | "right";
};

/**
 * Drag-past-this distance below the minimum width to auto-collapse the panel.
 * Mirrors VS Code's "if you really push, we'll hide it" affordance.
 */
const COLLAPSE_THRESHOLD = 180;

export function ResizeHandle({ side }: Props) {
  const leftWidth = useRepoStore((s) => s.settings.leftSidebarWidth);
  const rightWidth = useRepoStore((s) => s.settings.rightSidebarWidth);
  const setLeftSidebarWidth = useRepoStore((s) => s.setLeftSidebarWidth);
  const setRightSidebarWidth = useRepoStore((s) => s.setRightSidebarWidth);
  const setLeftSidebarVisible = useRepoStore((s) => s.setLeftSidebarVisible);
  const setRightSidebarVisible = useRepoStore((s) => s.setRightSidebarVisible);

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = side === "left" ? leftWidth : rightWidth;

    function releaseListeners() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const requested = side === "left" ? startWidth + dx : startWidth - dx;
      if (requested < COLLAPSE_THRESHOLD) {
        // User pushed past the min — collapse the panel and end the drag so
        // we don't keep firing while they release.
        if (side === "left") setLeftSidebarVisible(false);
        else setRightSidebarVisible(false);
        releaseListeners();
        return;
      }
      if (side === "left") setLeftSidebarWidth(requested);
      else setRightSidebarWidth(requested);
    }
    function onUp() {
      releaseListeners();
    }
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div
      className={cn("resize-handle", `resize-handle-${side}`)}
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="vertical"
    />
  );
}

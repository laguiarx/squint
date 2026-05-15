import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRepoStore } from "@/features/repository/repository.store";
import { I } from "./Icons";

type Anchor = { top: number; right: number };

function computeAnchor(): Anchor {
  const trigger = document.querySelector<HTMLElement>("[data-git-menu-trigger]");
  if (!trigger) return { top: 60, right: 16 };
  const rect = trigger.getBoundingClientRect();
  return {
    top: rect.bottom + 6,
    right: Math.max(8, window.innerWidth - rect.right),
  };
}

/**
 * Progress card for the `createPr` pipeline. Anchored to the Git pill in
 * the topbar (same positioning logic as GitMenu) instead of a centered
 * modal — feels like an extension of the menu that opened it, not a
 * separate full-screen interrupt. Stays open during running / done /
 * error states; idle = invisible.
 */
export function PrFlowDialog() {
  const flow = useRepoStore((s) => s.prFlow);
  const reset = useRepoStore((s) => s.resetPrFlow);
  const ref = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<Anchor>({ top: 60, right: 16 });

  useLayoutEffect(() => {
    if (flow.state === "idle") return;
    setAnchor(computeAnchor());
    const onResize = () => setAnchor(computeAnchor());
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [flow.state]);

  useEffect(() => {
    if (flow.state === "idle") return;
    // Only Escape closes — clicking outside is intentionally a no-op so
    // the user doesn't accidentally dismiss the in-flight progress card.
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && flow.state !== "running") reset();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [flow.state, reset]);

  if (flow.state === "idle") return null;

  return createPortal(
    <div
      className="pr-flow-popover"
      ref={ref}
      style={{ top: anchor.top, right: anchor.right }}
      role="dialog"
      aria-label="Create Pull Request"
    >
      <div className="pr-flow-head">
        <span className="pr-flow-eyebrow mono dim">Git · Create PR</span>
        <span className="flex-spacer" />
        <button
          className="pr-flow-close"
          onClick={reset}
          type="button"
          title="Close"
          disabled={flow.state === "running"}
        >
          {I.x}
        </button>
      </div>

      <div className="pr-flow-body">
        {flow.state === "running" ? (
          <div className="pr-flow-running">
            <span className="ai-spinner" />
            <span className="pr-flow-message">{flow.message || "Working…"}</span>
          </div>
        ) : flow.state === "done" ? (
          <div className="pr-flow-done">
            <div className="pr-flow-done-head">
              <span className="pr-flow-check">{I.check}</span>
              <span className="pr-flow-done-title">{flow.message}</span>
            </div>
            {flow.url ? (
              <a
                href={flow.url}
                target="_blank"
                rel="noreferrer"
                className="pr-flow-url mono"
              >
                {flow.url}
              </a>
            ) : null}
            <div className="pr-flow-actions">
              <button className="ghost-btn" onClick={reset} type="button">
                Close
              </button>
              {flow.url ? (
                <a
                  href={flow.url}
                  target="_blank"
                  rel="noreferrer"
                  className="primary-btn"
                >
                  Open PR ↗
                </a>
              ) : null}
            </div>
          </div>
        ) : flow.state === "error" ? (
          <div className="pr-flow-error">
            <div className="pr-flow-error-title">Couldn't create PR</div>
            <div className="pr-flow-error-body mono">{flow.error}</div>
            <div className="pr-flow-actions">
              <button className="ghost-btn" onClick={reset} type="button">
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

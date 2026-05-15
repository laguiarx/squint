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
 * Branch-choice card shown before `createPr` fires. Portal-mounted and
 * anchored to the Git pill in the topbar — same pattern as `GitMenu` and
 * `PrFlowDialog`, so the whole "Create PR" interaction feels like one
 * conversation cascading out of the Git button instead of three
 * unrelated full-screen modals.
 */
export function PrBranchChoiceDialog() {
  const open = useRepoStore((s) => s.prBranchChoiceOpen);
  const closeDialog = useRepoStore((s) => s.closePrBranchChoice);
  const createPr = useRepoStore((s) => s.createPr);
  const repository = useRepoStore((s) => s.repository);
  const generateBranchName = useRepoStore((s) => s.generateBranchName);

  const [mode, setMode] = useState<"current" | "new">("current");
  const [newName, setNewName] = useState("");
  const [generating, setGenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [anchor, setAnchor] = useState<Anchor>({ top: 60, right: 16 });

  // Reset state on each open.
  useEffect(() => {
    if (!open) return;
    setMode("current");
    setNewName("");
  }, [open]);

  // Anchor to the Git pill + keep in sync on resize/scroll.
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
    if (open && mode === "new") {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, mode]);

  // Escape closes; click outside (but not on the Git trigger) closes too.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node | null;
      if (cardRef.current && t && !cardRef.current.contains(t)) {
        const trigger = document.querySelector("[data-git-menu-trigger]");
        if (trigger && trigger.contains(t)) return;
        closeDialog();
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDialog();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeDialog]);

  if (!open) return null;

  const canRun =
    mode === "current" || (mode === "new" && newName.trim().length > 0);

  const onConfirm = () => {
    void createPr({
      newBranchName: mode === "new" ? newName.trim() : null,
    });
  };

  return createPortal(
    <div
      className="pr-branch-popover"
      ref={cardRef}
      style={{ top: anchor.top, right: anchor.right }}
      role="dialog"
      aria-label="Create Pull Request"
    >
      <div className="pr-branch-head">
        <span className="pr-branch-eyebrow mono dim">Git · Create PR</span>
        <span className="flex-spacer" />
        <button
          className="pr-branch-close"
          onClick={closeDialog}
          type="button"
          title="Close"
        >
          {I.x}
        </button>
      </div>

      <div className="pr-branch-body">
        <div className="pr-branch-sub dim">
          Currently on{" "}
          <span className="mono">
            {repository?.currentBranch ?? "(no branch)"}
          </span>
          . What branch should the PR come from?
        </div>

        <div className="pr-branch-choice">
          <label
            className={`pr-branch-choice-row${mode === "current" ? " is-active" : ""}`}
          >
            <input
              type="radio"
              name="pr-branch-mode"
              checked={mode === "current"}
              onChange={() => setMode("current")}
            />
            <span className="pr-branch-choice-label">
              Use current branch
              <span className="dim mono">
                {repository?.currentBranch ?? ""}
              </span>
            </span>
          </label>
          <label
            className={`pr-branch-choice-row${mode === "new" ? " is-active" : ""}`}
          >
            <input
              type="radio"
              name="pr-branch-mode"
              checked={mode === "new"}
              onChange={() => setMode("new")}
            />
            <span className="pr-branch-choice-label">
              Create new branch from{" "}
              <span className="dim mono">
                {repository?.currentBranch ?? ""}
              </span>
            </span>
          </label>
          {mode === "new" ? (
            <div className="pr-branch-name-row">
              <input
                ref={inputRef}
                className="pr-branch-name-input mono"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canRun) {
                    e.preventDefault();
                    onConfirm();
                  }
                }}
                placeholder="feature/new-branch-name"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
              <button
                type="button"
                className="pr-branch-name-wand"
                title="Suggest a branch name from the current diff"
                onClick={async () => {
                  if (generating) return;
                  setGenerating(true);
                  const suggestion = await generateBranchName();
                  setGenerating(false);
                  if (suggestion) {
                    setNewName(suggestion);
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }
                }}
                disabled={generating}
              >
                {generating ? <span className="ai-spinner" /> : I.sparkles}
              </button>
            </div>
          ) : null}
        </div>

        <div className="pr-branch-actions">
          <button className="ghost-btn" onClick={closeDialog} type="button">
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={onConfirm}
            disabled={!canRun}
            type="button"
          >
            Create PR
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

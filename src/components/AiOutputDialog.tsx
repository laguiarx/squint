import { useEffect, useRef } from "react";
import { useRepoStore } from "@/features/repository/repository.store";
import type { AiKind } from "@/features/ai/ai.types";
import { Overlay } from "./Overlay";
import { I } from "./Icons";

const TABS: { id: AiKind; label: string }[] = [
  { id: "commit", label: "Commit" },
  { id: "pr", label: "PR" },
  { id: "summary", label: "Summary" },
  { id: "risk", label: "Risk" },
];

/**
 * Centralized modal that streams AI Assist output (commit message / PR
 * description / summary / risk). Replaces the inline AiOutputSection that
 * used to live in the right sidebar — now that the trigger lives globally
 * in the topbar's `GitMenu`, the output is global too. Opens automatically
 * when `aiKind` is set; closing the modal clears `aiKind`.
 */
export function AiOutputDialog() {
  const aiKind = useRepoStore((s) => s.aiKind);
  const setAiKind = useRepoStore((s) => s.setAiKind);
  const pushToast = useRepoStore((s) => s.pushToast);
  const runAi = useRepoStore((s) => s.runAi);
  const aiOutput = useRepoStore((s) => s.aiOutput);
  const aiLoading = useRepoStore((s) => s.aiLoading);
  const aiError = useRepoStore((s) => s.aiError);
  const setSettingsOpen = useRepoStore((s) => s.setSettingsOpen);

  // Kick off the run when aiKind changes — same dedupe pattern as the old
  // inline section so we don't loop on re-render.
  const lastRunRef = useRef<AiKind | null>(null);
  useEffect(() => {
    if (!aiKind) {
      lastRunRef.current = null;
      return;
    }
    if (lastRunRef.current === aiKind) return;
    lastRunRef.current = aiKind;
    runAi(aiKind).catch(() => {
      /* errors land in aiError */
    });
  }, [aiKind, runAi]);

  if (!aiKind) return null;
  const tab = TABS.find((t) => t.id === aiKind);
  const currentLabel = tab?.label ?? "";

  const close = () => setAiKind(null);
  const copy = async () => {
    if (!aiOutput) return;
    try {
      await navigator.clipboard.writeText(aiOutput.text);
      pushToast("Copied to clipboard");
    } catch {
      pushToast("Clipboard unavailable");
    }
  };
  const regenerate = () => {
    lastRunRef.current = null;
    runAi(aiKind).catch(() => {
      /* errors land in aiError */
    });
  };

  return (
    <Overlay onClose={close} centered>
      <div
        className="ai-output-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`AI · ${currentLabel}`}
      >
        <div className="ai-output-dialog-head">
          <span className="ai-output-dialog-eyebrow mono dim">
            AI · {currentLabel}
          </span>
          <span className="flex-spacer" />
          <button
            className="ai-output-close"
            onClick={close}
            title="Close (Esc)"
            type="button"
          >
            {I.x}
          </button>
        </div>

        <div className="ai-output-dialog-body">
          {aiLoading ? (
            <div className="ai-loading">
              <span className="ai-spinner" />
              <span>Running {currentLabel.toLowerCase()}…</span>
            </div>
          ) : aiError ? (
            <div className="ai-error">
              <div className="ai-error-title">Couldn't run AI</div>
              <div className="ai-error-body mono">{aiError}</div>
              <div className="ai-actions-row">
                <button
                  className="ghost-btn"
                  onClick={() => {
                    close();
                    setSettingsOpen(true);
                  }}
                  type="button"
                >
                  Open Preferences
                </button>
                <button
                  className="ghost-btn"
                  onClick={regenerate}
                  type="button"
                >
                  {I.retry} Retry
                </button>
              </div>
            </div>
          ) : aiOutput ? (
            <>
              <pre className="ai-output-text mono">{aiOutput.text}</pre>
              <div className="ai-output-dialog-footer">
                <span className="ai-model dim mono">via {aiOutput.cliName}</span>
                <span className="flex-spacer" />
                <button className="ghost-btn" onClick={copy} type="button">
                  {I.copy} Copy
                </button>
                <button
                  className="ghost-btn"
                  onClick={regenerate}
                  type="button"
                >
                  {I.retry} Regenerate
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </Overlay>
  );
}

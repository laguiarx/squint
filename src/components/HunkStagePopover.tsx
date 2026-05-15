import { useEffect, useRef, useState } from "react";
import { I } from "./Icons";

type Props = {
  hunkIdx: number;
  filePath: string;
  busy: boolean;
  reverse: boolean; // true when the action unstages
  onCancel: () => void;
  onStageOnly: () => void;
  onStageAndCommit: (message: string) => void;
  /**
   * Optional AI generator — when provided, the "Generate" button is enabled
   * and clicking it fills the textarea with a draft. While unset, the button
   * renders as a "coming soon" placeholder.
   */
  onGenerate?: (signal: AbortSignal) => Promise<string>;
};

export function HunkStagePopover({
  hunkIdx,
  filePath,
  busy,
  reverse,
  onCancel,
  onStageOnly,
  onStageAndCommit,
  onGenerate,
}: Props) {
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    return () => abortRef.current?.abort();
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (message.trim()) onStageAndCommit(message.trim());
      else onStageOnly();
    }
  }

  async function generate() {
    if (!onGenerate || generating) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    try {
      const draft = await onGenerate(controller.signal);
      if (!controller.signal.aborted) setMessage(draft);
    } catch {
      /* swallow — caller should surface its own errors */
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }

  const stageLabel = reverse ? "Unstage only" : "Stage only";
  const commitLabel = reverse ? "Unstage & commit" : "Stage & commit";
  const eyebrow = reverse
    ? `Unstage hunk #${hunkIdx + 1}`
    : `Stage hunk #${hunkIdx + 1}`;
  const aiEnabled = !!onGenerate;

  return (
    <div className="hunk-popover">
      <div className="hunk-popover-head">
        <div className="hunk-popover-eyebrow mono dim">{eyebrow}</div>
        <div className="hunk-popover-path mono dim" title={filePath}>
          {filePath}
        </div>
        <button
          className="hunk-popover-close"
          onClick={onCancel}
          title="Cancel (Esc)"
        >
          {I.x}
        </button>
      </div>
      <div className="hunk-popover-input-wrap">
        <textarea
          ref={inputRef}
          className="hunk-popover-input mono"
          placeholder={
            generating
              ? "Generating commit message…"
              : "Commit message (optional) — ⌘↵ to confirm"
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          disabled={busy || generating}
        />
        <button
          type="button"
          className="hunk-popover-ai"
          onClick={generate}
          disabled={busy || generating || !aiEnabled}
          title={
            aiEnabled
              ? "Generate commit message from this hunk"
              : "AI assist — coming soon"
          }
        >
          <span className="hunk-popover-ai-icon">
            {generating ? (
              <span className="ai-spinner" />
            ) : (
              I.sparkles
            )}
          </span>
          <span>{generating ? "Generating…" : "Generate"}</span>
          {!aiEnabled ? (
            <span className="hunk-popover-ai-tag">soon</span>
          ) : null}
        </button>
      </div>
      <div className="hunk-popover-actions">
        <div className="hunk-popover-hint dim mono">
          {generating
            ? "Drafting from the hunk diff…"
            : message.trim()
              ? "Will commit the index after staging."
              : "Type a message to commit, or stage only."}
        </div>
        <div className="hunk-popover-buttons">
          <button
            className="ghost-btn"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="ghost-btn"
            onClick={onStageOnly}
            disabled={busy || generating}
          >
            {stageLabel}
          </button>
          <button
            className="primary-btn"
            onClick={() => onStageAndCommit(message.trim())}
            disabled={busy || generating || !message.trim()}
          >
            {commitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

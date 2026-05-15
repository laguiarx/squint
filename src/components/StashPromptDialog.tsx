import { useEffect, useRef, useState } from "react";
import { useRepoStore } from "@/features/repository/repository.store";
import { I } from "./Icons";
import { Overlay } from "./Overlay";

export function StashPromptDialog() {
  const pending = useRepoStore((s) => s.pendingStashCheckout);
  const cancel = useRepoStore((s) => s.cancelPendingStashCheckout);
  const confirm = useRepoStore((s) => s.confirmStashAndCheckout);

  const [message, setMessage] = useState("");
  const [includeUntracked, setIncludeUntracked] = useState(true);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Seed the input with the suggested message when the dialog opens.
  useEffect(() => {
    if (pending) {
      setMessage(pending.suggestedMessage);
      setBusy(false);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [pending]);

  if (!pending) return null;

  const submit = async () => {
    if (!message.trim() || busy) return;
    setBusy(true);
    await confirm(message.trim(), includeUntracked);
    setBusy(false);
  };

  return (
    <Overlay onClose={cancel} centered>
      <div className="stash-prompt">
        <div className="stash-prompt-head">
          <span className="stash-prompt-title">
            Stash changes to switch branches
          </span>
          <button
            className="settings-close"
            onClick={cancel}
            title="Cancel"
            aria-label="Cancel"
          >
            {I.x}
          </button>
        </div>
        <div className="stash-prompt-body">
          <p className="stash-prompt-sub">
            Your working tree has changes that would be overwritten by
            switching to <strong>{pending.target}</strong>. Stash them to
            continue — you can restore the stash later.
          </p>
          <label className="stash-prompt-field">
            <span className="stash-prompt-label">Stash message</span>
            <input
              ref={inputRef}
              className="stash-prompt-input"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <label className="stash-prompt-checkbox">
            <input
              type="checkbox"
              checked={includeUntracked}
              onChange={(e) => setIncludeUntracked(e.target.checked)}
            />
            <span>Include untracked files</span>
          </label>
        </div>
        <div className="stash-prompt-footer">
          <button
            className="ghost-btn"
            onClick={cancel}
            disabled={busy}
            type="button"
          >
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={submit}
            disabled={!message.trim() || busy}
            type="button"
          >
            {busy ? "Stashing…" : `Stash & switch to ${pending.target}`}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

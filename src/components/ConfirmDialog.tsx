import { Overlay } from "./Overlay";

type Props = {
  open: boolean;
  title?: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm?: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <Overlay onClose={onCancel} centered>
      <div className="confirm-card">
        <div className="confirm-title">{title}</div>
        <div className="confirm-body mono dim">{body}</div>
        <div className="confirm-actions">
          <button className="ghost-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={danger ? "danger-btn" : "primary-btn"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

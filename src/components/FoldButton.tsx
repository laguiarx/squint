type Props = {
  collapsed: boolean;
  onClick: () => void;
};

export function FoldButton({ collapsed, onClick }: Props) {
  return (
    <button
      type="button"
      className={`diff-fold-btn${collapsed ? " is-collapsed" : ""}`}
      onClick={onClick}
      title={collapsed ? "Expand hunk" : "Collapse hunk"}
      aria-label={collapsed ? "Expand hunk" : "Collapse hunk"}
      aria-expanded={!collapsed}
    >
      <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
        <path
          d="M2 3.5 L5 6.5 L8 3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

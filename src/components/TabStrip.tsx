import { useRepoStore, tabKey, type FileTab } from "@/features/repository/repository.store";
import { cn, basename } from "@/lib/utils";
import { I, STATUS_META } from "./Icons";

export function TabStrip() {
  const tabs = useRepoStore((s) => s.openTabs);
  const selectedFilePath = useRepoStore((s) => s.selectedFilePath);
  const selectedFileStaged = useRepoStore((s) => s.selectedFileStaged);
  const files = useRepoStore((s) => s.files);
  // Subscribe to the referentially-stable Set instead of the full edits
  // map — the Set's identity only changes when membership flips, so typing
  // in an already-dirty file no longer re-renders the tab strip.
  const dirtyPaths = useRepoStore((s) => s.dirtyPaths);
  const selectFile = useRepoStore((s) => s.selectFile);
  const closeTab = useRepoStore((s) => s.closeTab);

  if (tabs.length === 0) return null;

  return (
    <div className="tabstrip" role="tablist">
      {tabs.map((t) => {
        const isActive =
          t.path === selectedFilePath && t.staged === selectedFileStaged;
        const changed = files.find(
          (f) => f.path === t.path && f.staged === t.staged,
        );
        const meta = changed ? STATUS_META[changed.status] : null;
        const dirty = dirtyPaths.has(t.path);
        return (
          <TabItem
            key={tabKey(t)}
            tab={t}
            active={isActive}
            statusLetter={meta?.letter ?? null}
            statusColor={meta?.color ?? null}
            stagedHint={t.staged}
            dirty={dirty}
            onActivate={() => selectFile(t.path, t.staged)}
            onClose={() => closeTab(t)}
          />
        );
      })}
    </div>
  );
}

function TabItem({
  tab,
  active,
  statusLetter,
  statusColor,
  stagedHint,
  dirty,
  onActivate,
  onClose,
}: {
  tab: FileTab;
  active: boolean;
  statusLetter: string | null;
  statusColor: string | null;
  stagedHint: boolean | null;
  dirty: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  const name = basename(tab.path);
  const variantLabel =
    stagedHint === true ? "staged" : stagedHint === false ? "unstaged" : null;
  return (
    <div
      role="tab"
      aria-selected={active}
      className={cn("tab", active && "is-active")}
      onClick={onActivate}
      onMouseDown={(e) => {
        // Middle-click closes (common editor convention).
        if (e.button === 1) {
          e.preventDefault();
          onClose();
        }
      }}
      title={tab.path}
    >
      {statusLetter ? (
        <span
          className="tab-status"
          style={{ color: statusColor ?? undefined }}
        >
          {statusLetter}
        </span>
      ) : (
        <span className="tab-status tab-status-plain">·</span>
      )}
      <span className="tab-name">{name}</span>
      {variantLabel ? (
        <span className="tab-variant mono dim">{variantLabel}</span>
      ) : null}
      <button
        type="button"
        className="tab-close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title={dirty ? "Discard edits and close" : "Close tab (⌘W)"}
        aria-label="Close tab"
      >
        {dirty ? <span className="tab-dirty-dot" /> : I.x}
      </button>
    </div>
  );
}

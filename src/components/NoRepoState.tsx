import { useRepoStore } from "@/features/repository/repository.store";
import { I } from "./Icons";
import { Kbd } from "./Kbd";

function homeRelative(path: string): string {
  const home = "/Users/";
  if (path.startsWith(home)) {
    const idx = path.indexOf("/", home.length);
    if (idx > 0) return "~" + path.slice(idx);
  }
  return path;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(ms).toLocaleDateString();
}

type Props = {
  onOpen: () => void;
};

export function NoRepoState({ onOpen }: Props) {
  const recents = useRepoStore((s) => s.recentRepos);
  const openFromPath = useRepoStore((s) => s.openRepositoryFromPath);
  const forgetRecent = useRepoStore((s) => s.forgetRecent);

  return (
    <div className="norepo">
      <div className="norepo-card">
        <div className="norepo-mark">{I.folder}</div>
        <div className="norepo-title">
          Open a Git repository to start reviewing
        </div>
        <div className="norepo-sub mono dim">
          Point Review Desk at a local folder. We&apos;ll detect the current
          branch and surface every changed file.
        </div>
        <div className="norepo-actions">
          <button className="primary-btn" onClick={onOpen}>
            Open repository <Kbd>⌘O</Kbd>
          </button>
        </div>
        {recents.length > 0 ? (
          <div className="norepo-recent">
            <div className="norepo-recent-head mono dim">Recent</div>
            {recents.map((r) => (
              <button
                key={r.path}
                className="norepo-recent-row"
                onClick={() => openFromPath(r.path)}
              >
                <span className="norepo-recent-name">
                  <span>{r.name}</span>
                  <span className="mono dim">{homeRelative(r.path)}</span>
                </span>
                <span className="dim mono">
                  {r.branch}
                  {r.openedAt ? ` · ${timeAgo(r.openedAt)}` : ""}
                </span>
                <button
                  className="norepo-recent-forget"
                  title="Remove from recents"
                  onClick={(e) => {
                    e.stopPropagation();
                    forgetRecent(r.path);
                  }}
                >
                  {I.x}
                </button>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

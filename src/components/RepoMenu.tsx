import { useEffect, useMemo, useRef, useState } from "react";
import { useRepoStore } from "@/features/repository/repository.store";
import type { RecentRepo } from "@/lib/paths";
import { cn } from "@/lib/utils";
import { I } from "./Icons";
import { Kbd } from "./Kbd";

function homeRelative(path: string): string {
  const home = "/Users/";
  // Best-effort: collapse "/Users/<name>/..." to "~/..." for readability.
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

export function RepoMenu() {
  const open = useRepoStore((s) => s.repoMenuOpen);
  const setOpen = useRepoStore((s) => s.setRepoMenuOpen);
  const recents = useRepoStore((s) => s.recentRepos);
  const repository = useRepoStore((s) => s.repository);
  const openFromPath = useRepoStore((s) => s.openRepositoryFromPath);
  const pick = useRepoStore((s) => s.openRepositoryPicker);
  const forgetRecent = useRepoStore((s) => s.forgetRecent);

  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setFilter("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (ref.current && target && !ref.current.contains(target)) {
        // Don't close if the click was on the pill — it owns toggling.
        const pill = document.querySelector(".repo-pill");
        if (pill && pill.contains(target)) return;
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return recents;
    return recents.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.path.toLowerCase().includes(q),
    );
  }, [recents, filter]);

  if (!open) return null;

  return (
    <div className="repo-menu" ref={ref}>
      <div className="repo-menu-search">
        <span className="filter-icon">{I.search}</span>
        <input
          ref={inputRef}
          className="filter-input"
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter recent repositories…"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <div className="repo-menu-body">
        <button
          className="repo-open-toggle"
          onClick={() => {
            setOpen(false);
            pick();
          }}
          type="button"
        >
          <span className="repo-open-icon">{I.plus}</span>
          <span>Open another folder…</span>
          <span className="flex-spacer" />
          <Kbd>⌘O</Kbd>
        </button>
        {recents.length === 0 ? (
          <div className="repo-menu-empty dim">
            No recent projects yet. Open one to start.
          </div>
        ) : (
          <>
            <div className="repo-menu-section-head">Recent repositories</div>
            {filtered.length === 0 ? (
              <div className="repo-menu-empty dim">
                No repositories match &ldquo;{filter}&rdquo;
              </div>
            ) : (
              filtered.map((r: RecentRepo) => (
                <button
                  key={r.path}
                  className={cn(
                    "repo-menu-item",
                    repository?.path === r.path && "is-active",
                  )}
                  onClick={() => openFromPath(r.path)}
                >
                  <div className="repo-menu-item-main">
                    <span className="repo-menu-item-name">{r.name}</span>
                    <span className="repo-menu-item-path mono dim">
                      {homeRelative(r.path)}
                    </span>
                  </div>
                  <div className="repo-menu-item-meta mono dim">
                    {r.branch ? <span>{r.branch}</span> : null}
                    {r.openedAt ? <span>· {timeAgo(r.openedAt)}</span> : null}
                    <button
                      className="repo-menu-forget"
                      title="Remove from recents"
                      onClick={(e) => {
                        e.stopPropagation();
                        forgetRecent(r.path);
                      }}
                    >
                      {I.x}
                    </button>
                  </div>
                </button>
              ))
            )}
          </>
        )}
      </div>
      <div className="repo-menu-footer dim">
        {recents.length === 0
          ? "No recent repositories"
          : `${recents.length} recent ${recents.length === 1 ? "repository" : "repositories"}`}
      </div>
    </div>
  );
}

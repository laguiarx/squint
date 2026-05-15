import { useRepoStore } from "@/features/repository/repository.store";
import { I } from "./Icons";
import { IconBtn } from "./IconBtn";
import { RepoMenu } from "./RepoMenu";
import { BranchMenu } from "./BranchMenu";
import { EditorMenu } from "./EditorMenu";
import { GitMenu } from "./GitMenu";

export function TopBar() {
  const repository = useRepoStore((s) => s.repository);
  const setSettingsOpen = useRepoStore((s) => s.setSettingsOpen);
  const setShortcutsOpen = useRepoStore((s) => s.setShortcutsOpen);
  const repoMenuOpen = useRepoStore((s) => s.repoMenuOpen);
  const setRepoMenuOpen = useRepoStore((s) => s.setRepoMenuOpen);
  const branchMenuOpen = useRepoStore((s) => s.branchMenuOpen);
  const setBranchMenuOpen = useRepoStore((s) => s.setBranchMenuOpen);
  const openProjectInVscode = useRepoStore((s) => s.openProjectInVscode);
  const editorMenuOpen = useRepoStore((s) => s.editorMenuOpen);
  const setEditorMenuOpen = useRepoStore((s) => s.setEditorMenuOpen);
  const fetchEditors = useRepoStore((s) => s.fetchEditors);
  const leftSidebarVisible = useRepoStore(
    (s) => s.settings.leftSidebarVisible,
  );
  const toggleLeftSidebar = useRepoStore((s) => s.toggleLeftSidebar);
  const gitMenuOpen = useRepoStore((s) => s.gitMenuOpen);
  const setGitMenuOpen = useRepoStore((s) => s.setGitMenuOpen);
  const aiKind = useRepoStore((s) => s.aiKind);

  return (
    <header className="topbar" data-tauri-drag-region>
      <div className="topbar-left" data-tauri-drag-region>
        <div className="repo-pill-wrap">
          <button
            className={`repo-pill${repoMenuOpen ? " is-active" : ""}`}
            title="Switch project"
            onClick={() => {
              setRepoMenuOpen(!repoMenuOpen);
              if (branchMenuOpen) setBranchMenuOpen(false);
            }}
          >
            <span className="repo-pill-icon">{I.folder}</span>
            <span className="repo-pill-name">
              {repository?.name ?? "Open repository…"}
            </span>
            <span className="repo-pill-chev">{I.chevron}</span>
          </button>
          <RepoMenu />
        </div>
        {repository ? (
          <div className="branch-pill-wrap">
            <button
              className={`branch-pill${branchMenuOpen ? " is-active" : ""}`}
              title={
                repository.remote
                  ? `Tracking ${repository.remote} — click to switch`
                  : "Switch branch"
              }
              onClick={() => {
                setBranchMenuOpen(!branchMenuOpen);
                if (repoMenuOpen) setRepoMenuOpen(false);
              }}
            >
              <span className="branch-pill-icon">{I.branch}</span>
              <span className="mono">
                {repository.currentBranch || "(detached)"}
              </span>
              {repository.ahead > 0 ? (
                <span className="branch-ahead">↑{repository.ahead}</span>
              ) : null}
              <span className="repo-pill-chev">{I.chevron}</span>
            </button>
            <BranchMenu />
          </div>
        ) : null}
        {/* `repository.lastCommit` used to render here as a dim mono string
            (`fc6f53d · Merge branch 'dev' …`). It made the header noisy
            without adding actionable info — the branch pill already shows
            the current branch and `↑N` ahead count when relevant. */}
      </div>

      <div className="topbar-right" data-tauri-drag-region>
        <button
          className={`git-pill${gitMenuOpen ? " is-active" : ""}${aiKind ? " has-active-action" : ""}`}
          data-git-menu-trigger
          onClick={() => setGitMenuOpen(!gitMenuOpen)}
          disabled={!repository}
          title="Git · AI assist (commit, PR, summary, risk)"
          type="button"
        >
          <span className="git-pill-icon">{I.sparkles}</span>
          <span className="git-pill-label">Git</span>
          <span className="repo-pill-chev">{I.chevron}</span>
        </button>
        <GitMenu />
        <div className="editor-launcher">
          <button
            className="editor-launcher-main"
            onClick={() => {
              openProjectInVscode();
              fetchEditors().catch(() => {
                /* warm cache for next chevron click */
              });
            }}
            disabled={!repository}
            title="Open project in your preferred editor"
            type="button"
          >
            {I.code}
          </button>
          <button
            className={`editor-launcher-trigger${editorMenuOpen ? " is-active" : ""}`}
            onClick={() => {
              setEditorMenuOpen(!editorMenuOpen);
            }}
            disabled={!repository}
            title="Choose editor"
            type="button"
          >
            {I.chevron}
          </button>
          <EditorMenu />
        </div>
        <IconBtn
          title="Toggle left sidebar (⌘B)"
          onClick={toggleLeftSidebar}
          active={leftSidebarVisible}
        >
          {I.sidebarLeft}
        </IconBtn>
        <IconBtn
          title="Keyboard shortcuts"
          onClick={() => setShortcutsOpen(true)}
        >
          {I.keyboard}
        </IconBtn>
        <IconBtn
          title="Preferences (⌘,)"
          onClick={() => setSettingsOpen(true)}
        >
          {I.gear}
        </IconBtn>
      </div>
    </header>
  );
}

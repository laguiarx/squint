import { useEffect, useMemo, useRef, useState } from "react";
import { useRepoStore } from "@/features/repository/repository.store";
import { getFileDiff, readWorkingFile } from "@/features/git/git.api";
import type { ChangedFile, DiffResult, Hunk } from "@/features/git/git.types";
import {
  parseUnifiedDiff,
  syntheticAddedHunk,
  syntheticDeletedHunk,
} from "@/lib/parseDiff";
import { buildPatch } from "@/lib/patch";
import { buildSections } from "@/lib/sections";
import {
  buildLineHighlights,
  buildSearchRegex,
  findInSections,
  findInValue,
  valueLineHighlights,
  type LineHighlightMap,
} from "@/lib/findInDiff";
import { cn, detectLanguage } from "@/lib/utils";
import { I, STATUS_META } from "./Icons";
import { Kbd } from "./Kbd";
import { DiffSideBySide } from "./DiffSideBySide";
import { DiffInline } from "./DiffInline";
import { DiffEditor, type DiffEditorHandle } from "./DiffEditor";
import {
  InFileSearchBar,
  type InFileSearchBarHandle,
} from "./InFileSearchBar";
import { HunkStagePopover } from "./HunkStagePopover";
import { BinaryPreviewPane } from "./BinaryPreviewPane";

const EMPTY_HIGHLIGHTS: LineHighlightMap = new Map();

export function DiffPane() {
  const repo = useRepoStore((s) => s.repository);
  const selectedFilePath = useRepoStore((s) => s.selectedFilePath);
  const selectedFileStaged = useRepoStore((s) => s.selectedFileStaged);
  const files = useRepoStore((s) => s.files);
  const diffMode = useRepoStore((s) => s.diffMode);
  const setDiffMode = useRepoStore((s) => s.setDiffMode);
  const setError = useRepoStore((s) => s.setError);
  const selectAdjacentFile = useRepoStore((s) => s.selectAdjacentFile);
  // Per-path subscription: only re-render this pane when the *current*
  // file's buffer changes, not when any other open file's edits change.
  const editValue = useRepoStore((s) =>
    selectedFilePath ? s.edits[selectedFilePath] : undefined,
  );
  const savedValue = useRepoStore((s) =>
    selectedFilePath ? s.savedEdits[selectedFilePath] : undefined,
  );
  const setEdit = useRepoStore((s) => s.setEdit);
  const loadEditBuffer = useRepoStore((s) => s.loadEditBuffer);
  const applyHunkPatch = useRepoStore((s) => s.applyHunkPatch);
  const applyHunkPatchAndCommit = useRepoStore(
    (s) => s.applyHunkPatchAndCommit,
  );
  const requestRevertHunk = useRepoStore((s) => s.requestRevertHunk);
  const diffExpansion = useRepoStore((s) => s.settings.diffExpansion);

  const inFileSearchOpen = useRepoStore((s) => s.inFileSearchOpen);
  const setInFileSearchOpen = useRepoStore((s) => s.setInFileSearchOpen);
  const inFileSearchNonce = useRepoStore((s) => s.inFileSearchNonce);

  const file =
    files.find(
      (f) => f.path === selectedFilePath && f.staged === selectedFileStaged,
    ) ?? null;
  /** A path was chosen (likely via the tree or ⌘P) but it isn't a changed file. */
  const isUnchangedView = selectedFilePath != null && file == null;

  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);

  // In-file search state (local — only the open flag is shared with the store).
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCS, setSearchCS] = useState(false);
  const [searchRegex, setSearchRegex] = useState(false);
  const [searchIdx, setSearchIdx] = useState(0);

  // Per-hunk staging popover state — null when closed.
  const [pendingHunk, setPendingHunk] = useState<{
    hunkIdx: number;
    busy: boolean;
  } | null>(null);
  // When the working-file read fails with "Cannot edit a binary file" we
  // remember the path here and render an inline empty state in FilePane
  // instead of surfacing the error to the global banner — opening a binary
  // file isn't an error, it's just not editable.
  const [binaryPath, setBinaryPath] = useState<string | null>(null);
  // Hunks the user has collapsed via the header chevron.
  const [collapsedHunks, setCollapsedHunks] = useState<Set<number>>(
    () => new Set(),
  );
  const toggleHunkCollapsed = (hi: number) =>
    setCollapsedHunks((prev) => {
      const next = new Set(prev);
      if (next.has(hi)) next.delete(hi);
      else next.add(hi);
      return next;
    });

  const searchBarRef = useRef<InFileSearchBarHandle | null>(null);
  const editorRef = useRef<DiffEditorHandle | null>(null);
  const diffBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!repo || !file) {
      setDiff(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const path = file.path;
    const staged = file.staged;
    getFileDiff(repo.path, path, staged)
      .then((d) => {
        if (!cancelled) setDiff(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `file` itself is a fresh `.find(...)` reference on every render —
    // depending on it would re-fetch the diff on unrelated re-renders.
    // The path + staged tuple is what actually changes.
  }, [repo, file?.path, file?.staged, setError]);

  // Editor buffer for changed files in `edit` mode, or any file in unchanged
  // view. We prime both `edits` and `savedEdits` so the freshly-loaded file
  // isn't immediately considered dirty.
  useEffect(() => {
    if (!repo || !selectedFilePath) return;
    if (!isUnchangedView && diffMode !== "edit") return;
    // New path — clear any previous binary marker so we don't stick the
    // empty state on an unrelated file.
    if (binaryPath != null && binaryPath !== selectedFilePath) {
      setBinaryPath(null);
    }
    // Already classified this path as binary — skip the re-read so we
    // don't loop on the same error every render of this effect.
    if (binaryPath === selectedFilePath) return;
    if (editValue != null) return;
    let cancelled = false;
    readWorkingFile(repo.path, selectedFilePath)
      .then((content) => {
        if (!cancelled) loadEditBuffer(selectedFilePath, content);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        // "Cannot edit a binary file" is expected for keystores, images,
        // archives, etc. — don't blare a global error, just mark the path
        // so FilePane can render a friendly inline state.
        if (msg.toLowerCase().includes("binary")) {
          setBinaryPath(selectedFilePath);
        } else {
          setError(msg);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    repo,
    selectedFilePath,
    isUnchangedView,
    diffMode,
    editValue,
    loadEditBuffer,
    setError,
    binaryPath,
  ]);

  const hunks: Hunk[] = useMemo(() => {
    if (!diff || !file) return [];
    const parsed = parseUnifiedDiff(diff.diffText);
    if (parsed.length > 0) return parsed;
    if (file.status === "added" || file.status === "untracked") {
      if (diff.newContent) return [syntheticAddedHunk(diff.newContent)];
    }
    if (file.status === "deleted") {
      if (diff.oldContent) return [syntheticDeletedHunk(diff.oldContent)];
    }
    return [];
  }, [diff, file]);

  const sections = useMemo(() => {
    if (!file || !diff) return [];
    return buildSections(
      hunks,
      diff.oldContent,
      diff.newContent,
      diffExpansion,
      file.status,
    );
  }, [hunks, diff, diffExpansion, file]);

  // Reset state when switching files / modes.
  useEffect(() => {
    setSearchIdx(0);
    setPendingHunk(null);
    setCollapsedHunks(new Set());
  }, [selectedFilePath, diffMode]);

  useEffect(() => {
    if (inFileSearchOpen) {
      requestAnimationFrame(() => searchBarRef.current?.focus());
    }
  }, [inFileSearchOpen, inFileSearchNonce]);

  const { lineHighlights, matchCount, editorRange } = useMemo(() => {
    if (!inFileSearchOpen || !searchQuery) {
      return {
        lineHighlights: EMPTY_HIGHLIGHTS,
        matchCount: 0,
        editorRange: null as [number, number] | null,
      };
    }
    const re = buildSearchRegex(searchQuery, searchCS, searchRegex);
    if (!re) {
      return {
        lineHighlights: EMPTY_HIGHLIGHTS,
        matchCount: 0,
        editorRange: null,
      };
    }
    if (diffMode === "edit" && file && editValue != null) {
      const matches = findInValue(editValue, re);
      const cur = matches[searchIdx] ?? null;
      return {
        lineHighlights: valueLineHighlights(editValue, matches, searchIdx),
        matchCount: matches.length,
        editorRange: cur ? ([cur.start, cur.end] as [number, number]) : null,
      };
    }
    const matches = findInSections(sections, re);
    return {
      lineHighlights: buildLineHighlights(matches, searchIdx),
      matchCount: matches.length,
      editorRange: null,
    };
  }, [
    inFileSearchOpen,
    searchQuery,
    searchCS,
    searchRegex,
    diffMode,
    file,
    editValue,
    sections,
    searchIdx,
  ]);

  useEffect(() => {
    if (searchIdx >= matchCount) {
      setSearchIdx(matchCount === 0 ? 0 : matchCount - 1);
    }
  }, [matchCount, searchIdx]);

  useEffect(() => {
    if (!inFileSearchOpen || matchCount === 0) return;
    if (diffMode === "edit") return;
    const root = diffBodyRef.current;
    if (!root) return;
    const el = root.querySelector(".hl-current");
    if (el && typeof (el as HTMLElement).scrollIntoView === "function") {
      (el as HTMLElement).scrollIntoView({
        block: "center",
        inline: "nearest",
      });
    }
  }, [searchIdx, matchCount, diffMode, inFileSearchOpen, lineHighlights]);

  useEffect(() => {
    if (diffMode !== "edit" || !editorRange || !editorRef.current) return;
    // Pass `focus: false` — the user is typing in the search bar; we just
    // want the matched line scrolled into view, not focus stolen.
    editorRef.current.selectRange(editorRange[0], editorRange[1], false);
  }, [diffMode, editorRange]);

  function nextMatch() {
    if (matchCount === 0) return;
    setSearchIdx((i) => (i + 1) % matchCount);
  }
  function prevMatch() {
    if (matchCount === 0) return;
    setSearchIdx((i) => (i - 1 + matchCount) % matchCount);
  }

  if (!repo) return null;
  if (isUnchangedView && selectedFilePath) {
    // Look up a changed entry for this path — prefer unstaged (working-tree
    // diff) since the editor is showing working-tree contents.
    const matchingChanged =
      files.find((f) => f.path === selectedFilePath && !f.staged) ??
      files.find((f) => f.path === selectedFilePath) ??
      null;
    return (
      <FilePane
        repoPath={repo.path}
        filePath={selectedFilePath}
        editValue={editValue ?? ""}
        savedValue={savedValue ?? null}
        onChange={(v) => setEdit(selectedFilePath, v)}
        changedEntry={matchingChanged}
        isBinary={binaryPath === selectedFilePath}
      />
    );
  }
  if (!file) {
    return (
      <main className="diffpane">
        <div className="diff-empty">
          <div className="diff-empty-icon">{I.folder}</div>
          <div className="diff-empty-title">
            {files.length === 0
              ? "No changes — working tree is clean"
              : "Pick a file to start reviewing"}
          </div>
          <div className="diff-empty-sub mono dim">
            Press <Kbd>⌥↓</Kbd> to jump to the next changed file, or{" "}
            <Kbd>⌘P</Kbd> for commands.
          </div>
        </div>
      </main>
    );
  }

  const lang = detectLanguage(file.path);
  const meta = STATUS_META[file.status];
  const dir = file.path.includes("/")
    ? file.path.slice(0, file.path.lastIndexOf("/"))
    : "";
  const name = file.path.split("/").pop() ?? file.path;
  const fileEditValue = editValue ?? "";
  const fileSavedValue = savedValue ?? null;
  const dirty =
    diffMode === "edit" &&
    editValue != null &&
    fileEditValue !== fileSavedValue;

  const hunkActionEnabled =
    diffMode !== "edit" &&
    !diff?.isBinary &&
    file.status === "modified" &&
    hunks.length > 0;

  const reverseStage = file.staged;
  const hunkActions = hunkActionEnabled
    ? {
        primary: {
          kind: (reverseStage ? "unstage" : "stage") as "stage" | "unstage",
          label: reverseStage ? "Unstage hunk" : "Stage hunk",
          onClick: (hunkIdx: number) => {
            setPendingHunk((prev) =>
              prev && prev.hunkIdx === hunkIdx
                ? null
                : { hunkIdx, busy: false },
            );
          },
        },
        // Revert only makes sense for working-tree hunks (unstaged file).
        // For staged hunks the equivalent action is "unstage" which is
        // already covered by the primary button.
        revert: !reverseStage
          ? {
              label: "Revert hunk (discard from working tree)",
              onClick: (hunkIdx: number) => {
                const target = hunks[hunkIdx];
                if (!target) return;
                const patch = buildPatch(
                  file.path,
                  [target],
                  file.oldPath ?? undefined,
                );
                requestRevertHunk(patch, hunkIdx, file.path);
              },
            }
          : undefined,
      }
    : null;

  const popoverNode =
    hunkActionEnabled && pendingHunk
      ? (
          <HunkStagePopover
            hunkIdx={pendingHunk.hunkIdx}
            filePath={file.path}
            busy={pendingHunk.busy}
            reverse={reverseStage}
            onCancel={() => setPendingHunk(null)}
            onStageOnly={async () => {
              const target = hunks[pendingHunk.hunkIdx];
              if (!target) return;
              const patch = buildPatch(
                file.path,
                [target],
                file.oldPath ?? undefined,
              );
              setPendingHunk({ ...pendingHunk, busy: true });
              await applyHunkPatch(
                patch,
                reverseStage,
                reverseStage
                  ? `Unstaged hunk #${pendingHunk.hunkIdx + 1}`
                  : `Staged hunk #${pendingHunk.hunkIdx + 1}`,
              );
              setPendingHunk(null);
            }}
            onStageAndCommit={async (message) => {
              const target = hunks[pendingHunk.hunkIdx];
              if (!target) return;
              const patch = buildPatch(
                file.path,
                [target],
                file.oldPath ?? undefined,
              );
              setPendingHunk({ ...pendingHunk, busy: true });
              await applyHunkPatchAndCommit(
                patch,
                reverseStage,
                message,
                reverseStage
                  ? `Unstaged & committed`
                  : `Staged & committed`,
              );
              setPendingHunk(null);
            }}
          />
        )
      : null;

  return (
    <main className="diffpane">
      <div className="diff-header">
        <div className="diff-header-left">
          <span
            className="file-status diff-status"
            style={{ color: meta.color }}
          >
            {meta.letter}
          </span>
          <span className="diff-path mono">
            {dir ? <span className="dim">{dir}/</span> : null}
            <span>{name}</span>
          </span>
          <span className="diff-header-stats mono">
            <span className="diffstat-add">+{file.additions}</span>
            <span className="diffstat-del">−{file.deletions}</span>
          </span>
          {diffMode === "edit" && dirty ? (
            <span className="diff-saved-pill">● unsaved</span>
          ) : null}
        </div>
        <div className="diff-header-right">
          <div className="seg seg-icons">
            <button
              type="button"
              className={cn("seg-btn", diffMode === "sbs" && "is-active")}
              onClick={() => setDiffMode("sbs")}
              title="Side-by-side"
              aria-label="Side-by-side"
            >
              {I.splitView}
            </button>
            <button
              type="button"
              className={cn("seg-btn", diffMode === "inline" && "is-active")}
              onClick={() => setDiffMode("inline")}
              title="Inline"
              aria-label="Inline"
            >
              {I.inlineView}
            </button>
            <button
              type="button"
              className={cn("seg-btn", diffMode === "edit" && "is-active")}
              onClick={() => setDiffMode("edit")}
              title="Edit"
              aria-label="Edit"
            >
              {I.edit}
            </button>
          </div>
          <button
            className="ghost-btn"
            onClick={() => selectAdjacentFile(-1)}
            title="Previous file (⌥↑)"
          >
            ↑
          </button>
          <button
            className="ghost-btn"
            onClick={() => selectAdjacentFile(1)}
            title="Next file (⌥↓)"
          >
            ↓
          </button>
        </div>
      </div>
      <div className="diff-body-wrap">
        {inFileSearchOpen ? (
          <InFileSearchBar
            ref={searchBarRef}
            query={searchQuery}
            caseSensitive={searchCS}
            regex={searchRegex}
            total={matchCount}
            current={matchCount === 0 ? -1 : searchIdx}
            onQueryChange={(q) => {
              setSearchQuery(q);
              setSearchIdx(0);
            }}
            onToggleCase={() => setSearchCS((v) => !v)}
            onToggleRegex={() => setSearchRegex((v) => !v)}
            onNext={nextMatch}
            onPrev={prevMatch}
            onClose={() => setInFileSearchOpen(false)}
          />
        ) : null}
        <div className="diff-body" ref={diffBodyRef}>
          {loading && !diff ? (
            <div className="diff-empty">
              <div className="diff-empty-sub mono dim">Loading diff…</div>
            </div>
          ) : diff?.isBinary ? (
            <BinaryPreviewPane
              repoPath={repo.path}
              filePath={file.path}
              staged={file.staged}
              status={file.status}
            />
          ) : diffMode === "sbs" ? (
            <DiffSideBySide
              sections={sections}
              lang={lang}
              status={file.status}
              lineHighlights={lineHighlights}
              hunkActions={hunkActions}
              popoverHunkIdx={pendingHunk?.hunkIdx ?? null}
              popoverNode={popoverNode}
              collapsedHunks={collapsedHunks}
              onToggleHunk={toggleHunkCollapsed}
            />
          ) : diffMode === "inline" ? (
            <DiffInline
              sections={sections}
              lang={lang}
              lineHighlights={lineHighlights}
              hunkActions={hunkActions}
              popoverHunkIdx={pendingHunk?.hunkIdx ?? null}
              popoverNode={popoverNode}
              collapsedHunks={collapsedHunks}
              onToggleHunk={toggleHunkCollapsed}
            />
          ) : (
            <DiffEditor
              ref={editorRef}
              value={fileEditValue}
              onChange={(v) => setEdit(file.path, v)}
              lang={lang}
              lineHighlights={lineHighlights}
            />
          )}
        </div>
      </div>
      <div className="diff-footer mono dim">
        <span>{lang.toUpperCase()}</span>
        <span>·</span>
        <span>UTF-8</span>
        <span>·</span>
        <span>LF</span>
        <span>·</span>
        <span>
          {hunks.length} hunk{hunks.length === 1 ? "" : "s"}
        </span>
        <span className="flex-spacer" />
        <span>
          {diffMode === "edit"
            ? dirty
              ? "Editing · unsaved changes"
              : "Editing · no changes"
            : diffExpansion === "full"
              ? "Full file"
              : "Hunks only"}
        </span>
      </div>
    </main>
  );
}

/**
 * Render path for files the user picked from the file tree / Search / ⌘P.
 * Shows the working-tree contents as a single editor pane. When the file is
 * also a changed entry, we still show the full file (not a diff) but paint a
 * subtle gutter stripe on lines that differ from HEAD/index.
 */
function FilePane({
  repoPath,
  filePath,
  editValue,
  savedValue,
  onChange,
  changedEntry,
  isBinary,
}: {
  repoPath: string;
  filePath: string;
  editValue: string;
  savedValue: string | null;
  onChange: (v: string) => void;
  changedEntry: ChangedFile | null;
  isBinary: boolean;
}) {
  const lang = detectLanguage(filePath);
  const dir = filePath.includes("/")
    ? filePath.slice(0, filePath.lastIndexOf("/"))
    : "";
  const name = filePath.split("/").pop() ?? filePath;
  const dirty = savedValue != null && editValue !== savedValue;
  const editorRef = useRef<DiffEditorHandle | null>(null);
  const setError = useRepoStore((s) => s.setError);
  const meta = changedEntry ? STATUS_META[changedEntry.status] : null;

  // In-file search (⌘F). Lives in the FilePane so it works when the user
  // opens a file from the Files tree / Search jump / ⌘P palette.
  const inFileSearchOpen = useRepoStore((s) => s.inFileSearchOpen);
  const setInFileSearchOpen = useRepoStore((s) => s.setInFileSearchOpen);
  const inFileSearchNonce = useRepoStore((s) => s.inFileSearchNonce);
  const searchBarRef = useRef<InFileSearchBarHandle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCS, setSearchCS] = useState(false);
  const [searchRegex, setSearchRegex] = useState(false);
  const [searchIdx, setSearchIdx] = useState(0);

  useEffect(() => {
    if (inFileSearchOpen) {
      requestAnimationFrame(() => searchBarRef.current?.focus());
    }
  }, [inFileSearchOpen, inFileSearchNonce]);

  // Reset search index when the user types something new.
  useEffect(() => {
    setSearchIdx(0);
  }, [searchQuery, searchCS, searchRegex]);

  const { lineHighlights, matchCount, editorRange } = useMemo(() => {
    if (!inFileSearchOpen || !searchQuery) {
      return {
        lineHighlights: EMPTY_HIGHLIGHTS,
        matchCount: 0,
        editorRange: null as [number, number] | null,
      };
    }
    const re = buildSearchRegex(searchQuery, searchCS, searchRegex);
    if (!re) {
      return {
        lineHighlights: EMPTY_HIGHLIGHTS,
        matchCount: 0,
        editorRange: null,
      };
    }
    const matches = findInValue(editValue, re);
    const cur = matches[searchIdx] ?? null;
    return {
      lineHighlights: valueLineHighlights(editValue, matches, searchIdx),
      matchCount: matches.length,
      editorRange: cur ? ([cur.start, cur.end] as [number, number]) : null,
    };
  }, [
    inFileSearchOpen,
    searchQuery,
    searchCS,
    searchRegex,
    editValue,
    searchIdx,
  ]);

  useEffect(() => {
    if (!editorRange || !editorRef.current) return;
    // Same as the diff-edit branch above: don't pull focus away from the
    // search input while the user is typing.
    editorRef.current.selectRange(editorRange[0], editorRange[1], false);
  }, [editorRange]);

  function nextMatch() {
    if (matchCount === 0) return;
    setSearchIdx((i) => (i + 1) % matchCount);
  }
  function prevMatch() {
    if (matchCount === 0) return;
    setSearchIdx((i) => (i - 1 + matchCount) % matchCount);
  }

  // Compute changed line numbers (in the working-tree file) for gutter marks.
  const [changedLines, setChangedLines] = useState<Set<number>>(
    () => new Set(),
  );
  useEffect(() => {
    if (!changedEntry) {
      setChangedLines(new Set());
      return;
    }
    let cancelled = false;
    getFileDiff(repoPath, changedEntry.path, changedEntry.staged)
      .then((diff) => {
        if (cancelled) return;
        const hunks = parseUnifiedDiff(diff.diffText);
        const marks = new Set<number>();
        for (const h of hunks) {
          for (const l of h.lines) {
            if (l.t === "add" && l.n_new != null) marks.add(l.n_new);
          }
        }
        setChangedLines(marks);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [repoPath, changedEntry, setError]);

  return (
    <main className="diffpane">
      <div className="diff-header">
        <div className="diff-header-left">
          <span
            className="file-status diff-status"
            style={{ color: meta?.color ?? "var(--fg-3)" }}
            title={meta?.label ?? "Unchanged"}
          >
            {meta?.letter ?? "·"}
          </span>
          <span className="diff-path mono">
            {dir ? <span className="dim">{dir}/</span> : null}
            <span>{name}</span>
          </span>
          <span
            className="status-pill"
            style={{ color: meta ? meta.color : "var(--fg-2)" }}
          >
            <span
              className="status-pill-dot"
              style={{ background: meta?.color ?? "var(--fg-3)" }}
            />
            {meta?.label ?? "Unchanged"}
          </span>
          {dirty ? (
            <span className="diff-saved-pill">● unsaved</span>
          ) : null}
        </div>
      </div>
      <div className="diff-body-wrap">
        {inFileSearchOpen ? (
          <InFileSearchBar
            ref={searchBarRef}
            query={searchQuery}
            caseSensitive={searchCS}
            regex={searchRegex}
            total={matchCount}
            current={matchCount === 0 ? -1 : searchIdx}
            onQueryChange={setSearchQuery}
            onToggleCase={() => setSearchCS((v) => !v)}
            onToggleRegex={() => setSearchRegex((v) => !v)}
            onNext={nextMatch}
            onPrev={prevMatch}
            onClose={() => setInFileSearchOpen(false)}
          />
        ) : null}
        <div className="diff-body">
          {isBinary ? (
            // Binary file (keystore, image, archive, …) — the read failed
            // with "Cannot edit a binary file" but that's expected, not an
            // error worth blaring. Show a calm inline state instead.
            <div className="file-loading">
              <span className="file-loading-title">Binary file</span>
              <span className="file-loading-sub dim">
                <code className="mono">{filePath}</code> isn't text — it
                can't be opened in the editor.
              </span>
            </div>
          ) : savedValue === null ? (
            <div className="file-loading">
              <span className="ai-spinner" />
              <span>Reading {filePath}…</span>
            </div>
          ) : savedValue === "" && editValue === "" ? (
            // Empty file — surface this explicitly. Lets the user tell
            // "broken render" apart from "really empty file on disk", and
            // gives them a one-click way to force a re-read in case the
            // buffer was loaded as "" while the file actually has content.
            <div className="file-loading">
              <span className="file-loading-title">This file is empty</span>
              <span className="file-loading-sub dim">
                Disk reports 0 bytes for{" "}
                <code className="mono">{filePath}</code>.
              </span>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  readWorkingFile(repoPath, filePath)
                    .then((content) =>
                      useRepoStore
                        .getState()
                        .loadEditBuffer(filePath, content),
                    )
                    .catch((err) =>
                      setError(
                        err instanceof Error ? err.message : String(err),
                      ),
                    );
                }}
              >
                Re-read from disk
              </button>
            </div>
          ) : (
            <DiffEditor
              ref={editorRef}
              value={editValue}
              onChange={onChange}
              lang={lang}
              changedLines={changedLines}
              lineHighlights={lineHighlights}
            />
          )}
        </div>
      </div>
      <div className="diff-footer mono dim">
        <span>{lang.toUpperCase()}</span>
        <span>·</span>
        <span>UTF-8</span>
        <span>·</span>
        <span>LF</span>
        <span className="flex-spacer" />
        {isBinary ? null : (
          <>
            <button
              type="button"
              className="diff-footer-action"
              title="Discard the in-memory buffer and re-read this file from disk"
              onClick={() => {
                readWorkingFile(repoPath, filePath)
                  .then((content) =>
                    useRepoStore
                      .getState()
                      .loadEditBuffer(filePath, content),
                  )
                  .catch((err) =>
                    setError(
                      err instanceof Error ? err.message : String(err),
                    ),
                  );
              }}
            >
              Re-read from disk
            </button>
            <span>·</span>
          </>
        )}
        <span>
          {isBinary
            ? "Binary file · read-only"
            : dirty
              ? "Editing · unsaved changes"
              : changedEntry
                ? "Editing file · gutter marks show modified lines"
                : "Editing unchanged file"}
        </span>
      </div>
    </main>
  );
}


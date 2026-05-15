import { useEffect, useMemo, useState } from "react";
import { useRepoStore } from "@/features/repository/repository.store";
import {
  ancestorsOf,
  buildTree,
  flattenTree,
  type TreeNode,
} from "@/lib/tree";
import { cn } from "@/lib/utils";
import { I, STATUS_META } from "./Icons";

export function FileTree() {
  const repoFiles = useRepoStore((s) => s.repoFiles);
  const repoFilesLoading = useRepoStore((s) => s.repoFilesLoading);
  const fetchRepoFiles = useRepoStore((s) => s.fetchRepoFiles);
  // Include the repo path so the effect re-fires when the user switches
  // projects (the previous repo's `repoFiles` is reset to [] in the store,
  // but a stable `fetchRepoFiles` ref meant this effect never re-ran).
  const repoPath = useRepoStore((s) => s.repository?.path);
  const files = useRepoStore((s) => s.files);
  const selectedFilePath = useRepoStore((s) => s.selectedFilePath);
  const selectFile = useRepoStore((s) => s.selectFile);

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!repoPath) return;
    fetchRepoFiles().catch(() => {
      /* error already surfaced */
    });
  }, [repoPath, fetchRepoFiles]);

  const tree = useMemo<TreeNode>(() => buildTree(repoFiles), [repoFiles]);

  const changedByPath = useMemo(() => {
    const m = new Map<string, (typeof files)[number]>();
    files.forEach((f) => m.set(f.path, f));
    return m;
  }, [files]);

  // Auto-expand ancestors of the selected file so the active row is visible.
  useEffect(() => {
    if (!selectedFilePath) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      ancestorsOf(selectedFilePath).forEach((p) => next.add(p));
      return next;
    });
  }, [selectedFilePath]);

  const rows = useMemo(() => flattenTree(tree, expanded), [tree, expanded]);

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  if (repoFilesLoading && repoFiles.length === 0) {
    return (
      <div className="tree-loading mono dim">Indexing repository…</div>
    );
  }
  if (repoFiles.length === 0) {
    return (
      <div className="tree-loading mono dim">No files found.</div>
    );
  }

  return (
    <div className="tree">
      {rows.map((row) => {
        const isDir = row.node.kind === "dir";
        const isSelected = !isDir && row.node.path === selectedFilePath;
        const changed = changedByPath.get(row.node.path);
        const meta = changed ? STATUS_META[changed.status] : null;
        return (
          <div
            key={row.node.path}
            className={cn(
              "tree-node-row",
              isSelected && "is-selected",
            )}
            style={{ paddingLeft: 4 + row.depth * 6 }}
            onClick={() => {
              if (isDir) toggle(row.node.path);
              else selectFile(row.node.path, null);
            }}
            title={row.node.name}
          >
            {isDir ? (
              <span
                className={cn("tree-node-chev", row.isOpen && "is-open")}
              >
                {I.chevron}
              </span>
            ) : null}
            <span
              className={cn(
                "tree-icon",
                isDir ? "tree-icon-dir" : "tree-icon-file",
                row.isOpen && "is-open",
              )}
            >
              {isDir
                ? row.isOpen
                  ? I.folderOpen
                  : I.folder
                : I.fileSmall}
            </span>
            <span className={cn("tree-name", isDir && "is-dir")}>
              {row.node.name}
            </span>
            {meta ? (
              <span
                className="tree-status"
                style={{ color: meta.color }}
                title={meta.label}
              >
                {meta.letter}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

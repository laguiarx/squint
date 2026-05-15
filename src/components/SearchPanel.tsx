import { useEffect, useMemo, useRef, useState } from "react";
import { useRepoStore } from "@/features/repository/repository.store";
import type {
  SearchResult,
  SearchScope,
} from "@/features/search/search.types";
import { buildTree, type TreeNode } from "@/lib/tree";
import { cn } from "@/lib/utils";
import { I } from "./Icons";

type FileGroup = { filePath: string; items: SearchResult[] };

export function SearchPanel() {
  const repo = useRepoStore((s) => s.repository);
  const selectedFilePath = useRepoStore((s) => s.selectedFilePath);
  const query = useRepoStore((s) => s.searchQuery);
  const scope = useRepoStore((s) => s.searchScope);
  const caseSensitive = useRepoStore((s) => s.searchCaseSensitive);
  const regex = useRepoStore((s) => s.searchRegex);
  const include = useRepoStore((s) => s.searchInclude);
  const exclude = useRepoStore((s) => s.searchExclude);
  const filtersOpen = useRepoStore((s) => s.searchFiltersOpen);
  const results = useRepoStore((s) => s.searchResults);
  const loading = useRepoStore((s) => s.searchLoading);
  const focusNonce = useRepoStore((s) => s.searchFocusNonce);
  const searchView = useRepoStore((s) => s.settings.searchView);

  const setSearchQuery = useRepoStore((s) => s.setSearchQuery);
  const setSearchScope = useRepoStore((s) => s.setSearchScope);
  const setSearchCaseSensitive = useRepoStore((s) => s.setSearchCaseSensitive);
  const setSearchRegex = useRepoStore((s) => s.setSearchRegex);
  const setSearchInclude = useRepoStore((s) => s.setSearchInclude);
  const setSearchExclude = useRepoStore((s) => s.setSearchExclude);
  const setFiltersOpen = useRepoStore((s) => s.setSearchFiltersOpen);
  const runRepoSearch = useRepoStore((s) => s.runRepoSearch);
  const setSearchView = useRepoStore((s) => s.setSearchView);
  const selectFile = useRepoStore((s) => s.selectFile);
  const pushToast = useRepoStore((s) => s.pushToast);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Folders/files the user has collapsed. Empty = everything expanded by
  // default. New search results don't reset this — keeps the user's choices
  // sticky across debounced re-searches.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (path: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusNonce]);

  useEffect(() => {
    if (!repo) return;
    const handle = setTimeout(() => {
      runRepoSearch();
    }, 180);
    return () => clearTimeout(handle);
  }, [
    repo,
    query,
    scope,
    caseSensitive,
    regex,
    include,
    exclude,
    selectedFilePath,
    runRepoSearch,
  ]);

  const grouped: FileGroup[] = useMemo(() => groupByFile(results), [results]);

  const jump = (hit: SearchResult) => {
    selectFile(hit.filePath, null);
    pushToast(`Jumped to ${hit.filePath}:${hit.lineNumber}`);
  };

  return (
    <>
      <div className="sidebar-head sb-search-head">
        <div className="sb-search-input-row">
          <span className="filter-icon">{I.search}</span>
          <input
            ref={inputRef}
            className="filter-input"
            type="text"
            value={query}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find in repository"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button
              className="filter-clear"
              onClick={() => setSearchQuery("")}
              title="Clear"
            >
              {I.x}
            </button>
          ) : null}
        </div>
        <div className="sb-search-flags">
          <ScopeBtn
            current={scope}
            value="all"
            onClick={setSearchScope}
            label="All files"
          />
          <ScopeBtn
            current={scope}
            value="changed"
            onClick={setSearchScope}
            label="Changed"
          />
          <ScopeBtn
            current={scope}
            value="current"
            onClick={setSearchScope}
            label="Current"
            disabled={!selectedFilePath}
          />
          <span className="flex-spacer" />
          <button
            className={cn("flag", caseSensitive && "is-on")}
            onClick={() => setSearchCaseSensitive(!caseSensitive)}
            title="Match case"
          >
            Aa
          </button>
          <button
            className={cn("flag", regex && "is-on")}
            onClick={() => setSearchRegex(!regex)}
            title="Regex"
          >
            .*
          </button>
          <button
            className={cn(
              "flag",
              (filtersOpen || include || exclude) && "is-on",
            )}
            onClick={() => setFiltersOpen(!filtersOpen)}
            title="Toggle search details (files to include/exclude)"
            aria-label="Toggle search details"
          >
            {I.ellipsis}
          </button>
        </div>
        {filtersOpen ? (
          <div className="sb-search-filters">
            <label className="sb-search-filter-row">
              <span className="sb-search-filter-label">
                Files to include
              </span>
              <input
                className="sb-search-filter-input"
                type="text"
                value={include}
                onChange={(e) => setSearchInclude(e.target.value)}
                placeholder="e.g. *.ts, src/**"
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <label className="sb-search-filter-row">
              <span className="sb-search-filter-label">
                Files to exclude
              </span>
              <input
                className="sb-search-filter-input"
                type="text"
                value={exclude}
                onChange={(e) => setSearchExclude(e.target.value)}
                placeholder="e.g. **/node_modules, dist"
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          </div>
        ) : null}
        <div className="sb-search-status-row">
          <span className="sb-search-status dim">
            {loading
              ? "Searching…"
              : query.trim() === ""
                ? "Type to search"
                : `${results.length} match${results.length === 1 ? "" : "es"} in ${grouped.length} file${grouped.length === 1 ? "" : "s"}`}
          </span>
          <span className="flex-spacer" />
          <div className="sb-search-view-toggle">
            <button
              className={cn("view-btn", searchView === "list" && "is-active")}
              onClick={() => setSearchView("list")}
              title="View as list"
              type="button"
            >
              {I.viewList}
            </button>
            <button
              className={cn("view-btn", searchView === "tree" && "is-active")}
              onClick={() => setSearchView("tree")}
              title="View as tree"
              type="button"
            >
              {I.viewTree}
            </button>
          </div>
        </div>
      </div>
      <div className="sidebar-list">
        {grouped.length === 0 && query.trim() !== "" && !loading ? (
          <div className="sidebar-empty mono dim">
            <div>No matches.</div>
          </div>
        ) : null}
        {searchView === "list" ? (
          <ListView
            groups={grouped}
            query={query}
            caseSensitive={caseSensitive}
            regex={regex}
            collapsed={collapsed}
            onToggle={toggle}
            onJump={jump}
          />
        ) : (
          <TreeView
            groups={grouped}
            query={query}
            caseSensitive={caseSensitive}
            regex={regex}
            collapsed={collapsed}
            onToggle={toggle}
            onJump={jump}
          />
        )}
      </div>
    </>
  );
}

// ---------- list view ----------

function ListView({
  groups,
  query,
  caseSensitive,
  regex,
  collapsed,
  onToggle,
  onJump,
}: {
  groups: FileGroup[];
  query: string;
  caseSensitive: boolean;
  regex: boolean;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
  onJump: (hit: SearchResult) => void;
}) {
  return (
    <>
      {groups.map((g) => {
        const open = !collapsed.has(g.filePath);
        return (
          <div key={g.filePath} className="sb-sr-group">
            <button
              className="sb-sr-group-head"
              onClick={() => onToggle(g.filePath)}
              title={g.filePath}
            >
              <span className={cn("sb-group-chev", open && "is-open")}>
                {I.chevron}
              </span>
              <span className="sb-sr-group-path mono">{g.filePath}</span>
              <span className="sb-sr-group-count">{g.items.length}</span>
            </button>
            {open ? (
              <div className="sb-sr-group-body">
                {g.items.map((h, i) => (
                  <HitRow
                    key={`${h.filePath}:${h.lineNumber}:${i}`}
                    hit={h}
                    query={query}
                    caseSensitive={caseSensitive}
                    regex={regex}
                    onJump={onJump}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

// ---------- tree view ----------

function TreeView({
  groups,
  query,
  caseSensitive,
  regex,
  collapsed,
  onToggle,
  onJump,
}: {
  groups: FileGroup[];
  query: string;
  caseSensitive: boolean;
  regex: boolean;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
  onJump: (hit: SearchResult) => void;
}) {
  const tree = useMemo(
    () => buildTree(groups.map((g) => g.filePath)),
    [groups],
  );
  const byPath = useMemo(
    () => new Map(groups.map((g) => [g.filePath, g.items])),
    [groups],
  );
  // Aggregate match count by directory (sum of descendant file matches).
  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    function walk(node: TreeNode): number {
      if (node.kind === "file") return byPath.get(node.path)?.length ?? 0;
      const total =
        node.children?.reduce((acc, c) => acc + walk(c), 0) ?? 0;
      if (node.path) counts.set(node.path, total);
      return total;
    }
    walk(tree);
    return counts;
  }, [tree, byPath]);

  function renderNode(node: TreeNode, depth: number): React.ReactNode[] {
    if (node.kind === "dir") {
      const open = !collapsed.has(node.path);
      const count = folderCounts.get(node.path) ?? 0;
      const out: React.ReactNode[] = [
        <button
          key={`dir:${node.path}`}
          className="sb-tree-row"
          style={{ paddingLeft: 4 + depth * 6 }}
          onClick={() => onToggle(node.path)}
          title={node.path}
        >
          <span className={cn("sb-group-chev", open && "is-open")}>
            {I.chevron}
          </span>
          <span
            className={cn("tree-icon", open ? "is-open" : "tree-icon-dir")}
          >
            {open ? I.folderOpen : I.folder}
          </span>
          <span className="sb-tree-name is-dir">{node.name}</span>
          <span className="sb-sr-group-count">{count}</span>
        </button>,
      ];
      if (open) {
        node.children?.forEach((c) => {
          out.push(...renderNode(c, depth + 1));
        });
      }
      return out;
    }

    // file
    const hits = byPath.get(node.path) ?? [];
    const open = !collapsed.has(node.path);
    const out: React.ReactNode[] = [
      <button
        key={`file:${node.path}`}
        className="sb-tree-row"
        style={{ paddingLeft: 4 + depth * 6 }}
        onClick={() => onToggle(node.path)}
        title={node.path}
      >
        <span className={cn("sb-group-chev", open && "is-open")}>
          {I.chevron}
        </span>
        <span className="tree-icon tree-icon-file">{I.fileSmall}</span>
        <span className="sb-tree-name">{node.name}</span>
        <span className="sb-sr-group-count">{hits.length}</span>
      </button>,
    ];
    if (open) {
      hits.forEach((h, i) => {
        out.push(
          <HitRow
            key={`hit:${node.path}:${h.lineNumber}:${i}`}
            hit={h}
            query={query}
            caseSensitive={caseSensitive}
            regex={regex}
            onJump={onJump}
            depth={depth + 1}
          />,
        );
      });
    }
    return out;
  }

  return <>{tree.children?.flatMap((c) => renderNode(c, 0))}</>;
}

// ---------- shared bits ----------

function HitRow({
  hit,
  query,
  caseSensitive,
  regex,
  onJump,
  depth,
}: {
  hit: SearchResult;
  query: string;
  caseSensitive: boolean;
  regex: boolean;
  onJump: (hit: SearchResult) => void;
  depth?: number;
}) {
  const padLeft = depth != null ? 4 + depth * 6 : undefined;
  return (
    <button
      className="sb-sr-hit"
      onClick={() => onJump(hit)}
      style={padLeft != null ? { paddingLeft: padLeft } : undefined}
      title={`Line ${hit.lineNumber}`}
    >
      <span className="sb-sr-line-num mono dim">{hit.lineNumber}</span>
      <span className="sb-sr-line-text mono">
        {renderHitLine(hit.lineText, query, caseSensitive, regex)}
      </span>
    </button>
  );
}

function ScopeBtn({
  current,
  value,
  onClick,
  label,
  disabled,
}: {
  current: SearchScope;
  value: SearchScope;
  onClick: (v: SearchScope) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(value)}
      className={cn(
        "sb-search-scope-btn",
        current === value && "is-active",
        disabled && "is-disabled",
      )}
      title={`Scope: ${label}`}
    >
      {label}
    </button>
  );
}

function groupByFile(results: SearchResult[]): FileGroup[] {
  const map = new Map<string, SearchResult[]>();
  for (const r of results) {
    const list = map.get(r.filePath) ?? [];
    list.push(r);
    map.set(r.filePath, list);
  }
  return [...map.entries()].map(([filePath, items]) => ({ filePath, items }));
}

function renderHitLine(
  line: string,
  match: string,
  cs: boolean,
  isRegex: boolean,
) {
  if (!match) return <span>{line}</span>;
  try {
    const pattern = isRegex
      ? match
      : match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${pattern})`, cs ? "g" : "gi");
    const parts = line.split(re);
    return parts.map((p, i) => {
      const isMatch = i % 2 === 1;
      return isMatch ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>;
    });
  } catch {
    return <span>{line}</span>;
  }
}

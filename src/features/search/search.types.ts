export type SearchScope = "all" | "changed" | "current";

export type SearchRequest = {
  repoPath: string;
  query: string;
  scope: SearchScope;
  caseSensitive: boolean;
  regex: boolean;
  /** Restrict to these paths (used by "changed" and "current" scopes). */
  paths?: string[];
  /** VS Code-style comma-separated glob list, e.g. "*.ts, src/**". */
  include?: string;
  /** VS Code-style comma-separated glob list, e.g. "**\/node_modules, dist". */
  exclude?: string;
};

export type SearchResult = {
  filePath: string;
  lineNumber: number;
  lineText: string;
  matchStart?: number;
  matchEnd?: number;
};

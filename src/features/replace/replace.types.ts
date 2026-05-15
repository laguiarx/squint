import type { SearchScope } from "@/features/search/search.types";

export type ReplaceScope = SearchScope;

export type ReplaceRequest = {
  repoPath: string;
  find: string;
  replace: string;
  scope: ReplaceScope;
  caseSensitive: boolean;
  regex: boolean;
  paths?: string[];
};

export type ReplaceOccurrence = {
  id: string;
  lineNumber: number;
  originalLine: string;
  replacedLine: string;
  selected: boolean;
};

export type ReplacePreview = {
  filePath: string;
  occurrences: ReplaceOccurrence[];
};

export type ApplyReplacement = {
  filePath: string;
  /** Occurrence ids selected by the user, scoped per file. */
  occurrenceIds: string[];
};

export type ApplyReplaceRequest = {
  repoPath: string;
  find: string;
  replace: string;
  caseSensitive: boolean;
  regex: boolean;
  selections: ApplyReplacement[];
};

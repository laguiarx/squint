export type ChangedFileStatus =
  | "modified"
  | "added"
  | "deleted"
  | "renamed"
  | "untracked";

export type ChangedFile = {
  path: string;
  oldPath?: string | null;
  status: ChangedFileStatus;
  additions: number;
  deletions: number;
  staged: boolean;
  reviewed: boolean;
};

export type DiffLineKind = "ctx" | "add" | "del";

export type DiffLine = {
  t: DiffLineKind;
  n_old: number | null;
  n_new: number | null;
  text: string;
};

export type Hunk = {
  header: string;
  oldStart: number;
  newStart: number;
  lines: DiffLine[];
};

export type BranchInfo = {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  upstream: string | null;
  /** Local branch whose upstream has been deleted on the remote
   *  (`for-each-ref ... %(upstream:track)` reports `[gone]`). */
  gone: boolean;
};

export type BranchSyncSkipped = {
  branch: string;
  reason: string;
};

export type BranchSyncResult = {
  updated: string[];
  upToDate: number;
  skipped: BranchSyncSkipped[];
};

export type ExternalEditor = {
  id: string;
  name: string;
};

export type DiffResult = {
  filePath: string;
  oldContent: string;
  newContent: string;
  diffText: string;
  isBinary: boolean;
};

export type BinaryPreview = {
  mime: string;
  oldDataUrl: string | null;
  newDataUrl: string | null;
  oldSize: number | null;
  newSize: number | null;
};

export type StashEntry = {
  /** `stash@{0}` style reference, used by pop/apply/drop. */
  ref: string;
  /** Branch the stash was created on (best-effort parse). */
  branch: string | null;
  /** User-visible message (without the "On {branch}: " prefix). */
  message: string;
  /** Unix timestamp (seconds). */
  timestamp: number;
};

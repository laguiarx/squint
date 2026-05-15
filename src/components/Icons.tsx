import type { ReactElement } from "react";

export type IconName =
  | "refresh"
  | "search"
  | "replace"
  | "sparkles"
  | "branch"
  | "folder"
  | "check"
  | "x"
  | "ext"
  | "chevron"
  | "file"
  | "theme"
  | "stage"
  | "review"
  | "edit"
  | "copy"
  | "retry"
  | "discard"
  | "gear"
  | "folderOpen"
  | "fileSmall"
  | "undo"
  | "plus"
  | "minus"
  | "viewList"
  | "viewTree"
  | "sidebarLeft"
  | "sidebarRight"
  | "code"
  | "ellipsis"
  | "keyboard"
  | "splitView"
  | "inlineView";

export const I: Record<IconName, ReactElement> = {
  refresh: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path
        d="M3 8a5 5 0 0 1 8.5-3.5L13 6M13 8a5 5 0 0 1-8.5 3.5L3 10M13 3v3h-3M3 13v-3h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  replace: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path
        d="M2 4h7M2 4l2-2M2 4l2 2M14 12H7M14 12l-2-2M14 12l-2 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  sparkles: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path
        d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M12 4l-2 2M4 12l2-2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  branch: (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <circle cx="4" cy="3.5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4" cy="12.5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="6" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 5v6M4 8c0-2 2-2 4-2h.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <path
        d="M2 4.5A1.5 1.5 0 0 1 3.5 3h2.7l1 1.2H12.5A1.5 1.5 0 0 1 14 5.7v6.8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <path
        d="m3.5 8 3 3 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  ext: (
    <svg viewBox="0 0 16 16" width="11" height="11">
      <path
        d="M9 3h4v4M13 3 7 9M7 4H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 16 16" width="10" height="10">
      <path
        d="m4 6 4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 16 16" width="13" height="13">
      <path
        d="M4 2.5A1.5 1.5 0 0 1 5.5 1h4l3.5 3.5v8A1.5 1.5 0 0 1 11.5 14h-6A1.5 1.5 0 0 1 4 12.5v-10Z M9.5 1v3.5H13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  ),
  theme: (
    <svg viewBox="0 0 16 16" width="13" height="13">
      <path
        d="M8 2a6 6 0 1 0 6 6c-3.3 0-6-2.7-6-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  stage: (
    <svg viewBox="0 0 16 16" width="13" height="13">
      <path
        d="M2 8h12M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  review: (
    <svg viewBox="0 0 16 16" width="13" height="13">
      <path
        d="m3.5 8 3 3 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 16 16" width="13" height="13">
      <path
        d="M2 14h12M3.5 11.5l8-8 1.5 1.5-8 8H3.5v-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <rect x="5" y="5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M2 11V3.5A1.5 1.5 0 0 1 3.5 2H11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  ),
  retry: (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <path
        d="M3 8a5 5 0 0 1 8.5-3.5L13 6M13 8a5 5 0 0 1-8.5 3.5L3 10M13 3v3h-3M3 13v-3h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  discard: (
    <svg viewBox="0 0 16 16" width="13" height="13">
      <path
        d="M3 5h10M6 5V3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5V5M5 5l.5 8a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1l.5-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path
        d="M2.5 4h8M2.5 8h3M2.5 12h6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="4"
        r="1.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle
        cx="8"
        cy="8"
        r="1.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle
        cx="11"
        cy="12"
        r="1.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  ),
  folderOpen: (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <path
        d="M2 5a1 1 0 0 1 1-1h2.7l1 1.2H12a1 1 0 0 1 1 1v.8H3l-1 5.5A1 1 0 0 0 3 13h10l1-5.4a1 1 0 0 0-1-1.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  fileSmall: (
    <svg viewBox="0 0 16 16" width="11" height="11">
      <path
        d="M4 2.5A1.5 1.5 0 0 1 5.5 1h4l3.5 3.5v8A1.5 1.5 0 0 1 11.5 14h-6A1.5 1.5 0 0 1 4 12.5v-10Z M9.5 1v3.5H13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 16 16" width="13" height="13">
      <path
        d="M3 8a5 5 0 0 1 9 -3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M3 3v3h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <path
        d="M8 3.5v9M3.5 8h9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  minus: (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <path
        d="M3.5 8h9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  viewList: (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <path
        d="M3 4h10M3 8h10M3 12h10"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  viewTree: (
    <svg viewBox="0 0 16 16" width="12" height="12">
      <path
        d="M3 4h6M6 8h6M9 12h4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  sidebarLeft: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <rect
        x="2.5"
        y="3"
        width="11"
        height="10"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M6 3v10" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M3.6 6h1.2M3.6 8h1.2M3.6 10h1.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  ),
  sidebarRight: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <rect
        x="2.5"
        y="3"
        width="11"
        height="10"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M10 3v10" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M11.2 6h1.2M11.2 8h1.2M11.2 10h1.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <path
        d="M5.5 4 L2 8 L5.5 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 4 L14 8 L10.5 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ellipsis: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <circle cx="3.5" cy="8" r="1.1" fill="currentColor" />
      <circle cx="8" cy="8" r="1.1" fill="currentColor" />
      <circle cx="12.5" cy="8" r="1.1" fill="currentColor" />
    </svg>
  ),
  keyboard: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <rect
        x="1.5"
        y="4"
        width="13"
        height="8"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="4" cy="7" r="0.65" fill="currentColor" />
      <circle cx="6.5" cy="7" r="0.65" fill="currentColor" />
      <circle cx="9" cy="7" r="0.65" fill="currentColor" />
      <circle cx="11.5" cy="7" r="0.65" fill="currentColor" />
      <rect x="4.5" y="9.4" width="7" height="1.2" rx="0.4" fill="currentColor" />
    </svg>
  ),
  splitView: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <rect
        x="2"
        y="3"
        width="12"
        height="10"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="8"
        y1="3"
        x2="8"
        y2="13"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  ),
  inlineView: (
    <svg viewBox="0 0 16 16" width="14" height="14">
      <rect
        x="2"
        y="3"
        width="12"
        height="10"
        rx="1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="2"
        y1="6.5"
        x2="14"
        y2="6.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="2"
        y1="9.5"
        x2="14"
        y2="9.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  ),
};

import type { ChangedFile } from "@/features/git/git.types";

export const STATUS_META: Record<
  ChangedFile["status"],
  { letter: string; label: string; color: string }
> = {
  modified: { letter: "M", label: "Modified", color: "var(--git-mod)" },
  added: { letter: "A", label: "Added", color: "var(--git-add)" },
  deleted: { letter: "D", label: "Deleted", color: "var(--git-del)" },
  renamed: { letter: "R", label: "Renamed", color: "var(--git-ren)" },
  untracked: { letter: "U", label: "Untracked", color: "var(--git-unt)" },
};

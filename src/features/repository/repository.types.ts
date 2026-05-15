export type Repository = {
  path: string;
  name: string;
  currentBranch: string;
  ahead: number;
  behind: number;
  remote: string | null;
  lastCommit: string | null;
};

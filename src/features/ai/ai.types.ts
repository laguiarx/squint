export type AiKind = "commit" | "pr" | "summary" | "risk";

export type AiCliInfo = {
  id: string;
  name: string;
  available: boolean;
  version: string;
};

/** Output produced by a real CLI invocation. */
export type AiResult = {
  cliId: string;
  cliName: string;
  /** Free-form text returned by the CLI (typically Markdown). */
  text: string;
};

export type AiLineKind =
  | "subject"
  | "blank"
  | "body"
  | "footer"
  | "h1"
  | "h2"
  | "li";

export type AiLine = { kind: AiLineKind; text: string };

export type AiRisk = {
  severity: "low" | "med" | "high";
  file: string;
  note: string;
};

export type AiOutput =
  | {
      kind: "lines";
      title: string;
      subtitle: string;
      model: string;
      output: AiLine[];
    }
  | {
      kind: "risks";
      title: string;
      subtitle: string;
      model: string;
      output: AiRisk[];
    };

export type AiReviewService = {
  summarizeDiff(diff: string): Promise<string>;
  generateCommitMessage(diff: string): Promise<string>;
  generatePullRequestDescription(diff: string): Promise<string>;
  reviewRisk(diff: string): Promise<string[]>;
};

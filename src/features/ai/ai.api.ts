import { invoke } from "@/lib/tauri";
import type { AiCliInfo } from "./ai.types";

export type Integration = {
  id: string;
  name: string;
  purpose: string;
  installHint: string;
  available: boolean;
};

export async function detectIntegrations(): Promise<Integration[]> {
  return invoke<Integration[]>("detect_integrations");
}

export async function detectAiClis(): Promise<AiCliInfo[]> {
  return invoke<AiCliInfo[]>("detect_ai_clis");
}

export async function runAiCli(
  cliId: string,
  prompt: string,
  repoPath: string,
): Promise<string> {
  return invoke<string>("run_ai_cli", { cliId, prompt, repoPath });
}

export type DiffScope = "staged" | "working" | "branch";

export async function getDiffForAi(
  repoPath: string,
  scope: DiffScope,
): Promise<string> {
  return invoke<string>("git_diff_for_ai", { repoPath, scope });
}

export async function getLogForAi(
  repoPath: string,
  scope: DiffScope,
): Promise<string> {
  return invoke<string>("git_log_for_ai", { repoPath, scope });
}

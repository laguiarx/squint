import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@/lib/tauri";
import type { Repository } from "./repository.types";

export async function pickRepositoryFolder(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: "Select a Git repository",
  });
  if (!selected || Array.isArray(selected)) return null;
  return selected as string;
}

export async function openRepository(path: string): Promise<Repository> {
  return invoke<Repository>("open_repository", { path });
}

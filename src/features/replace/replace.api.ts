import { invoke } from "@/lib/tauri";
import type {
  ApplyReplaceRequest,
  ReplacePreview,
  ReplaceRequest,
} from "./replace.types";

export async function previewReplace(
  request: ReplaceRequest,
): Promise<ReplacePreview[]> {
  return invoke<ReplacePreview[]>("replace_preview", { request });
}

export async function applyReplace(
  request: ApplyReplaceRequest,
): Promise<number> {
  return invoke<number>("replace_apply", { request });
}

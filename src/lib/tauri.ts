import { invoke as tauriInvoke } from "@tauri-apps/api/core";

export async function invoke<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  try {
    return await tauriInvoke<T>(cmd, args);
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error(typeof err === "string" ? err : JSON.stringify(err));
  }
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

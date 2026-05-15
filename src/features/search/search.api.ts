import { invoke } from "@/lib/tauri";
import type { SearchRequest, SearchResult } from "./search.types";

export async function searchRepo(
  request: SearchRequest,
): Promise<SearchResult[]> {
  return invoke<SearchResult[]>("search_repo", { request });
}

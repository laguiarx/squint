use globset::{Glob, GlobSet, GlobSetBuilder};
use ignore::WalkBuilder;
use regex::{Regex, RegexBuilder};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

use crate::commands::resolve_repo;
use crate::error::{AppError, AppResult};

const MAX_RESULTS: usize = 5000;
const MAX_FILE_BYTES: u64 = 2 * 1024 * 1024; // 2 MiB

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchRequest {
    pub repo_path: String,
    pub query: String,
    pub scope: String,
    pub case_sensitive: bool,
    pub regex: bool,
    pub paths: Option<Vec<String>>,
    /// VS Code-style comma-separated glob list, e.g. "*.ts, src/**".
    pub include: Option<String>,
    /// VS Code-style comma-separated glob list, e.g. "**/node_modules, dist".
    pub exclude: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub file_path: String,
    pub line_number: u32,
    pub line_text: String,
    pub match_start: Option<u32>,
    pub match_end: Option<u32>,
}

#[tauri::command]
pub fn search_repo(request: SearchRequest) -> AppResult<Vec<SearchResult>> {
    if request.query.is_empty() {
        return Ok(Vec::new());
    }
    let repo = resolve_repo(&request.repo_path)?;
    let regex = build_regex(&request.query, request.case_sensitive, request.regex)?;
    let include = build_glob_set(request.include.as_deref())?;
    let exclude = build_glob_set(request.exclude.as_deref())?;
    let targets = collect_targets(&repo, &request)?;

    let mut results: Vec<SearchResult> = Vec::new();
    for path in targets {
        if results.len() >= MAX_RESULTS {
            break;
        }
        let rel_path = relative(&repo, &path);
        if let Some(set) = &include {
            if !set.is_match(&rel_path) {
                continue;
            }
        }
        if let Some(set) = &exclude {
            if set.is_match(&rel_path) {
                continue;
            }
        }
        let metadata = match std::fs::metadata(&path) {
            Ok(m) => m,
            Err(_) => continue,
        };
        if !metadata.is_file() || metadata.len() > MAX_FILE_BYTES {
            continue;
        }
        let bytes = match std::fs::read(&path) {
            Ok(b) => b,
            Err(_) => continue,
        };
        if looks_binary(&bytes) {
            continue;
        }
        let content = match String::from_utf8(bytes) {
            Ok(s) => s,
            Err(_) => continue,
        };
        for (idx, line) in content.lines().enumerate() {
            if let Some(m) = regex.find(line) {
                results.push(SearchResult {
                    file_path: rel_path.clone(),
                    line_number: (idx as u32) + 1,
                    line_text: line.to_string(),
                    match_start: Some(m.start() as u32),
                    match_end: Some(m.end() as u32),
                });
                if results.len() >= MAX_RESULTS {
                    break;
                }
            }
        }
    }
    Ok(results)
}

pub(crate) fn build_regex(
    query: &str,
    case_sensitive: bool,
    is_regex: bool,
) -> AppResult<Regex> {
    let pattern = if is_regex {
        query.to_string()
    } else {
        regex::escape(query)
    };
    // Hard limits on compiled regex size: defends against a pathological
    // pattern blowing memory. Rust's `regex` is linear-time so we don't
    // need to worry about catastrophic backtracking, only RAM.
    const TEN_MB: usize = 10 * 1024 * 1024;
    let regex = RegexBuilder::new(&pattern)
        .case_insensitive(!case_sensitive)
        .size_limit(TEN_MB)
        .dfa_size_limit(TEN_MB)
        .build()
        .map_err(AppError::Regex)?;
    Ok(regex)
}

pub(crate) fn collect_targets(
    repo: &Path,
    request: &SearchRequest,
) -> AppResult<Vec<PathBuf>> {
    if request.scope != "all" {
        if let Some(paths) = &request.paths {
            let mut out: Vec<PathBuf> = Vec::with_capacity(paths.len());
            for rel in paths {
                let full = repo.join(rel);
                if full.is_file() {
                    out.push(full);
                }
            }
            return Ok(out);
        }
    }
    let mut out = Vec::new();
    let walker = WalkBuilder::new(repo)
        .hidden(false)
        .git_ignore(true)
        .git_global(true)
        .git_exclude(true)
        .build();
    for entry in walker.flatten() {
        if entry.file_type().is_some_and(|ft| ft.is_file()) {
            // Skip .git directory entries explicitly.
            if entry
                .path()
                .components()
                .any(|c| c.as_os_str() == ".git")
            {
                continue;
            }
            out.push(entry.into_path());
        }
    }
    Ok(out)
}

pub(crate) fn looks_binary(bytes: &[u8]) -> bool {
    let sample = &bytes[..bytes.len().min(8192)];
    sample.contains(&0u8)
}

pub(crate) fn relative(repo: &Path, full: &Path) -> String {
    full.strip_prefix(repo)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| full.to_string_lossy().to_string())
}

/// Build a GlobSet from a VS Code-style comma-separated list of patterns.
/// Returns Ok(None) when the input is empty/whitespace.
///
/// Patterns mirror VS Code's "files to include/exclude" semantics:
///   - bare names like `node_modules` match the dir anywhere
///   - leading `*.ext` matches any file with that extension
///   - patterns containing `/` are treated as relative globs
fn build_glob_set(raw: Option<&str>) -> AppResult<Option<GlobSet>> {
    let Some(s) = raw else { return Ok(None) };
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }
    let mut builder = GlobSetBuilder::new();
    let mut any = false;
    for piece in trimmed.split(',') {
        let pat = piece.trim();
        if pat.is_empty() {
            continue;
        }
        for expanded in expand_glob_pattern(pat) {
            let glob = Glob::new(&expanded).map_err(|e| AppError::msg(e.to_string()))?;
            builder.add(glob);
            any = true;
        }
    }
    if !any {
        return Ok(None);
    }
    let set = builder.build().map_err(|e| AppError::msg(e.to_string()))?;
    Ok(Some(set))
}

fn expand_glob_pattern(pat: &str) -> Vec<String> {
    // Already an absolute-style glob — use as-is plus a `**/` variant so
    // `src/**` works regardless of whether the matcher anchors at the root.
    if pat.contains('/') {
        let stripped = pat.trim_start_matches("./");
        let mut out = vec![stripped.to_string()];
        if !stripped.starts_with("**/") {
            out.push(format!("**/{stripped}"));
        }
        return out;
    }
    // Bare token — match as file anywhere AND as a directory anywhere.
    vec![format!("**/{pat}"), format!("**/{pat}/**")]
}

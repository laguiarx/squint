use std::process::{Command, Stdio};

use crate::commands::{resolve_repo, run_git_string};
use crate::error::{AppError, AppResult};

/// One AI CLI we know how to drive. `available = true` when the CLI binary
/// is on PATH (detected via `which`).
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiCliInfo {
    pub id: String,
    pub name: String,
    pub available: bool,
    /// Best-effort version string. Empty when the CLI isn't installed.
    pub version: String,
}

/// Probe PATH for each supported CLI and return an ordered list.
#[tauri::command]
pub fn detect_ai_clis() -> AppResult<Vec<AiCliInfo>> {
    let candidates: &[(&str, &str, &str)] = &[
        ("claude", "Claude Code", "--version"),
        ("codex", "Codex", "--version"),
    ];
    let mut out = Vec::with_capacity(candidates.len());
    for (id, name, version_arg) in candidates {
        let available = which(id);
        let version = if available {
            Command::new(id)
                .arg(version_arg)
                .output()
                .ok()
                .and_then(|o| String::from_utf8(o.stdout).ok())
                .map(|s| s.trim().to_string())
                .unwrap_or_default()
        } else {
            String::new()
        };
        out.push(AiCliInfo {
            id: id.to_string(),
            name: name.to_string(),
            available,
            version,
        });
    }
    Ok(out)
}

/// Run an AI CLI against the repo with the given prompt and return its
/// stdout. The CLI inherits no terminal — anything written to stderr is
/// surfaced as an error if the exit code is non-zero, otherwise discarded.
///
/// **Async + spawn_blocking on purpose.** AI CLIs (claude, codex) can take
/// 10+ seconds and `Command::output()` is a synchronous blocking call. A
/// plain `pub fn` Tauri command runs on the Tauri runtime thread, so the
/// whole IPC channel would stall until the CLI returned — making the rest
/// of the app feel frozen. By marking the command `async` and offloading
/// the blocking spawn/wait to tokio's blocking thread pool, other IPC
/// calls (git status, file reads, settings writes) keep flowing while the
/// AI is thinking.
#[tauri::command]
pub async fn run_ai_cli(
    cli_id: String,
    prompt: String,
    repo_path: String,
) -> AppResult<String> {
    let repo = resolve_repo(&repo_path)?;
    let (program, args) = build_cli_invocation(&cli_id, &prompt)?;
    let program = program.to_string();
    let cli_id_for_err = cli_id.clone();

    let output = tokio::task::spawn_blocking(move || {
        Command::new(program)
            .current_dir(&repo)
            .args(&args)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
    })
    .await
    .map_err(|e| AppError::msg(format!("ai task panicked: {e}")))?
    .map_err(|e| AppError::msg(format!("failed to spawn {cli_id_for_err}: {e}")))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(AppError::msg(if stderr.is_empty() {
            format!("{cli_id} exited with {}", output.status)
        } else {
            stderr
        }));
    }
    let stdout = String::from_utf8(output.stdout)?;
    Ok(stdout)
}

fn build_cli_invocation(
    cli_id: &str,
    prompt: &str,
) -> AppResult<(&'static str, Vec<String>)> {
    match cli_id {
        "claude" => Ok(("claude", vec!["-p".into(), prompt.to_string()])),
        "codex" => Ok(("codex", vec!["exec".into(), prompt.to_string()])),
        other => Err(AppError::msg(format!("Unsupported AI CLI: {other}"))),
    }
}

/// One of the optional integrations Review Desk knows about. Reported by
/// `detect_integrations` so the onboarding modal can render a tidy checklist.
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Integration {
    pub id: String,
    pub name: String,
    pub purpose: String,
    pub install_hint: String,
    pub available: bool,
}

#[tauri::command]
pub fn detect_integrations() -> AppResult<Vec<Integration>> {
    let rows: &[(&str, &str, &str, &str)] = &[
        ("git", "Git", "Required — diff, stage, commit, branch", "brew install git"),
        (
            "gh",
            "GitHub CLI",
            "Open PRs and pull repository metadata",
            "brew install gh",
        ),
        (
            "claude",
            "Claude Code",
            "Powers the AI Assist actions",
            "brew install claude",
        ),
        (
            "codex",
            "Codex CLI",
            "Alternative backend for AI Assist",
            "npm install -g @openai/codex",
        ),
        (
            "brew",
            "Homebrew",
            "Convenient way to install the other tools",
            "Install from https://brew.sh",
        ),
    ];
    Ok(rows
        .iter()
        .map(|(id, name, purpose, hint)| Integration {
            id: id.to_string(),
            name: name.to_string(),
            purpose: purpose.to_string(),
            install_hint: hint.to_string(),
            available: which(id),
        })
        .collect())
}

/// Best-effort `which` — checks each PATH entry for an executable file.
fn which(binary: &str) -> bool {
    let Some(path) = std::env::var_os("PATH") else {
        return false;
    };
    for dir in std::env::split_paths(&path) {
        let candidate = dir.join(binary);
        if candidate.is_file() {
            return true;
        }
    }
    false
}

/// Return a chunk of unified diff useful to feed an AI prompt.
///
/// - `staged`  → `git diff --cached`
/// - `working` → `git diff HEAD` (staged + unstaged)
/// - `branch`  → diff vs the upstream / origin/HEAD (best-effort)
#[tauri::command]
pub fn git_diff_for_ai(repo_path: String, scope: String) -> AppResult<String> {
    let repo = resolve_repo(&repo_path)?;
    match scope.as_str() {
        "staged" => {
            // If nothing is staged, fall back to the whole working diff so
            // the AI still has something to summarize.
            let staged = run_git_string(&repo, &["diff", "--cached"])?;
            if staged.trim().is_empty() {
                run_git_string(&repo, &["diff", "HEAD"])
            } else {
                Ok(staged)
            }
        }
        "working" => run_git_string(&repo, &["diff", "HEAD"]),
        "branch" => {
            // Prefer the configured upstream; otherwise diff against the
            // default branch on `origin` (origin/HEAD), and finally fall
            // back to whatever HEAD currently differs from.
            if let Ok(diff) = run_git_string(&repo, &["diff", "@{u}...HEAD"]) {
                if !diff.trim().is_empty() {
                    return Ok(diff);
                }
            }
            if let Ok(diff) =
                run_git_string(&repo, &["diff", "origin/HEAD...HEAD"])
            {
                if !diff.trim().is_empty() {
                    return Ok(diff);
                }
            }
            run_git_string(&repo, &["diff", "HEAD"])
        }
        other => Err(AppError::msg(format!("Unknown diff scope: {other}"))),
    }
}

/// Return the recent commit list scoped like `git_diff_for_ai` — used to
/// build a PR-description prompt.
#[tauri::command]
pub fn git_log_for_ai(repo_path: String, scope: String) -> AppResult<String> {
    let repo = resolve_repo(&repo_path)?;
    let range = match scope.as_str() {
        "branch" => "@{u}..HEAD",
        _ => "HEAD~10..HEAD",
    };
    let fmt = "--format=%h %s";
    // Try the requested range first; if it fails (no upstream, shallow
    // clone, etc.) fall back to "last 10 commits".
    if let Ok(log) = run_git_string(&repo, &["log", fmt, range]) {
        if !log.trim().is_empty() {
            return Ok(log);
        }
    }
    run_git_string(&repo, &["log", fmt, "HEAD~10..HEAD"])
        .or_else(|_| run_git_string(&repo, &["log", fmt]))
}

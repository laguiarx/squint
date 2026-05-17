# Squint

Squint is a desktop Git client built for reviewing, editing, staging, and
shipping code changes quickly. It is intentionally focused: open a repository,
inspect the diff, stage exactly what should ship, write the commit, and create a
pull request without leaving the app.

<p align="center">
  <img width="1799" height="1128" alt="Squint reviewing a repository diff" src="https://github.com/user-attachments/assets/fc8d4518-3288-4719-982b-5c33df3ef4c5" />
</p>

## Highlights

- **Focused diff review** with side-by-side, inline, and full-file views.
- **Hunk-level actions** for staging, reverting, and committing individual
  changes.
- **Commit workflow** with staged-file awareness, commit-and-push, and AI
  commit-message generation.
- **Pull request flow** that can branch, commit, push, generate PR copy, and
  open the PR through GitHub CLI.
- **Branch tools** for switching, pruning gone branches, syncing branches, and
  seeing ahead/behind state.
- **Integrated terminal** that opens at the repository root and supports
  clickable terminal links.
- **Search and replace** across the repository with preview before writing.
- **Ignored config file access** for local files such as `.env` without listing
  generated folders like `node_modules`, `dist`, or `target`.
- **Auto-update support** through Tauri updater artifacts on GitHub Releases.

## Tech Stack

- [Tauri 2](https://tauri.app) for the native shell and Rust commands.
- [React 19](https://react.dev), TypeScript, and [Vite](https://vite.dev) for
  the UI.
- [Zustand](https://zustand-demo.pmnd.rs) for app state.
- `git`, `gh`, Codex CLI, and Claude Code integrations through local CLIs.
- `portable-pty` and xterm.js for the integrated terminal.

## Requirements

- macOS for the primary desktop experience.
- [Bun](https://bun.com) 1.3 or newer.
- Rust toolchain from [rustup](https://rustup.rs).
- Xcode Command Line Tools.
- `git` in `PATH`.
- Optional: GitHub CLI `gh` for pull-request creation.
- Optional: Codex CLI or Claude Code for AI-assisted actions.

## Development

Install dependencies and start the desktop app:

```sh
bun install
bun run tauri:dev
```

The default dev command disables Tauri's Rust file watcher so Squint can review
or merge changes in its own repository without restarting itself.

When actively changing Rust/Tauri code and you want backend rebuilds on file
changes, run:

```sh
bun run tauri:dev:watch
```

Build the app locally:

```sh
bun run tauri:build
```

## Release

Release builds are created by GitHub Actions from `v*` tags. The workflow builds
macOS, Windows, and Linux bundles and creates a draft GitHub Release with
updater artifacts.

The short version:

```sh
# update versions first
git tag v0.2.4
git push origin v0.2.4
```

Then open the generated draft release, confirm that `latest.json`, `.sig`, and
platform installers are attached, and publish it.

See [docs/releasing.md](docs/releasing.md) for the full release checklist and
updater signing setup.

## Useful Scripts

```sh
bun run build        # TypeScript + Vite build
bun run preview      # Preview the frontend bundle
bun run tauri:dev    # Run Tauri without Rust file watching
bun run tauri:build  # Build desktop bundles
```

## Project Layout

```text
src/
  app/             App shell, keyboard shortcuts, native menu bridge
  components/      Top bar, sidebar, diff pane, dialogs, terminal, menus
  features/
    ai/            AI CLI detection and prompt execution
    git/           Git IPC client and shared Git types
    repository/    Repository state, settings, and user workflows
    search/        Repository search APIs
  lib/             Tauri bridge, paths, theme, diff parsing, utilities

src-tauri/
  src/
    commands/      Rust commands for git, gh, terminal, AI, search, replace
    lib.rs         Tauri builder and command registration
    menu.rs        Native app menu
```

## Safety

- Destructive discard actions require explicit confirmation.
- Search and replace writes only after preview and user confirmation.
- Git operations shell out to the local `git` binary, so behavior matches the
  user's command line.
- Ignored files are shown narrowly for editable config use cases; generated
  dependency and build trees remain hidden from the Files tab.

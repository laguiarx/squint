import { useEffect, useMemo, useRef, useState } from "react";
import { useRepoStore } from "@/features/repository/repository.store";
import * as replaceApi from "@/features/replace/replace.api";
import type {
  ReplacePreview,
  ReplaceScope,
} from "@/features/replace/replace.types";
import { cn } from "@/lib/utils";
import { I } from "./Icons";
import { Kbd } from "./Kbd";
import { Overlay } from "./Overlay";

export function ReplaceOverlay() {
  const open = useRepoStore((s) => s.replaceOpen);
  const setOpen = useRepoStore((s) => s.setReplaceOpen);
  const repo = useRepoStore((s) => s.repository);
  const files = useRepoStore((s) => s.files);
  const selectedFilePath = useRepoStore((s) => s.selectedFilePath);
  const refresh = useRepoStore((s) => s.refresh);
  const pushToast = useRepoStore((s) => s.pushToast);
  const setError = useRepoStore((s) => s.setError);

  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [scope, setScope] = useState<ReplaceScope>("changed");
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [regex, setRegex] = useState(false);
  const [previewed, setPreviewed] = useState(false);
  const [preview, setPreview] = useState<ReplacePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else {
      setFind("");
      setReplace("");
      setPreview([]);
      setPreviewed(false);
    }
  }, [open]);

  async function runPreview() {
    if (!repo || !find) return;
    setLoading(true);
    try {
      const paths =
        scope === "changed"
          ? files.map((f) => f.path)
          : scope === "current" && selectedFilePath
            ? [selectedFilePath]
            : undefined;
      const out = await replaceApi.previewReplace({
        repoPath: repo.path,
        find,
        replace,
        scope,
        caseSensitive,
        regex,
        paths,
      });
      setPreview(out);
      setPreviewed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function toggleOcc(fileIdx: number, occIdx: number) {
    setPreview((prev) =>
      prev.map((p, i) =>
        i !== fileIdx
          ? p
          : {
              ...p,
              occurrences: p.occurrences.map((o, j) =>
                j === occIdx ? { ...o, selected: !o.selected } : o,
              ),
            },
      ),
    );
  }

  function toggleFile(fileIdx: number) {
    setPreview((prev) =>
      prev.map((p, i) => {
        if (i !== fileIdx) return p;
        const all = p.occurrences.every((o) => o.selected);
        return {
          ...p,
          occurrences: p.occurrences.map((o) => ({ ...o, selected: !all })),
        };
      }),
    );
  }

  const totalSelected = useMemo(
    () =>
      preview.reduce(
        (n, g) => n + g.occurrences.filter((o) => o.selected).length,
        0,
      ),
    [preview],
  );
  const totalOccs = useMemo(
    () => preview.reduce((n, g) => n + g.occurrences.length, 0),
    [preview],
  );

  async function applyNow() {
    if (!repo) return;
    setLoading(true);
    try {
      const selections = preview
        .map((p) => ({
          filePath: p.filePath,
          occurrenceIds: p.occurrences
            .filter((o) => o.selected)
            .map((o) => o.id),
        }))
        .filter((s) => s.occurrenceIds.length > 0);
      const count = await replaceApi.applyReplace({
        repoPath: repo.path,
        find,
        replace,
        caseSensitive,
        regex,
        selections,
      });
      pushToast(
        `Applied ${count} replacement${count === 1 ? "" : "s"}`,
        count === 0 ? "danger" : "info",
      );
      setOpen(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <Overlay onClose={() => setOpen(false)}>
      <div className="overlay-card overlay-replace">
        <div className="overlay-head">
          <span className="overlay-title">Replace</span>
          <Kbd>⌘⇧H</Kbd>
          <span className="flex-spacer" />
          <button className="ghost-btn" onClick={() => setOpen(false)}>
            {I.x}
          </button>
        </div>
        <div className="replace-inputs">
          <div className="replace-input-row">
            <span className="ri-label mono dim">find</span>
            <input
              ref={inputRef}
              className="search-input"
              type="text"
              value={find}
              onChange={(e) => {
                setFind(e.target.value);
                setPreviewed(false);
              }}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              className={cn("flag", caseSensitive && "is-on")}
              onClick={() => setCaseSensitive(!caseSensitive)}
            >
              Aa
            </button>
            <button
              className={cn("flag", regex && "is-on")}
              onClick={() => setRegex(!regex)}
            >
              .*
            </button>
          </div>
          <div className="replace-input-row">
            <span className="ri-label mono dim">repl</span>
            <input
              className="search-input"
              type="text"
              value={replace}
              onChange={(e) => {
                setReplace(e.target.value);
                setPreviewed(false);
              }}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
        <div className="replace-meta">
          <span className="scope-label dim">Scope</span>
          <div className="seg">
            <button
              className={cn("seg-btn", scope === "all" && "is-active")}
              onClick={() => {
                setScope("all");
                setPreviewed(false);
              }}
            >
              All files
            </button>
            <button
              className={cn("seg-btn", scope === "changed" && "is-active")}
              onClick={() => {
                setScope("changed");
                setPreviewed(false);
              }}
            >
              Changed
            </button>
            <button
              className={cn("seg-btn", scope === "current" && "is-active")}
              onClick={() => {
                setScope("current");
                setPreviewed(false);
              }}
              disabled={!selectedFilePath}
            >
              Current
            </button>
          </div>
          <span className="flex-spacer" />
          {previewed ? (
            <span className="dim mono">
              {totalSelected}/{totalOccs} occurrences selected · {preview.length}{" "}
              file{preview.length === 1 ? "" : "s"}
            </span>
          ) : (
            <span className="dim mono">Run preview to see matches</span>
          )}
        </div>

        {previewed ? (
          <div className="replace-preview">
            {preview.length === 0 ? (
              <div className="sr-empty mono dim">No occurrences found.</div>
            ) : null}
            {preview.map((g, fi) => {
              const sel = g.occurrences.filter((o) => o.selected).length;
              const all = sel === g.occurrences.length;
              return (
                <div key={g.filePath} className="rp-file">
                  <div className="rp-file-head">
                    <button
                      className="rp-file-check"
                      onClick={() => toggleFile(fi)}
                    >
                      <span
                        className={cn(
                          "checkbox",
                          all ? "is-on" : sel > 0 ? "is-mixed" : "",
                        )}
                      >
                        {all ? I.check : sel > 0 ? <span className="cb-mix" /> : null}
                      </span>
                    </button>
                    <span className="mono">{g.filePath}</span>
                    <span className="dim mono">
                      · {sel}/{g.occurrences.length}
                    </span>
                  </div>
                  <div className="rp-file-occs">
                    {g.occurrences.map((o, oi) => (
                      <button
                        key={o.id}
                        className={cn("rp-occ", o.selected && "is-on")}
                        onClick={() => toggleOcc(fi, oi)}
                      >
                        <span className={cn("checkbox", o.selected && "is-on")}>
                          {o.selected ? I.check : null}
                        </span>
                        <span className="rp-occ-line mono dim">
                          {o.lineNumber}
                        </span>
                        <div className="rp-occ-diff">
                          <div className="rp-occ-row rp-occ-del mono">
                            <span className="diff-gut-mark">−</span>
                            <span>{o.originalLine}</span>
                          </div>
                          <div className="rp-occ-row rp-occ-add mono">
                            <span className="diff-gut-mark">+</span>
                            <span>{o.replacedLine}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="replace-empty mono dim">
            Press <Kbd>⌥↵</Kbd> or click Preview to see what will change. Nothing
            is written until you apply.
          </div>
        )}

        <div className="overlay-footer">
          <span className="dim mono">
            Replacements are written to disk only when you click Apply.
          </span>
          <span className="flex-spacer" />
          <button className="ghost-btn" onClick={() => setOpen(false)}>
            Cancel
          </button>
          {previewed ? (
            <button
              className="primary-btn"
              disabled={totalSelected === 0 || loading}
              onClick={applyNow}
            >
              Apply {totalSelected} replacement
              {totalSelected === 1 ? "" : "s"}
            </button>
          ) : (
            <button
              className="primary-btn"
              onClick={runPreview}
              disabled={!find || loading}
            >
              {loading ? "Working…" : "Preview"}
              {!loading ? <Kbd>⌥↵</Kbd> : null}
            </button>
          )}
        </div>
      </div>
    </Overlay>
  );
}

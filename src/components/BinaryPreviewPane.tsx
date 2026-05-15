import { useEffect, useState } from "react";
import { getBinaryPreview } from "@/features/git/git.api";
import type { BinaryPreview, ChangedFileStatus } from "@/features/git/git.types";

type Props = {
  repoPath: string;
  filePath: string;
  staged: boolean;
  status: ChangedFileStatus;
};

const IMAGE_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "ico",
  "bmp",
  "avif",
]);

export function isPreviewableImage(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTS.has(ext);
}

function formatBytes(n: number | null): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Renders an image diff for binary files (PNG, JPG, SVG, …). For modified
 * files we show old vs new side by side. For added / deleted / untracked,
 * just the relevant single side.
 */
export function BinaryPreviewPane({
  repoPath,
  filePath,
  staged,
  status,
}: Props) {
  const [preview, setPreview] = useState<BinaryPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isImage = isPreviewableImage(filePath);

  useEffect(() => {
    if (!isImage) return;
    let cancelled = false;
    setPreview(null);
    setError(null);
    getBinaryPreview(repoPath, filePath, staged)
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [repoPath, filePath, staged, isImage]);

  if (!isImage) {
    return (
      <div className="binary-fallback">
        <div className="binary-fallback-title">Binary file</div>
        <div className="binary-fallback-sub">
          No preview available for this format.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="binary-fallback">
        <div className="binary-fallback-title">Couldn't load preview</div>
        <div className="binary-fallback-sub">{error}</div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="binary-fallback">
        <div className="binary-fallback-sub">Loading preview…</div>
      </div>
    );
  }

  // Single-side render for whole-file added / deleted / untracked.
  if (status === "added" || status === "untracked") {
    return (
      <div className="image-diff is-single">
        <ImageSide
          label="Added"
          accent="add"
          url={preview.newDataUrl}
          size={preview.newSize}
          mime={preview.mime}
        />
      </div>
    );
  }
  if (status === "deleted") {
    return (
      <div className="image-diff is-single">
        <ImageSide
          label="Deleted"
          accent="del"
          url={preview.oldDataUrl}
          size={preview.oldSize}
          mime={preview.mime}
        />
      </div>
    );
  }

  // Modified / renamed → side-by-side.
  return (
    <div className="image-diff">
      <ImageSide
        label="Before"
        accent="del"
        url={preview.oldDataUrl}
        size={preview.oldSize}
        mime={preview.mime}
      />
      <ImageSide
        label="After"
        accent="add"
        url={preview.newDataUrl}
        size={preview.newSize}
        mime={preview.mime}
      />
    </div>
  );
}

function ImageSide({
  label,
  accent,
  url,
  size,
  mime,
}: {
  label: string;
  accent: "add" | "del";
  url: string | null;
  size: number | null;
  mime: string;
}) {
  return (
    <div className={`image-side image-side-${accent}`}>
      <div className="image-side-head">
        <span className="image-side-label">{label}</span>
        <span className="image-side-meta">
          {mime} · {formatBytes(size)}
        </span>
      </div>
      <div className="image-side-canvas">
        {url ? (
          <img src={url} alt={label} className="image-side-img" />
        ) : (
          <div className="image-side-empty">—</div>
        )}
      </div>
    </div>
  );
}

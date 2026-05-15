import type { ReactNode } from "react";

const MODIFIERS = new Set(["⌘", "⌥", "⌃", "⇧"]);

/**
 * Split a shortcut string like `"⌘⇧F"` into individual key chips:
 *   - modifier characters (⌘ ⌥ ⌃ ⇧) always become their own chip
 *   - everything else clumps together so multi-letter keys like "esc" or
 *     compound hints like "↑↓" stay in a single chip
 */
export function splitShortcut(input: string): string[] {
  const keys: string[] = [];
  let buf = "";
  for (const ch of input) {
    if (MODIFIERS.has(ch)) {
      if (buf) {
        keys.push(buf);
        buf = "";
      }
      keys.push(ch);
    } else {
      buf += ch;
    }
  }
  if (buf) keys.push(buf);
  return keys;
}

export function Kbd({ children }: { children: ReactNode }) {
  if (typeof children === "string") {
    const keys = splitShortcut(children);
    if (keys.length > 1) {
      return (
        <span className="shortcut">
          {keys.map((k, i) => (
            <span key={i} className="kbd">
              {k}
            </span>
          ))}
        </span>
      );
    }
  }
  return <span className="kbd">{children}</span>;
}

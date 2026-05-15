import { useRepoStore } from "@/features/repository/repository.store";
import { I } from "./Icons";
import { Overlay } from "./Overlay";
import { splitShortcut } from "./Kbd";

type Shortcut = {
  label: string;
  /** Each entry is one chord. Use a space-separated chord array like
   *  `["⌘K", "W"]` for chord sequences (press ⌘K, then W). */
  keys: string[];
};

type Group = {
  title: string;
  shortcuts: Shortcut[];
};

/**
 * Single source of truth for what the user sees as the app's keybindings.
 * If you add a real shortcut in keyboard.ts, mirror it here so the cheatsheet
 * stays accurate. Future work: let the user remap from this same data.
 */
const GROUPS: Group[] = [
  {
    title: "Project",
    shortcuts: [
      { label: "Open repository…", keys: ["⌘O"] },
      { label: "Refresh git status", keys: ["⌘R"] },
      { label: "Preferences", keys: ["⌘,"] },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { label: "Go to file…", keys: ["⌘P"] },
      { label: "Command palette", keys: ["⌘⇧P"] },
      { label: "Next changed file", keys: ["⌥↓"] },
      { label: "Previous changed file", keys: ["⌥↑"] },
    ],
  },
  {
    title: "Tabs",
    shortcuts: [
      { label: "Next tab", keys: ["⌘⌥→"] },
      { label: "Previous tab", keys: ["⌘⌥←"] },
      { label: "Close current tab", keys: ["⌘W"] },
      { label: "Close all tabs", keys: ["⌘K", "W"] },
    ],
  },
  {
    title: "Search",
    shortcuts: [
      { label: "Find in current file", keys: ["⌘F"] },
      { label: "Find in repository", keys: ["⌘⇧F"] },
      { label: "Find & replace", keys: ["⌘⇧H"] },
    ],
  },
  {
    title: "Editing",
    shortcuts: [
      { label: "Edit current file", keys: ["⌘E"] },
      { label: "Save", keys: ["⌘S"] },
    ],
  },
  {
    title: "Git",
    shortcuts: [
      { label: "Stage / unstage current file", keys: ["⌘↵"] },
      { label: "Mark current file reviewed", keys: ["⌘⇧M"] },
      { label: "Discard changes to current file", keys: ["⌘⌫"] },
    ],
  },
  {
    title: "Sidebars",
    shortcuts: [
      { label: "Toggle left sidebar", keys: ["⌘B"] },
      { label: "Toggle right sidebar", keys: ["⌘⌥B"] },
      { label: "Show Changes", keys: ["⌘⌥G"] },
      { label: "Show File tree", keys: ["⌘⇧E"] },
    ],
  },
];

export function ShortcutsDialog() {
  const open = useRepoStore((s) => s.shortcutsOpen);
  const close = useRepoStore((s) => s.setShortcutsOpen);

  if (!open) return null;

  return (
    <Overlay onClose={() => close(false)} centered>
      <div className="shortcuts-card">
        <div className="shortcuts-head">
          <span className="shortcuts-title">Keyboard shortcuts</span>
          <span className="flex-spacer" />
          <button
            className="settings-close"
            onClick={() => close(false)}
            title="Close"
            aria-label="Close shortcuts"
          >
            {I.x}
          </button>
        </div>
        <div className="shortcuts-body">
          {GROUPS.map((g) => (
            <section key={g.title} className="shortcuts-section">
              <div className="shortcuts-section-title">{g.title}</div>
              <div className="shortcuts-list">
                {g.shortcuts.map((s) => (
                  <div key={s.label} className="shortcuts-row">
                    <span className="shortcuts-row-label">{s.label}</span>
                    <span className="shortcuts-row-keys">
                      {s.keys.map((chord, ci) => (
                        <span key={ci} className="shortcuts-chord">
                          {splitShortcut(chord).map((k, ki) => (
                            <span key={ki} className="kbd">
                              {k}
                            </span>
                          ))}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Overlay>
  );
}

export type Theme =
  | "dark"
  | "light"
  | "midnight"
  | "vercel"
  | "supabase"
  | "catppuccin"
  | "tokyo-night";

export const THEME_PRESETS: { id: Theme; label: string; hint: string }[] = [
  { id: "dark", label: "Dark", hint: "Linear-inspired default" },
  { id: "light", label: "Light", hint: "High contrast for daylight" },
  { id: "midnight", label: "Midnight", hint: "Deep blue, purple accent" },
  { id: "vercel", label: "Vercel", hint: "Minimalist black & white" },
  { id: "supabase", label: "Supabase", hint: "Green-accent dark" },
  { id: "catppuccin", label: "Catppuccin Mocha", hint: "Warm pastel" },
  { id: "tokyo-night", label: "Tokyo Night", hint: "Blue-cyan dark" },
];

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

export function applyDensity(density: "compact" | "cozy"): void {
  document.documentElement.setAttribute("data-density", density);
}

// ---- Fonts ----

export type FontPreset = "inter" | "geist" | "system" | "custom";
export type MonoPreset = "jetbrains" | "geist-mono" | "system" | "custom";

const SANS_PRESETS: Record<Exclude<FontPreset, "custom">, string> = {
  inter:
    '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Helvetica Neue", sans-serif',
  geist:
    '"Geist Variable", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  system:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Helvetica Neue", sans-serif',
};

const MONO_PRESETS: Record<Exclude<MonoPreset, "custom">, string> = {
  jetbrains:
    '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  "geist-mono":
    '"Geist Mono Variable", "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
  system: 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
};

/**
 * Apply the user's chosen UI font. `custom` means use whatever they typed
 * (any locally-installed font name) with a system fallback chain so a typo
 * doesn't break the whole UI.
 */
export function applySansFont(preset: FontPreset, custom: string): void {
  const stack =
    preset === "custom"
      ? `"${custom.replace(/"/g, "")}", ${SANS_PRESETS.system}`
      : SANS_PRESETS[preset];
  document.documentElement.style.setProperty("--font-sans", stack);
}

export function applyMonoFont(preset: MonoPreset, custom: string): void {
  const stack =
    preset === "custom"
      ? `"${custom.replace(/"/g, "")}", ${MONO_PRESETS.system}`
      : MONO_PRESETS[preset];
  document.documentElement.style.setProperty("--font-mono", stack);
}

// ---- Custom color overrides ----

/**
 * Variables the user can override from Preferences. Keeping this list small
 * (the high-impact ones) so the editor stays approachable — power users can
 * still set any other CSS variable via the underlying `customColors` map.
 */
export const TWEAKABLE_COLORS = [
  { id: "accent", label: "Accent" },
  { id: "bg-0", label: "Background" },
  { id: "bg-1", label: "Surface" },
  { id: "fg-0", label: "Foreground" },
  { id: "git-add", label: "Added" },
  { id: "git-mod", label: "Modified" },
  { id: "git-del", label: "Deleted" },
] as const;

export type TweakableColor = (typeof TWEAKABLE_COLORS)[number]["id"];

/**
 * Apply (or clear) the user's per-variable color overrides. Pass an empty
 * record to reset — anything not in the record is left to the active theme.
 */
export function applyCustomColors(colors: Record<string, string>): void {
  const root = document.documentElement.style;
  // Clear any previous overrides we set so a missing key falls back to the
  // theme defaults instead of sticking around.
  for (const { id } of TWEAKABLE_COLORS) {
    root.removeProperty(`--${id}`);
  }
  for (const [key, value] of Object.entries(colors)) {
    if (!value) continue;
    root.setProperty(`--${key}`, value);
  }
}

import { I, type IconName } from "./Icons";

export type HunkPrimaryAction = {
  kind: "stage" | "unstage";
  label: string;
  onClick: (hunkIdx: number) => void;
};

export type HunkActions = {
  primary: HunkPrimaryAction;
  revert?: { label: string; onClick: (hunkIdx: number) => void };
};

type Props = {
  hunkIdx: number;
  actions: HunkActions;
};

const PRIMARY_ICON: Record<HunkPrimaryAction["kind"], IconName> = {
  stage: "plus",
  unstage: "minus",
};

export function HunkActionBar({ hunkIdx, actions }: Props) {
  return (
    <div className="hunk-actions">
      {actions.revert ? (
        <button
          className="hunk-action-icon hunk-action-revert"
          onClick={() => actions.revert!.onClick(hunkIdx)}
          title={actions.revert.label}
          type="button"
        >
          {I.undo}
        </button>
      ) : null}
      <button
        className="hunk-action-icon hunk-action-primary"
        onClick={() => actions.primary.onClick(hunkIdx)}
        title={actions.primary.label}
        type="button"
      >
        {I[PRIMARY_ICON[actions.primary.kind]]}
      </button>
    </div>
  );
}

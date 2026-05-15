import { useEffect, useState } from "react";
import { useRepoStore } from "@/features/repository/repository.store";
import { detectIntegrations, type Integration } from "@/features/ai/ai.api";
import { isTauri } from "@/lib/tauri";
import { I } from "./Icons";
import { Kbd } from "./Kbd";
import { Overlay } from "./Overlay";

/**
 * First-run experience. Shows on launch if `settings.firstRunCompleted` is
 * false, and is also reachable from the command palette ("Show welcome
 * tour"). Walks the user through what the app does and what optional CLIs
 * unlock which features.
 */
export function OnboardingModal() {
  const open = useRepoStore((s) => s.onboardingOpen);
  const setOpen = useRepoStore((s) => s.setOnboardingOpen);
  const setFirstRunCompleted = useRepoStore((s) => s.setFirstRunCompleted);
  const openRepositoryPicker = useRepoStore((s) => s.openRepositoryPicker);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [integrations, setIntegrations] = useState<Integration[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    if (!isTauri()) {
      setIntegrations([]);
      return;
    }
    setLoading(true);
    detectIntegrations()
      .then((list) => setIntegrations(list))
      .catch(() => setIntegrations([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const finish = () => {
    setFirstRunCompleted(true);
    setOpen(false);
  };

  return (
    <Overlay onClose={finish} centered>
      <div className="onboarding-card">
        <div className="onboarding-head">
          <span className="onboarding-step mono dim">
            Step {step + 1} of 3
          </span>
          <span className="flex-spacer" />
          <button
            className="settings-close"
            onClick={finish}
            title="Close"
            aria-label="Close"
          >
            {I.x}
          </button>
        </div>

        {step === 0 ? (
          <WelcomeStep onNext={() => setStep(1)} />
        ) : step === 1 ? (
          <IntegrationsStep
            integrations={integrations}
            loading={loading}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            onRefresh={() => {
              setLoading(true);
              detectIntegrations()
                .then((list) => setIntegrations(list))
                .catch(() => setIntegrations([]))
                .finally(() => setLoading(false));
            }}
          />
        ) : (
          <DoneStep
            onBack={() => setStep(1)}
            onPickRepo={async () => {
              setFirstRunCompleted(true);
              setOpen(false);
              await openRepositoryPicker();
            }}
            onFinish={finish}
          />
        )}
      </div>
    </Overlay>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div className="onboarding-body">
        <h2 className="onboarding-title">Welcome to Review Desk</h2>
        <p className="onboarding-lede">
          A focused desktop tool for reviewing code that AI agents (Claude
          Code, Codex, Cursor) just wrote. Not a full IDE — it stays out of
          your way once the review is done.
        </p>
        <div className="onboarding-features">
          <Feature
            title="Read changes fast"
            body="Side-by-side or inline diffs, full-file view with subtle gutter marks on modified lines, hunk-level stage/revert."
          />
          <Feature
            title="Stay in the flow"
            body="⌘P to jump to any file, ⌘F to search in the open file, ⌘⇧F across the repo. ⌘K W to close everything."
          />
          <Feature
            title="AI Assist"
            body="Generate commit messages, PR descriptions, summaries and risk reviews — using your installed Claude or Codex CLI."
          />
        </div>
      </div>
      <div className="onboarding-footer">
        <span className="flex-spacer" />
        <button className="primary-btn" onClick={onNext} type="button">
          Next
        </button>
      </div>
    </>
  );
}

function IntegrationsStep({
  integrations,
  loading,
  onBack,
  onNext,
  onRefresh,
}: {
  integrations: Integration[] | null;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <div className="onboarding-body">
        <h2 className="onboarding-title">Optional integrations</h2>
        <p className="onboarding-lede">
          Review Desk works without any of these. Installing them unlocks
          extra features — none of it sends data anywhere besides the CLI you
          already trust.
        </p>
        <div className="onboarding-integrations">
          {loading && !integrations ? (
            <div className="settings-row-sub mono dim">Detecting…</div>
          ) : (
            (integrations ?? []).map((it) => (
              <div
                key={it.id}
                className={
                  "onboarding-integration" + (it.available ? " is-on" : "")
                }
              >
                <span className="onboarding-integration-status">
                  {it.available ? I.check : I.x}
                </span>
                <div className="onboarding-integration-body">
                  <div className="onboarding-integration-name">{it.name}</div>
                  <div className="onboarding-integration-purpose">
                    {it.purpose}
                  </div>
                  {!it.available ? (
                    <code className="onboarding-integration-hint">
                      {it.installHint}
                    </code>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
        <button
          className="ghost-btn onboarding-rescan"
          onClick={onRefresh}
          type="button"
          disabled={loading}
        >
          {I.retry} Re-scan
        </button>
      </div>
      <div className="onboarding-footer">
        <button className="ghost-btn" onClick={onBack} type="button">
          Back
        </button>
        <span className="flex-spacer" />
        <button className="primary-btn" onClick={onNext} type="button">
          Next
        </button>
      </div>
    </>
  );
}

function DoneStep({
  onBack,
  onPickRepo,
  onFinish,
}: {
  onBack: () => void;
  onPickRepo: () => Promise<void>;
  onFinish: () => void;
}) {
  return (
    <>
      <div className="onboarding-body">
        <h2 className="onboarding-title">You're set</h2>
        <p className="onboarding-lede">
          Open a repository to start reviewing. You can revisit this tour
          anytime from the command palette ("Show welcome tour"), and tweak
          AI / appearance in Preferences (⌘,).
        </p>
        <div className="onboarding-shortcuts">
          <div className="onboarding-shortcut">
            <Kbd>⌘O</Kbd>
            <span>Open repository</span>
          </div>
          <div className="onboarding-shortcut">
            <Kbd>⌘P</Kbd>
            <span>Go to file</span>
          </div>
          <div className="onboarding-shortcut">
            <Kbd>⌘⇧P</Kbd>
            <span>Command palette</span>
          </div>
          <div className="onboarding-shortcut">
            <Kbd>⌘F</Kbd>
            <span>Find in file</span>
          </div>
          <div className="onboarding-shortcut">
            <Kbd>⌘⇧F</Kbd>
            <span>Find in repository</span>
          </div>
          <div className="onboarding-shortcut">
            <Kbd>⌘,</Kbd>
            <span>Preferences</span>
          </div>
        </div>
      </div>
      <div className="onboarding-footer">
        <button className="ghost-btn" onClick={onBack} type="button">
          Back
        </button>
        <span className="flex-spacer" />
        <button className="ghost-btn" onClick={onFinish} type="button">
          Pick later
        </button>
        <button className="primary-btn" onClick={onPickRepo} type="button">
          Open repository…
        </button>
      </div>
    </>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="onboarding-feature">
      <div className="onboarding-feature-title">{title}</div>
      <div className="onboarding-feature-body">{body}</div>
    </div>
  );
}

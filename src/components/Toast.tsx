import { I } from "./Icons";

export type ToastKind = "info" | "danger";

export type ToastMessage = {
  id: string;
  text: string;
  kind: ToastKind;
};

export function Toast({ messages }: { messages: ToastMessage[] }) {
  return (
    <div className="toast-stack">
      {messages.map((m) => (
        <div key={m.id} className={"toast toast-" + (m.kind || "info")}>
          <span className="toast-icon">
            {m.kind === "danger" ? I.x : I.check}
          </span>
          <span>{m.text}</span>
        </div>
      ))}
    </div>
  );
}

import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  onClose: () => void;
  children: ReactNode;
  style?: CSSProperties;
  /** Center the card vertically — for confirm/settings modals. */
  centered?: boolean;
};

export function Overlay({ onClose, children, style, centered }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={cn("overlay-back", centered && "is-centered")}
      style={style}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
};

export function IconBtn({ title, onClick, active, disabled, children }: Props) {
  return (
    <button
      className={cn(
        "icon-btn",
        active && "is-active",
        disabled && "is-disabled",
      )}
      title={title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

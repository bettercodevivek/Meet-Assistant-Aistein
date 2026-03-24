import type { HTMLAttributes } from "react";

type BadgeVariant = "active" | "deactivated";

const variantStyles: Record<BadgeVariant, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  deactivated: "border-slate-200 bg-slate-100 text-slate-600",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant: BadgeVariant;
};

export function Badge({ variant, className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}

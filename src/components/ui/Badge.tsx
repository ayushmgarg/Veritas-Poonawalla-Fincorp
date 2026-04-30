import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "muted";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const VARIANTS = {
  default: "bg-white/5 border-white/10 text-text-secondary",
  success: "bg-[#2ECC40]/10 border-[#2ECC40]/20 text-[#2ECC40]",
  warning: "bg-[#FFB800]/10 border-[#FFB800]/20 text-[#FFB800]",
  danger: "bg-[#FF4136]/10 border-[#FF4136]/20 text-[#FF4136]",
  info: "bg-[#0074D9]/10 border-[#0074D9]/20 text-[#0074D9]",
  muted: "bg-white/[0.03] border-white/[0.06] text-text-muted",
};

const DOT_COLORS = {
  default: "bg-text-secondary",
  success: "bg-[#2ECC40]",
  warning: "bg-[#FFB800]",
  danger: "bg-[#FF4136]",
  info: "bg-[#0074D9]",
  muted: "bg-text-muted",
};

export function Badge({ label, variant = "default", size = "sm", dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        VARIANTS[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", DOT_COLORS[variant])} />
      )}
      {label}
    </span>
  );
}

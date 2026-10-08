import { cn } from "cn";

export function PrismMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="8" fill="#1e50a0" />
      <path d="M16 6.5 26.5 25h-21L16 6.5Z" fill="white" />
      <path d="M16 12.2 22.2 23H9.8L16 12.2Z" fill="#1e50a0" />
    </svg>
  );
}

export function Logo({ withWord = true, size = 32 }: { withWord?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <PrismMark size={size} />
      {withWord ? (
        <span className="text-[1.35rem] leading-none font-semibold tracking-tight text-[#1e50a0]">
          PRISM
        </span>
      ) : null}
    </span>
  );
}

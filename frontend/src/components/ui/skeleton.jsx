import { cn } from "@/lib/utils"

function Skeleton({
  className,
  shimmer = false,
  ...props
}) {
  return (
    <div
      className={cn(
        "rounded-md",
        shimmer ? "skeleton-shimmer" : "animate-pulse bg-primary/10",
        className
      )}
      {...props} />
  );
}

export { Skeleton }

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Renders a number that briefly flashes green/red whenever it changes. */
export function TickValue({
  value,
  format,
  className,
}: {
  value: number;
  format: (v: number) => string;
  className?: string;
}) {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (value === prev.current) return;
    setFlash(value > prev.current ? "up" : "down");
    prev.current = value;
    const id = window.setTimeout(() => setFlash(null), 700);
    return () => window.clearTimeout(id);
  }, [value]);

  return (
    <span
      className={cn(
        "num inline-block rounded px-1",
        flash === "up" && "tick-up",
        flash === "down" && "tick-down",
        className,
      )}
    >
      {format(value)}
    </span>
  );
}

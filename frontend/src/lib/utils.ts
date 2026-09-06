import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export { withCommas } from "@/lib/format";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


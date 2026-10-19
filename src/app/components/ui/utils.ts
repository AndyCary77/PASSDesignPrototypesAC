import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// `text-body` is our semantic 15px body size (see @theme in styles/globals.css).
// Without registering it as a font-size, tailwind-merge would treat it as a text
// colour and let it clobber (or be clobbered by) real colour classes.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: ["body"] }] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

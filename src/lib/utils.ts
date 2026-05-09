/**
 * Merges class names, filtering out falsy values.
 * Accepts any mix of strings, booleans, null, or undefined.
 */
export function cn(...classes: (string | boolean | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

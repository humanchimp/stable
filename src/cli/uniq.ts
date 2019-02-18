export function uniq<T>(array: T[]): T[] {
  return [...new Set<T>(array)] as T[];
}

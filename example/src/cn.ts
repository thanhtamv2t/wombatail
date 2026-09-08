// Runtime implementation only chooses branches/values; Wombatail removes analyzable class strings at build time.
export function cn(...values: unknown[]): string {
  return values.flat(Infinity).filter(Boolean).join(' ')
}

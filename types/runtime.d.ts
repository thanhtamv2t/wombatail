export interface WombatailConfigShape {
  /** Unistyles themes. Keys become theme names; `colors` keys become Wombatail semantic tokens. */
  themes: Record<string, unknown>
  /** Unistyles breakpoints (name -> min width). Names become Wombatail class prefixes. */
  breakpoints?: Record<string, number>
  /** Forwarded to StyleSheet.configure, e.g. { adaptiveThemes: true } or { initialTheme: 'light' }. */
  settings?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Configure Unistyles from wombatail.config.* and return the config unchanged,
 * so `typeof config` can drive the `react-native-unistyles` module augmentation.
 *
 * Import this file once, before any module that calls StyleSheet.create.
 */
export declare function defineWombatailConfig<T extends WombatailConfigShape>(config: T): T

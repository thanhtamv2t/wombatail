import 'react-native'

declare module 'react-native' {
  interface ViewProps { className?: string }
  interface TextProps { className?: string }
  interface ImageProps { className?: string }
  interface ImageBackgroundProps { className?: string }
  interface TextInputProps { className?: string }
  interface ScrollViewProps { className?: string }
  interface PressableProps { className?: string }
  interface TouchableOpacityProps { className?: string }
  interface TouchableHighlightProps { className?: string }
  interface TouchableWithoutFeedbackProps { className?: string }
  interface KeyboardAvoidingViewProps { className?: string }
  interface ActivityIndicatorProps { className?: string }
  interface SwitchProps { className?: string }
  interface FlatListProps<ItemT> { className?: string }
  interface VirtualizedListProps<ItemT> { className?: string }
  interface SectionListProps<ItemT, SectionT> { className?: string }
}

declare function wombatailBabelPlugin(api: unknown): unknown

declare namespace wombatailBabelPlugin {
  interface PluginOptions {
    /**
     * wombatail.config.{ts,js,mjs,cjs} lookup. Defaults to searching upward from the Babel root.
     * `false` disables it, a string points at an explicit file, `true` requires one to exist.
     */
    configFile?: boolean | string
    /** Unistyles breakpoint names accepted as prefixes. */
    breakpoints?: string[]
    /** Compile-time class merge function names. Default: cn/clsx/cx/twMerge. */
    mergeFunctions?: string[]
    /** Throw for unsupported classes. Defaults to true. */
    failOnUnsupported?: boolean
    /** Allow any semantic bg-/text-/border-/tint- token to map to theme.colors. Defaults to true. */
    allowUnknownThemeColors?: boolean
    /** Allow-list for semantic theme color tokens (camelCase). Required when allowUnknownThemeColors=false. */
    themeColorTokens?: string[]
    /** Allow JSX spreads on an element that also has className. Defaults to false for precedence safety. */
    allowJsxSpread?: boolean
    /** Evaluate const bindings that contain statically analyzable class expressions. Defaults to true. */
    evaluateConstBindings?: boolean
    /** Build-time diagnostics. */
    debug?: boolean
  }

  interface WombatailProps { className?: string }

  function resolveClassName(className: string, options: PluginOptions): unknown
  function resolveUtility(token: string, options: PluginOptions): unknown
  function normalizeOptions(options?: PluginOptions): PluginOptions
  function withConfigFile(
    options?: PluginOptions,
    context?: { root?: string; filename?: string },
  ): { options: PluginOptions; path: string | null }
}

export = wombatailBabelPlugin

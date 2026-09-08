# Wombatail 1.0.0-rc.2

**NativeWind/Tailwind-like `className` authoring with `react-native-unistyles` v3 as the styling engine. No runtime class parser.**

```tsx
<View
  className={cn(
    'flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3',
    selected && 'border border-primary',
    disabled && 'opacity-50',
    'md:px-6',
    'ios:mt-4',
  )}
>
  <Text className="text-lg font-semibold text-foreground">Hello</Text>
</View>
```

Wombatail removes statically analyzable `className` expressions during Babel compilation and emits direct `StyleSheet.create(theme => ...)` styles from `react-native-unistyles`.

## Status

`1.0.0-rc.2` is the production-hardening candidate. Core tests, deterministic fuzzing, packaging smoke tests and compiler benchmarks are automated. See [`docs/PRODUCTION.md`](docs/PRODUCTION.md) for the final real-app integration gate before promoting the package to stable `1.0.0`.

## Install

```bash
npm install ./babel-plugin-wombatail-1.0.0-rc.2.tgz
npm install react-native-unistyles react-native-nitro-modules
```

Required baseline follows Unistyles v3: React 19+, React Native 0.78+ with New Architecture, and Expo SDK 53+ for Expo apps. Expo Go is not supported by Unistyles native code.

## Configure

One file is the single source of truth: the Babel plugin reads `themes`/`breakpoints` from it at build time, and `defineWombatailConfig` configures Unistyles at runtime.

```bash
npx wombatail init   # scaffolds wombatail.config.ts (--js for JavaScript)
```

```ts
// wombatail.config.ts
import { defineWombatailConfig } from 'babel-plugin-wombatail/runtime'

const config = defineWombatailConfig({
  themes: {
    light: {
      colors: {
        background: '#F7F7F8',
        surface: '#FFFFFF',
        foreground: '#17171B',
        mutedForeground: '#6E6E78',
        primary: '#6750A4',
        onPrimary: '#FFFFFF',
        border: '#E4E4E7',
        danger: '#D92D20',
      },
    },
    dark: {
      colors: {
        background: '#101014',
        surface: '#18181D',
        foreground: '#F7F7F8',
        mutedForeground: '#A1A1AA',
        primary: '#D0BCFF',
        onPrimary: '#2B1748',
        border: '#303038',
        danger: '#FF716A',
      },
    },
  },
  breakpoints: { xs: 0, sm: 360, md: 768, lg: 1024, xl: 1280 },
  settings: { adaptiveThemes: true },
})

export default config

type WombatailThemes = (typeof config)['themes']
type WombatailBreakpoints = (typeof config)['breakpoints']

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends WombatailThemes {}
  export interface UnistylesBreakpoints extends WombatailBreakpoints {}
}
```

Import it once at the top of the app entry, before any module that creates stylesheets — this ordering is a Unistyles requirement:

```ts
// index.ts
import './wombatail.config'

import { registerRootComponent } from 'expo'
import App from './src/App'

registerRootComponent(App)
```

### Static-only config

The compiler reads the config **without executing it**, so `themes` and `breakpoints` must be inline object literals (top-level `const` references and `defineWombatailConfig(...)` wrapping are fine; imported values, spreads of imports and computed keys are not). A non-analyzable config fails the build with an explicit message. For a dynamic config, set `configFile: false` and pass `breakpoints`/`themeColorTokens` as plugin options instead.

## Babel

Use the helper to lock plugin order:

```js
const { createBabelPlugins } = require('babel-plugin-wombatail/babel-config')

module.exports = function (api) {
  api.cache(true)

  return {
    presets: ['babel-preset-expo'],
    // Breakpoints and theme color tokens come from wombatail.config.ts.
    plugins: createBabelPlugins({ unistyles: { root: 'src' } }),
  }
}
```

`createBabelPlugins` accepts a `wombatail` option object for anything the config file does not cover; explicit options always win over the config file:

| Option | Effect |
| --- | --- |
| `configFile` | `false` disables config lookup, a string points at an explicit file, `true` requires one. |
| `breakpoints` | Overrides the breakpoint names read from the config file. |
| `themeColorTokens` | Overrides the semantic color allow-list read from the config file. |
| `allowUnknownThemeColors` | Defaults to `false` when a config file supplies tokens, otherwise `true`. |

Wombatail must run before the Unistyles Babel plugin because it generates the direct Unistyles `StyleSheet.create` call. If you use React Compiler, keep Unistyles before React Compiler as required by Unistyles.

## What compiles

Static:

```tsx
<View className="flex-row items-center px-4 py-3 bg-surface rounded-xl" />
```

Conditional:

```tsx
<View className={cn(
  'p-4 bg-surface',
  selected && 'border border-primary',
  disabled ? 'opacity-50' : 'opacity-100',
)} />
```

Const binding:

```tsx
const cardClass = 'p-4 rounded-xl bg-surface' as const
<View className={cardClass} />
```

Breakpoint + platform:

```tsx
<View className="px-4 md:px-6 ios:mt-4 ios:md:bg-primary" />
```

Arbitrary native-safe values:

```tsx
<View className="w-[137px] rounded-[13px] bg-[#123456]" />
```

## Theme tokens

```text
bg-background          -> theme.colors.background
bg-primary             -> theme.colors.primary
text-muted-foreground  -> theme.colors.mutedForeground
border-border          -> theme.colors.border
tint-primary           -> theme.colors.primary
```

Tokens are collected from every `themes.*.colors` key in `wombatail.config.*`. With a config file present, `allowUnknownThemeColors` defaults to `false`, so a theme typo is a build error instead of a runtime `undefined`. Without one, pass `themeColorTokens` plus `allowUnknownThemeColors: false` as plugin options to get the same guarantee.

## Style precedence

Explicit `style` is always last:

```tsx
<View className="p-4 bg-surface" style={animatedStyle} />
```

becomes conceptually:

```tsx
<View style={[compiledStyle, animatedStyle]} />
```

Wombatail never spreads Unistyles proxy styles.

Pressable callbacks are composed safely:

```tsx
<Pressable
  className="rounded-xl bg-primary px-4 py-3"
  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
/>
```

## Deliberately rejected

```tsx
// Runtime class parsing is intentionally not shipped.
<View className={props.className} />

// Runtime interpolation is not analyzable.
<View className={`bg-${color}`} />
```

JSX spread + `className` is rejected by default because a spread can contain runtime `className`/`style` and make prop precedence unknowable. Prefer explicit props. An audited project can opt into `allowJsxSpread: true`.

## TypeScript

Create `wombatail-env.d.ts`:

```ts
/// <reference types="babel-plugin-wombatail" />
```

For reusable design-system components, accept/forward `style`. Arbitrary incoming runtime `className` forwarding is outside the zero-runtime-parser contract.

## Production doctor

```bash
npx wombatail doctor
```

It checks visible versions of Node, React, React Native, Unistyles, Nitro Modules and Babel, reports the resolved `wombatail.config.*`, then prints the manual New Architecture/Babel-root checks. `npx wombatail init` scaffolds the config file.

## Verification

```bash
npm test
npm run selftest
npm run benchmark
```

See:

- [`docs/SUPPORTED.md`](docs/SUPPORTED.md)
- [`docs/PRODUCTION.md`](docs/PRODUCTION.md)
- [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

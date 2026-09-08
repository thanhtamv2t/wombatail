<p align="center">
  <img src="./logo.png" alt="Wombatail" width="240" />
</p>

# Wombatail

Write Tailwind-like `className` in React Native. Wombatail compiles it away at build time into direct `react-native-unistyles` v3 calls — no runtime class parser, no overhead.

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

## Status

`1.0.0-rc.2` — release candidate. Tests, fuzzing, smoke tests and benchmarks are all green. See [`PRODUCTION.md`](docs/PRODUCTION.md) for what's left before `1.0.0`.

## Getting started

```bash
npm install ./babel-plugin-wombatail-1.0.0-rc.2.tgz
npm install react-native-unistyles react-native-nitro-modules
```

You'll need React 19+, React Native 0.78+ (New Architecture), and Expo SDK 53+ if you're on Expo. Expo Go won't work — Unistyles needs native code.

### One config file

`wombatail.config.ts` is the single source of truth. The Babel plugin reads `themes`/`breakpoints` from it at build time; `defineWombatailConfig` hands the same object to Unistyles at runtime.

```bash
npx wombatail init   # --js for a JavaScript config
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

Import it once at the very top of your entry file — Unistyles has to be configured before any module creates a stylesheet:

```ts
// index.ts
import './wombatail.config'

import { registerRootComponent } from 'expo'
import App from './src/App'

registerRootComponent(App)
```

The compiler parses this file instead of running it, so keep `themes` and `breakpoints` as plain object literals (a top-level `const` reference is fine). If you need a dynamic config, set `configFile: false` in the plugin options and pass `breakpoints`/`themeColorTokens` yourself.

### Babel setup

Wombatail ships a helper that wires up plugin order for you:

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

Anything the config file doesn't cover still goes in a `wombatail: { ... }` option object, and explicit options always beat the config file.

Wombatail needs to run **before** the Unistyles plugin (it generates the `StyleSheet.create` calls that Unistyles then picks up). If you also use React Compiler, slot Unistyles before it — that's a Unistyles requirement.

## What works

**Static classes** — the straightforward case:

```tsx
<View className="flex-row items-center px-4 py-3 bg-surface rounded-xl" />
```

**Conditionals** — ternaries and `&&` are fine:

```tsx
<View className={cn(
  'p-4 bg-surface',
  selected && 'border border-primary',
  disabled ? 'opacity-50' : 'opacity-100',
)} />
```

**Const bindings** — extracted class strings compile too:

```tsx
const cardClass = 'p-4 rounded-xl bg-surface' as const
<View className={cardClass} />
```

**Breakpoints & platform prefixes**:

```tsx
<View className="px-4 md:px-6 ios:mt-4 ios:md:bg-primary" />
```

**Arbitrary values** (native-safe):

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

Tokens come from every `themes.*.colors` key in your config file, and `allowUnknownThemeColors` flips to `false` automatically when a config file is found — so a typo like `bg-primry` fails the build instead of resolving to `undefined` at runtime. Without a config file, set `allowUnknownThemeColors: false` and pass `themeColorTokens` yourself.

## Style precedence

Inline `style` always wins — it goes last in the array:

```tsx
<View className="p-4 bg-surface" style={animatedStyle} />
// compiles to roughly: <View style={[compiledStyle, animatedStyle]} />
```

Pressable callbacks compose correctly:

```tsx
<Pressable
  className="rounded-xl bg-primary px-4 py-3"
  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
/>
```

## What doesn't work (on purpose)

```tsx
// No runtime parsing — className must be statically analyzable
<View className={props.className} />

// Template literal interpolation can't be resolved at build time
<View className={`bg-${color}`} />
```

JSX spread + `className` is also rejected by default. A spread could sneak in runtime `className`/`style` and mess up precedence. If you've audited your code and know it's safe, flip `allowJsxSpread: true`.

## TypeScript

Add a `wombatail-env.d.ts`:

```ts
/// <reference types="babel-plugin-wombatail" />
```

For design-system components, accept and forward `style`. Don't forward `className` across component boundaries — that breaks the zero-runtime contract.

## Doctor

```bash
npx wombatail doctor
```

Checks your Node, React, React Native, Unistyles, Nitro Modules and Babel versions, reports which `wombatail.config.*` it resolved, then flags anything that needs attention. `npx wombatail init` scaffolds the config file.

## Testing

```bash
npm test          # unit tests
npm run selftest  # compiler self-test
npm run benchmark # perf benchmarks
```

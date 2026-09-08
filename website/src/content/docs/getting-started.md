---
title: Getting started
description: Install Wombatail, create the config file, and wire up Babel.
sidebar:
  order: 1
---

## Requirements

- React 19+
- React Native 0.78+ with the New Architecture enabled
- `react-native-unistyles` v3 and a compatible `react-native-nitro-modules`
- Expo SDK 53+ if you use Expo — a development/native build, **not** Expo Go
- Babel 7 or 8 (`>=7.24 <9`)

## Install

```bash
npm install --save-dev babel-plugin-wombatail
npm install react-native-unistyles react-native-nitro-modules
```

## One config file

`wombatail.config.ts` is the single source of truth. The Babel plugin reads `themes`
and `breakpoints` from it at build time; `defineWombatailConfig` hands the same object
to Unistyles at runtime.

```bash
npx wombatail init   # --js for a JavaScript config
```

```ts title="wombatail.config.ts"
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

Import it once at the very top of your entry file — Unistyles has to be configured
before any module creates a stylesheet:

```ts title="index.ts"
import './wombatail.config'

import { registerRootComponent } from 'expo'
import App from './src/App'

registerRootComponent(App)
```

:::caution
The compiler **parses** this file instead of running it, so keep `themes` and
`breakpoints` as plain object literals (a top-level `const` reference is fine). A
non-analyzable config fails the build rather than silently falling back. If you need a
dynamic config, set `configFile: false` in the plugin options and pass `breakpoints`
and `themeColorTokens` yourself.
:::

With Expo Router, use a custom app entry that imports the config before any routing or
application module.

## Babel setup

Wombatail ships a helper that wires up plugin order for you:

```js title="babel.config.js"
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

Anything the config file doesn't cover goes in a `wombatail: { ... }` option object,
and explicit options always beat the config file. See
[plugin options](/wombatail/reference/options/).

Wombatail must run **before** the Unistyles plugin — it generates the
`StyleSheet.create` calls that Unistyles then picks up. If you also use React Compiler,
slot Unistyles before it; that's a Unistyles requirement. `createBabelPlugins` handles
this ordering; put anything else in its `after` array.

In monorepos, configure Unistyles `autoProcessPaths`/`autoProcessImports` so every file
containing generated Wombatail styles is processed.

## TypeScript

Add a `wombatail-env.d.ts` so `className` is typed on React Native components:

```ts title="wombatail-env.d.ts"
/// <reference types="babel-plugin-wombatail" />
```

## Check your setup

```bash
npx wombatail doctor
```

It validates the versions it can inspect and reports which `wombatail.config.*` it
resolved. See the [CLI reference](/wombatail/reference/cli/).

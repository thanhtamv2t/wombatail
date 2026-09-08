---
title: Production checklist
description: What to verify before shipping a Wombatail app.
---

Wombatail is a build-time Babel transform. The generated `StyleSheet.create` calls are
executed by Unistyles v3.

## Required runtime/build baseline

- React 19+
- React Native 0.78+
- React Native New Architecture enabled
- `react-native-unistyles` v3
- `react-native-nitro-modules` compatible with the installed Unistyles version
- Expo SDK 53+ when using Expo; a development/native build, not Expo Go
- Babel 7 or 8 (package range `>=7.24 <9`)

Run:

```bash
npx wombatail doctor
```

The doctor validates package versions it can inspect. It cannot prove that the New
Architecture is enabled or that Babel roots are correct, so keep the checks below.

## Babel order

Wombatail must execute before Unistyles so Unistyles sees the generated direct import
and `StyleSheet.create` call. If React Compiler is used, Unistyles must still come
before React Compiler.

```js title="babel.config.js"
const { createBabelPlugins } = require('babel-plugin-wombatail/babel-config')

module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: createBabelPlugins({
      // Breakpoints and theme color tokens are read from wombatail.config.ts;
      // pass a `wombatail: { ... }` object here only to override them.
      unistyles: {
        root: 'src',
      },
      // Add React Compiler / worklets / reanimated entries here in the order
      // required by those tools.
      after: [],
    }),
  }
}
```

For monorepos, configure Unistyles `autoProcessPaths`/`autoProcessImports` so every
file containing generated Wombatail styles is processed.

## Configure before styles

`StyleSheet.configure(...)` — which `defineWombatailConfig` calls for you — must run
before modules that create stylesheets. Import `wombatail.config` as the first
statement of the app entry. In Expo Router, use a custom app entry that imports it
before routing/application modules.

## Production-safe defaults

- `failOnUnsupported: true` (default): typos and unimplemented features fail the build.
- `allowJsxSpread: false` (default): avoids unknowable `className`/`style` precedence
  from runtime spread objects.
- `allowUnknownThemeColors` defaults to `false` when a `wombatail.config.*` supplies
  theme color tokens; without a config file, set it explicitly along with
  `themeColorTokens`.
- Keep `themes`/`breakpoints` in the config file as inline object literals: the
  compiler parses that file, it never executes it. A non-analyzable config fails the
  build rather than silently falling back.
- Runtime arbitrary `className` strings remain unsupported by design; accept and
  forward `style` in reusable components.
- Never spread Unistyles style objects. Wombatail composes styles with arrays.

## Pressable

Inline style callbacks are safely composed:

```tsx
<Pressable
  className="rounded-xl bg-primary px-4 py-3"
  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
/>
```

The generated callback returns `[compiledClassStyle, existingCallback(state)]`,
preserving explicit style precedence.

## Testing apps

For Jest tests in a consuming Unistyles app, load the official Unistyles mocks before
component imports, then load your Unistyles configuration.

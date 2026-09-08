---
title: Plugin options
description: Babel plugin options and the createBabelPlugins helper.
---

Options go in a `wombatail: { ... }` object passed to `createBabelPlugins`, or directly
to the plugin if you wire Babel up yourself. **Explicit options always override
`wombatail.config.*`.**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `configFile` | `boolean \| string` | search upward from the Babel root | `false` disables config lookup, a string points at an explicit file, `true` requires one to exist. |
| `breakpoints` | `string[]` | from the config file | Breakpoint names accepted as class prefixes. |
| `mergeFunctions` | `string[]` | `['cn', 'clsx', 'cx', 'twMerge']` | Compile-time class merge function names. |
| `failOnUnsupported` | `boolean` | `true` | Throw for unsupported classes instead of dropping them. |
| `allowUnknownThemeColors` | `boolean` | `true`, or `false` when a config file supplies tokens | Allow any semantic `bg-`/`text-`/`border-`/`tint-` token to map to `theme.colors`. |
| `themeColorTokens` | `string[]` | from the config file | Allow-list of semantic theme color tokens (camelCase). Required when `allowUnknownThemeColors` is `false`. |
| `allowJsxSpread` | `boolean` | `false` | Allow JSX spread on an element that also has `className`. |
| `evaluateConstBindings` | `boolean` | `true` | Evaluate `const` bindings containing statically analyzable class expressions. |
| `debug` | `boolean` | `false` | Build-time diagnostics. |

## `createBabelPlugins`

```js title="babel.config.js"
const { createBabelPlugins } = require('babel-plugin-wombatail/babel-config')

module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: createBabelPlugins({
      wombatail: {
        // only to override wombatail.config.ts
        allowJsxSpread: false,
      },
      unistyles: {
        root: 'src',
        // autoProcessPaths / autoProcessImports for monorepos
      },
      // React Compiler / worklets / reanimated, in the order those tools require
      after: [],
    }),
  }
}
```

The helper guarantees Wombatail runs before the Unistyles plugin. Entries in `after`
are appended, so React Compiler still lands after Unistyles as Unistyles requires.

## Production-safe defaults

- `failOnUnsupported: true` — typos and unimplemented features fail the build.
- `allowJsxSpread: false` — avoids unknowable precedence from runtime spread objects.
- `allowUnknownThemeColors` flips to `false` automatically when a config file supplies
  theme color tokens.

## Programmatic API

The plugin module also exposes helpers used by the compiler and tests:

```js
const wombatail = require('babel-plugin-wombatail')

wombatail.resolveClassName(className, options)
wombatail.resolveUtility(token, options)
wombatail.normalizeOptions(options)
wombatail.withConfigFile(options, { root, filename })
```

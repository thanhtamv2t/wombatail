<p align="center">
  <img src="https://raw.githubusercontent.com/thanhtamv2t/wombatail/main/logo.png" alt="Wombatail" width="240" />
</p>

<h1 align="center">Wombatail</h1>

<p align="center">
  Write Tailwind-like <code>className</code> in React Native.<br />
  Wombatail compiles it away at build time into direct <code>react-native-unistyles</code> v3 calls —
  no runtime class parser, no overhead.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/babel-plugin-wombatail"><img src="https://img.shields.io/npm/v/babel-plugin-wombatail.svg" alt="npm version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/babel-plugin-wombatail.svg" alt="MIT license" /></a>
</p>

<p align="center">
  <b><a href="https://thanhtamv2t.github.io/wombatail/">📖 Documentation</a></b>
</p>

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

## Install

```bash
npm install --save-dev babel-plugin-wombatail
npm install react-native-unistyles react-native-nitro-modules
npx wombatail init
```

Requires React 19+, React Native 0.78+ (New Architecture), and Expo SDK 53+ if you're
on Expo. Expo Go won't work — Unistyles needs native code.

Then wire up Babel:

```js
// babel.config.js
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

Full walkthrough: **[Getting started](https://thanhtamv2t.github.io/wombatail/getting-started/)**.

## Why

- **Zero runtime.** A Babel transform emits `StyleSheet.create` calls that Unistyles
  executes. Nothing parses classes on device.
- **One config file.** `wombatail.config.ts` feeds themes and breakpoints to both the
  compiler and the Unistyles runtime, so the two can't drift.
- **Typos fail the build.** Unsupported utilities and unknown theme tokens are compile
  errors, not silent `undefined` styles.
- **Honest scope.** A deliberate React-Native-safe subset of Tailwind syntax — not a
  claim of full CSS parity.

## Documentation

| | |
| --- | --- |
| [Getting started](https://thanhtamv2t.github.io/wombatail/getting-started/) | Install, config file, Babel setup |
| [Syntax](https://thanhtamv2t.github.io/wombatail/guides/syntax/) | Class expressions that compile |
| [Theming](https://thanhtamv2t.github.io/wombatail/guides/theming/) | Semantic tokens → `theme.colors.*` |
| [Style precedence](https://thanhtamv2t.github.io/wombatail/guides/style-precedence/) | How `className` composes with `style` |
| [Limitations](https://thanhtamv2t.github.io/wombatail/guides/limitations/) | What's rejected, and why |
| [Plugin options](https://thanhtamv2t.github.io/wombatail/reference/options/) | Every Babel option |
| [Supported utilities](https://thanhtamv2t.github.io/wombatail/reference/supported/) | The full utility list |
| [Production checklist](https://thanhtamv2t.github.io/wombatail/reference/production/) | Before you ship |

## Status

`1.0.0-rc.2` — release candidate. Tests, fuzzing, smoke tests and benchmarks are green;
see [Validation](https://thanhtamv2t.github.io/wombatail/reference/validation/) for
what's left before `1.0.0`.

## Contributing

```bash
npm test          # unit tests
npm run selftest  # compiler self-test
npm run benchmark # perf benchmarks

cd website && npm install && npm run dev   # docs site
```

## License

[MIT](./LICENSE)

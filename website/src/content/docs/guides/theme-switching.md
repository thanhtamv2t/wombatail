---
title: Switching themes
description: Using the Unistyles theme switcher with compiled Wombatail classes.
---

Wombatail compiles `bg-surface` into `theme.colors.surface` and hands the result to
Unistyles. Switching themes is entirely Unistyles' job at runtime — nothing recompiles,
and components using `className` update without any extra wiring from you.

The prerequisite is on your side: every theme in `wombatail.config.ts` should define the
**same color token names**, so a class like `bg-surface` resolves under each one.

```ts title="wombatail.config.ts"
themes: {
  light: { colors: { background: '#F7F7F8', surface: '#FFFFFF', primary: '#6750A4' } },
  dark:  { colors: { background: '#101014', surface: '#18181D', primary: '#D0BCFF' } },
}
```

:::note
There is no `dark:` class prefix. A token that changes per theme is the mechanism —
see [theming](/wombatail/guides/theming/).
:::

## Adaptive themes (follow the device)

This is what `npx wombatail init` scaffolds. Register themes named exactly `light` and
`dark`, then let Unistyles track the system color scheme:

```ts title="wombatail.config.ts"
export default defineWombatailConfig({
  themes: { light: { colors: { /* ... */ } }, dark: { colors: { /* ... */ } } },
  settings: { adaptiveThemes: true },
})
```

Flip the OS appearance setting and every compiled `className` follows. No code needed.

## Manual switching

To let users choose a theme, set an `initialTheme` instead of `adaptiveThemes`. The two
are mutually exclusive — Unistyles throws if you set both:

```ts title="wombatail.config.ts"
export default defineWombatailConfig({
  themes: { light: { colors: { /* ... */ } }, dark: { colors: { /* ... */ } } },
  settings: { initialTheme: 'light' },
})
```

Then call `UnistylesRuntime.setTheme` from anywhere — it doesn't need to be inside a
component:

```tsx title="src/ThemeToggle.tsx"
import { Pressable, Text } from 'react-native'
import { UnistylesRuntime } from 'react-native-unistyles'

export function ThemeToggle() {
  return (
    <Pressable
      className="rounded-xl bg-primary px-4 py-3"
      onPress={() =>
        UnistylesRuntime.setTheme(
          UnistylesRuntime.themeName === 'dark' ? 'light' : 'dark',
        )
      }
    >
      <Text className="text-base font-semibold text-on-primary">Toggle theme</Text>
    </Pressable>
  )
}
```

:::caution
`setTheme` **throws** if adaptive themes are enabled. If your config sets
`adaptiveThemes: true` and you also want a manual override, turn adaptive off first:

```ts
UnistylesRuntime.setAdaptiveThemes(false)
UnistylesRuntime.setTheme('dark')
```
:::

## Three-way toggle: light / dark / system

The usual settings screen offers a "System" option alongside the two explicit themes.
Model it as adaptive-themes on/off:

```tsx title="src/useThemePreference.ts"
import { UnistylesRuntime } from 'react-native-unistyles'

export type ThemePreference = 'light' | 'dark' | 'system'

export function applyThemePreference(preference: ThemePreference) {
  if (preference === 'system') {
    UnistylesRuntime.setAdaptiveThemes(true)
    return
  }

  // setTheme throws while adaptive themes are on, so disable first.
  UnistylesRuntime.setAdaptiveThemes(false)
  UnistylesRuntime.setTheme(preference)
}
```

Read the current state back with:

| Property | Type | Meaning |
| --- | --- | --- |
| `UnistylesRuntime.themeName` | `string \| undefined` | Name of the active theme. |
| `UnistylesRuntime.hasAdaptiveThemes` | `boolean` | Whether adaptive themes are on. |
| `UnistylesRuntime.colorScheme` | `'light' \| 'dark' \| 'unspecified'` | The device's color scheme. |

## Persisting the choice

`UnistylesRuntime` doesn't persist anything. Save the preference yourself, then restore
it with a synchronous `initialTheme` function so the first frame renders with the right
theme and never flashes:

```ts title="wombatail.config.ts"
import { defineWombatailConfig } from 'babel-plugin-wombatail/runtime'
import { storage } from './src/storage' // MMKV, or any sync store

const config = defineWombatailConfig({
  themes: {
    light: { colors: { /* ... */ } },
    dark: { colors: { /* ... */ } },
  },
  breakpoints: { xs: 0, sm: 360, md: 768, lg: 1024, xl: 1280 },
  settings: {
    initialTheme: () => storage.getString('theme') ?? 'light',
  },
})

export default config
```

:::caution
`initialTheme` must resolve **synchronously**. `AsyncStorage` won't work here; use MMKV
or another synchronous store.

The compiler parses this file without executing it, so it reads `themes` and
`breakpoints` fine while ignoring the `settings` function. Keep `themes` and
`breakpoints` as plain object literals — only `settings` may contain runtime code.
:::

## Reading theme values in components

You usually don't need to. `className` compiles to a Unistyles stylesheet that updates
itself, and that's the fast path:

```tsx
// Re-styles on theme change with no hook and no re-render.
<View className="bg-surface p-4">
  <Text className="text-foreground">Hello</Text>
</View>
```

When you genuinely need a raw theme value in JS — passing a color to a chart library, an
icon, or a status bar — use the `useUnistyles` hook:

```tsx
import { useUnistyles } from 'react-native-unistyles'

export function Chart() {
  const { theme } = useUnistyles()

  return <LineChart color={theme.colors.primary} />
}
```

:::caution
`useUnistyles` re-renders the component on every theme, breakpoint, and runtime change.
Keep it in small leaf components; never put it near the root of your tree. Prefer
`className` wherever it can do the job.
:::

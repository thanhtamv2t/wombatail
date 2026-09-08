---
title: Theming
description: How semantic color tokens map to Unistyles theme values.
---

Unistyles owns the theme. Wombatail only emits semantic lookups into it.

Named `bg-*`, `text-*`, `border-*`, and `tint-*` values compile to
`theme.colors.<camelCaseToken>`:

```text
bg-background          -> theme.colors.background
bg-primary             -> theme.colors.primary
text-muted-foreground  -> theme.colors.mutedForeground
border-border          -> theme.colors.border
tint-primary           -> theme.colors.primary
```

`black`, `white`, `transparent`, and arbitrary literal colors such as `bg-[#123456]`
stay literal.

## Where tokens come from

Tokens are collected from every `themes.*.colors` key in your `wombatail.config.*`.
Finding a config file also flips `allowUnknownThemeColors` to `false`, so a typo like
`bg-primry` fails the build instead of resolving to `undefined` on device.

Without a config file, set `allowUnknownThemeColors: false` and pass `themeColorTokens`
yourself to get the same safety.

## Dark mode

There is no `dark:` prefix. Use semantic Unistyles themes instead — define `light` and
`dark` in your config with the same token names, and let `settings.adaptiveThemes` or
`initialTheme` pick between them. `bg-surface` then resolves correctly in both.

See [switching themes](/wombatail/guides/theme-switching/) for adaptive themes, a
runtime toggle, and persisting the user's choice.

## Breakpoints

Breakpoint names in Wombatail must match registered Unistyles breakpoints. With
`wombatail.config.*` this holds by construction: both sides read the same object.

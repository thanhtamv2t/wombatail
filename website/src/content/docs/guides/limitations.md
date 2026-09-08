---
title: Limitations
description: What Wombatail rejects on purpose, and why.
---

Wombatail implements a deliberate React-Native-safe subset of Tailwind-like syntax. It
does not claim full Tailwind CSS compatibility. Unsupported utilities **fail
compilation** by default instead of being silently ignored.

## Non-static class expressions

```tsx
// No runtime parsing — className must be statically analyzable
<View className={props.className} />

// Template literal interpolation can't be resolved at build time
<View className={`bg-${color}`} />
```

## JSX spread

JSX spread on an element that also has `className` is rejected by default. A spread
could sneak in a runtime `className`/`style` and break precedence in ways that can't be
proven statically. If you've audited your code and know it's safe, set
`allowJsxSpread: true`.

## Not implemented

- pseudo states (`hover:`, `focus:`, `active:`, `group-*`)
- `dark:` — use [semantic Unistyles themes](/wombatail/guides/theming/) instead
- CSS Grid
- CSS variables, general `calc()`, `clamp()`, container queries
- Tailwind config/plugin execution
- animations, transitions, and transforms as a Tailwind compatibility layer
- automatic arbitrary CSS property remapping
- full web CSS parity

## Escape hatch

`failOnUnsupported: false` makes the compiler drop unsupported classes silently instead
of throwing. That trades away the main safety net, so the recommended path is to keep
the default and drop to an explicit `style` prop for anything outside the supported
subset.

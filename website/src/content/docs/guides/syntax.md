---
title: Syntax
description: The class expressions Wombatail can compile.
---

Everything on this page resolves at build time. For the full utility list, see
[supported utilities](/wombatail/reference/supported/).

## Static classes

```tsx
<View className="flex-row items-center px-4 py-3 bg-surface rounded-xl" />
```

## Conditionals

Ternaries, `&&`, arrays, and the clsx object form all work, inside
`cn` / `clsx` / `cx` / `twMerge` (names configurable via `mergeFunctions`):

```tsx
<View
  className={cn(
    'p-4 bg-surface',
    selected && 'border border-primary',
    disabled ? 'opacity-50' : 'opacity-100',
  )}
/>
```

## Const bindings

Extracted class strings compile too, as long as the initializer is statically
analyzable:

```tsx
const cardClass = 'p-4 rounded-xl bg-surface' as const

<View className={cardClass} />
```

Set `evaluateConstBindings: false` to turn this off.

## Breakpoints and platform prefixes

Breakpoint prefixes come from `breakpoints` in your config and compile to Unistyles
breakpoint-value objects. Platform prefixes compile to `Platform.OS` guards. One
platform and one breakpoint may stack:

```tsx
<View className="px-4 md:px-6 ios:mt-4 ios:md:bg-primary" />
```

Available platform prefixes: `ios:`, `android:`, `web:`, `native:`.

## Arbitrary values

Native-safe arbitrary values are supported:

```tsx
<View className="w-[137px] rounded-[13px] bg-[#123456]" />
```

## Conflict order

Within the same conditional chunk, utilities apply left-to-right. Shorthands are
canonicalized to physical React Native properties first, so results are deterministic:

```text
p-2 px-8
```

compiles to:

```js
{
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 32,
  paddingRight: 32,
}
```

Border and radius utilities canonicalize the same way.

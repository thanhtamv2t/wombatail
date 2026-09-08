---
title: Compatibility contract
description: The semantics Wombatail commits to.
---

## Syntax goal

Wombatail intentionally provides a React-Native-safe subset of Tailwind/NativeWind-like
utility syntax. It is not a full Tailwind CSS implementation. Unsupported utilities fail
compilation by default.

## Conflict semantics

Within the same conditional chunk, supported utilities are applied left-to-right.
Shorthands are canonicalized to physical React Native properties so results are
deterministic.

```text
p-2 px-8
```

becomes equivalent to:

```js
{
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 32,
  paddingRight: 32,
}
```

## Theme semantics

Named `bg-*`, `text-*`, `border-*`, and `tint-*` values — except built-in
black/white/transparent and arbitrary literal colors — compile to
`theme.colors.<camelCaseToken>`.

## Responsive semantics

Breakpoint prefixes compile to Unistyles breakpoint-value objects. Platform prefixes
compile to `Platform.OS` guards. One platform and one breakpoint may be stacked, e.g.
`ios:md:px-6`.

## Dynamic expressions

Supported compile-time forms:

- string literals / no-expression template literals
- statically analyzable `const` bindings
- `cn`, `clsx`, `cx`, `twMerge` (names configurable)
- `condition && 'class'`
- ternary expressions
- arrays
- clsx plain-object form

Arbitrary incoming runtime class strings are intentionally rejected; this keeps runtime
class parsing at zero.

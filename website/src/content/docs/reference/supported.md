---
title: Supported utilities
description: The production-safe React Native subset Wombatail implements.
---

Wombatail implements a deliberate production-safe React Native subset of Tailwind-like
syntax. It does **not** claim full Tailwind CSS compatibility.

## Layout

- `flex`, `hidden`, `flex-1`
- `flex-row`, `flex-row-reverse`, `flex-col`, `flex-col-reverse`
- `flex-wrap`, `flex-nowrap`, `grow`, `grow-0`, `shrink`, `shrink-0`
- `items-*`, `justify-*`, `content-*`, `self-*`
- `relative`, `absolute`, overflow utilities, backface visibility
- `z-*`

## Spacing and position

- `p/px/py/pt/pr/pb/pl-*`
- `m/mx/my/mt/mr/mb/ml-*`
- `gap/gap-x/gap-y-*`
- `inset/inset-x/inset-y/top/right/bottom/left-*`
- negative margin/position where React Native permits it
- common 4px spacing scale and native-safe arbitrary values

Spacing utilities compile to physical properties so source-order conflicts such as
`p-2 px-8` are deterministic.

## Sizing

- `w-*`, `h-*`, `size-*`, `basis-*`
- `min-w-*`, `max-w-*`, `min-h-*`, `max-h-*`
- full/auto/common fractions
- `aspect-square`, `aspect-video`, `aspect-[number]`

## Typography

- `text-xs` through `text-4xl`
- `font-thin` through `font-black`
- italic / non-italic
- alignment and casing utilities
- underline / line-through
- arbitrary font size, line height, and letter spacing values supported by the resolver

## Visual and image-native

- rounded utilities, including side/corner variants
- border widths/styles and directional border widths/colors
- `opacity-*`, `elevation-*`
- `object-cover|contain|fill|scale-down`
- semantic and arbitrary `bg-*`, `text-*`, `border-*`, `tint-*` colors

Border and radius utilities also canonicalize to physical properties for deterministic
source ordering.

## Theme colors

Semantic colors map to Unistyles theme values — see
[theming](/wombatail/guides/theming/):

```text
bg-background         -> theme.colors.background
text-muted-foreground -> theme.colors.mutedForeground
border-primary        -> theme.colors.primary
tint-icon             -> theme.colors.icon
```

`black`, `white`, and `transparent` remain literal colors.

## Responsive and platform

- configured breakpoint prefixes such as `xs:`, `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- `ios:`, `android:`, `web:`, `native:`
- one platform condition and one breakpoint may stack, e.g. `ios:md:px-6`

## Conditional classes

Statically analyzable forms:

- string literals and static template literals
- `cn(...)`, `clsx(...)`, `cx(...)`, `twMerge(...)`
- `condition && 'class'`
- ternaries
- arrays
- clsx-style object form
- `const` bindings whose initializer is statically analyzable

## Intentionally rejected

- arbitrary runtime class strings such as `className={props.className}`
- interpolated dynamic template class names
- JSX spread on the same element as `className` by default
- Tailwind config/plugin execution
- pseudo states (`hover:`, `focus:`, `active:`, `group-*`)
- `dark:` — use semantic Unistyles themes instead
- CSS Grid
- CSS variables, general `calc()`, `clamp()`, container queries
- full web CSS parity
- animations/transitions/transforms as a Tailwind compatibility layer
- automatic arbitrary CSS property remapping

Unsupported utilities fail compilation by default instead of being silently ignored.

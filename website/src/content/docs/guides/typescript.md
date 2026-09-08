---
title: TypeScript
description: Typing className and the Unistyles theme.
---

## `className` on React Native components

Add a `wombatail-env.d.ts` anywhere in your project:

```ts title="wombatail-env.d.ts"
/// <reference types="babel-plugin-wombatail" />
```

This augments `react-native` so `className?: string` exists on `View`, `Text`, `Image`,
`ImageBackground`, `TextInput`, `ScrollView`, `Pressable`, the `Touchable*` components,
`KeyboardAvoidingView`, `ActivityIndicator`, `Switch`, `FlatList`, `VirtualizedList`,
and `SectionList`.

## Themes and breakpoints

`defineWombatailConfig` returns its argument unchanged, so `typeof config` can drive
the Unistyles module augmentation directly from your config file:

```ts title="wombatail.config.ts"
type WombatailThemes = (typeof config)['themes']
type WombatailBreakpoints = (typeof config)['breakpoints']

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends WombatailThemes {}
  export interface UnistylesBreakpoints extends WombatailBreakpoints {}
}
```

That keeps `theme.colors.*` autocompletion and the breakpoint names in sync with the
same object the compiler reads.

## Component props

Accept and forward `style`, not `className`:

```tsx
import type { ViewProps } from 'react-native'

export function Card({ style, ...rest }: ViewProps) {
  return <View className="rounded-xl bg-surface p-4" style={style} {...rest} />
}
```

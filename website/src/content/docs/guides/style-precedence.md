---
title: Style precedence
description: How compiled className styles compose with explicit style props.
---

Inline `style` always wins — it goes last in the array:

```tsx
<View className="p-4 bg-surface" style={animatedStyle} />
// compiles to roughly: <View style={[compiledStyle, animatedStyle]} />
```

Unistyles style objects are never spread; composition uses React Native style arrays.

## Pressable callbacks

Style callbacks stay callbacks after composition:

```tsx
<Pressable
  className="rounded-xl bg-primary px-4 py-3"
  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
/>
```

The generated callback returns `[compiledClassStyle, existingCallback(state)]`, which
preserves explicit-style precedence.

## Design-system components

Accept and forward `style`. Don't forward `className` across component boundaries —
that breaks the zero-runtime contract, since the compiler can't see through the prop.

```tsx
function Card({ style, ...rest }: ViewProps) {
  return <View className="rounded-xl bg-surface p-4" style={style} {...rest} />
}
```

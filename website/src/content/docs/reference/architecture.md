---
title: Architecture
description: How a className becomes a Unistyles stylesheet.
---

```text
wombatail.config.ts  (themes / breakpoints)
  |                                    |
  | parsed at build time               | imported once at the app entry
  | (breakpoint names, color tokens)   | (StyleSheet.configure)
  v                                    v
Wombatail Babel plugin        Unistyles runtime
```

## Compile pipeline

```text
TSX
  className="flex-row px-4 bg-surface md:px-6"
        |
        v
Wombatail Babel plugin
  - statically analyzes class expressions
  - resolves the supported RN utility subset
  - maps semantic colors -> theme.colors.*
  - maps breakpoints -> Unistyles breakpoint values
  - maps platform prefixes -> Platform.OS conditions
        |
        v
Generated source
  style={_wombatailStyles._u0}

  StyleSheet.create(theme => ({
    _u0: {
      flexDirection: 'row',
      paddingLeft: 16,
      paddingRight: 16,
      backgroundColor: theme.colors.surface,
    },
    _u1: { paddingLeft: { md: 24 }, paddingRight: { md: 24 } }
  }))
        |
        v
react-native-unistyles Babel plugin
        |
        v
Unistyles v3 native styling engine / Fabric
```

## Production invariants

1. No runtime class parser.
2. Explicit `style={...}` is composed last and therefore has precedence.
3. Unistyles style objects are never spread; composition uses React Native style arrays.
4. Unsupported or non-static class syntax fails compilation by default.
5. Theme has one owner: Unistyles. Wombatail emits semantic lookups only.
6. Breakpoint names in Wombatail configuration must match registered Unistyles
   breakpoints. With `wombatail.config.*` this holds by construction: both sides read
   the same object.
7. The Wombatail Babel transform runs before the Unistyles Babel transform.
8. Conflicting spacing/border/radius utilities are canonicalized to physical React
   Native properties before merge so source order is deterministic.
9. `Pressable` style callbacks remain callbacks after composition.
10. `className` combined with JSX spread is rejected by default because static
    precedence cannot be guaranteed.
11. The config file is parsed, never executed, so build-time analysis never runs app
    code; explicit Babel plugin options always override it.

## Why the resolver is scoped

The public contract is Tailwind-like React Native syntax, not full CSS compatibility.
The release candidate uses a focused native resolver so unsupported CSS cannot silently
leak into React Native. A later backend may use Tailwind v4 candidate compilation plus
CSS-to-RN normalization while preserving the JSX API and these invariants.

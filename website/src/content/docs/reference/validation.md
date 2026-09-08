---
title: Validation
description: What is tested, and what the stable 1.0 gate requires.
---

Wombatail `1.0.0-rc.2` is validated as a production release candidate for its
documented compile-time subset.

## Automated gates

RC validation result:

- **48/48 automated tests pass.**
- **2,500 deterministic fuzz combinations pass per run.**
- **100,000-iteration resolver benchmark** completes in the tens of thousands of
  resolutions per second — a build-time metric only, and hardware-dependent.
- **`npm pack --dry-run` passes**, with no tests, example, docs site, or internal
  project state shipped.
- **Packed JavaScript syntax check passes** across all publishable files.
- **Packed doctor CLI launches correctly** and reports missing consumer peers as
  expected in a sandbox without React Native installed.

The repository release gate includes:

- Node syntax checks for publishable JavaScript and the CLI.
- Unit tests for resolver behavior, configuration validation, expression analysis,
  Babel config ordering, and doctor helpers.
- Deterministic fuzz tests over supported utility combinations.
- A build-time resolver benchmark to catch major regressions.
- `npm pack` dry-run plus extraction/smoke checks of the packed consumer artifact.

Run them yourself:

```bash
npm test          # unit tests
npm run selftest  # compiler self-test
npm run benchmark # perf benchmarks
```

## Semantic invariants covered

- Explicit `style` is composed after compiled `className` styles.
- `Pressable` style callbacks preserve the callback contract and explicit-style
  precedence.
- Unistyles style values are composed via arrays, never object spread.
- Utility conflicts are deterministic and left-to-right after canonicalization to
  physical React Native properties.
- Static `const` class expressions may be evaluated; mutable/runtime class strings are
  rejected.
- Semantic color tokens can be strictly allow-listed.
- Breakpoint and platform conditions are represented without a runtime class parser.
- JSX spread plus `className` is rejected by default because runtime precedence cannot
  be proven statically.

## Stable 1.0 gate

The build environment does not contain a complete React Native native toolchain or the
package peers needed to execute a real Metro → Wombatail Babel → Unistyles Babel →
Fabric app. `1.0.0-rc.2` is therefore intentionally an RC rather than a falsely labeled
stable release.

Promotion to stable `1.0.0` requires one representative consumer app to pass:

1. Metro development build.
2. Production bundle build.
3. iOS native launch.
4. Android native launch.
5. Theme switching.
6. Breakpoint update.
7. Pressable callback composition.
8. Monorepo processing when that deployment shape is supported.

No public API change is expected for that gate; native-integration defects can be fixed
within the RC line.

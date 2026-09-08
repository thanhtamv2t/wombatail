---
title: CLI
description: wombatail init and wombatail doctor.
---

```bash
npx wombatail <command> [flags]
```

## `wombatail init`

Scaffolds `wombatail.config.ts` next to your project root and prints the entry-file
import you still need to add.

```bash
npx wombatail init        # TypeScript config
npx wombatail init --js   # JavaScript config
```

If a config already exists it reports the path and leaves it alone.

## `wombatail doctor`

The default command. Checks Node, React, React Native, Unistyles, Nitro Modules and
Babel versions, reports which `wombatail.config.*` it resolved, then flags anything
that needs attention.

```bash
npx wombatail doctor
npx wombatail doctor --json   # machine-readable output for CI
```

The exit code is non-zero when a check fails, so `doctor --json` works as a CI gate.

:::note
The doctor validates the package versions it can inspect. It **cannot** prove that the
New Architecture is enabled, that Babel roots are correct, that your Unistyles config
loads before the first `StyleSheet.create`, or that you're on a dev/native build rather
than Expo Go. Keep the [production checklist](/wombatail/reference/production/) for
those.
:::

## `wombatail help`

```bash
npx wombatail help
npx wombatail --help
```

---
id: qui-oec9
status: closed
deps: [qui-gnj0]
links: []
created: 2026-05-23T22:33:20Z
type: task
priority: 2
assignee: Jens Kouros
parent: qui-37bh
tags: [sensors, eslint, domain]
---
# Add domain primitive type alias ESLint rule

Add a custom ESLint sensor rule that flags primitive type usage in src/lib/domain. Domain values should use named type aliases instead of raw string, number, boolean, etc.

## Acceptance Criteria

- Static sensors report primitive type annotations in src/lib/domain unless they are type alias definitions.\n- The rule covers common TypeScript primitive annotations such as string, number, boolean, bigint, symbol, null, and undefined.\n- Existing domain primitive usages are migrated to named aliases.\n- bun run sensors all passes.


---
id: awb-hcap
status: closed
deps: []
links: []
created: 2026-05-23T00:00:00Z
type: task
priority: 0
assignee: Jens Kouros
parent: awb-gjdz
tags: [architecture, sensors, lint, dependency-rules, hexagonal]
---
# Add architecture sensors for hexagonal dependency rules

Introduce lightweight "sensors" for the Quincy rebuild that continuously detect architecture drift, inspired by Martin Fowler's static code analysis dependency-rule sensors. This is the first implementation step for the rebuild: start with static dependency checks that enforce the new hexagonal-ish boundaries and make violations visible during development and CI.

Related reference: https://martinfowler.com/articles/sensors-for-coding-agents.html#StaticCodeAnalysisDependencyRules

Existing custom linting rules in `/Volumes/sourcecode/personal/stan-language-server` should be reviewed as a source of implementation patterns before building AWB-specific sensors.

## Goals

- Add automated checks that detect invalid imports between architecture layers.
- Keep the checks easy to run locally with Bun.
- Make architectural feedback fast enough to guide the rewrite incrementally.
- Prefer small, explicit rules over broad conventions that are hard to understand or maintain.

## Initial dependency rules

Target Quincy structure:

```txt
src/routes/**
src/lib/components/**
src/lib/application/**
src/lib/domain/**
src/lib/infrastructure/**
```


- `src/lib/domain/**` must not import from `src/routes`, `src/lib/components`, `src/lib/application`, `src/lib/infrastructure`, Svelte/React, HTTP/server modules, config loaders, filesystem/process APIs, or browser APIs.
- `src/lib/application/**` may import from `src/lib/domain` and domain port interfaces, but must not import concrete infrastructure, UI components, or depend on route/server request objects directly.
- `src/lib/components/**` may import Svelte/UI dependencies and browser-safe view state, but must not import filesystem/process APIs or infrastructure outbound adapters directly.
- `src/routes.ts`, `src/routes/**`, or equivalent framework route files may import application use cases, the infrastructure inbound HTTP router, and UI components, but should not contain domain logic.
- `src/lib/infrastructure/**` owns adapter implementations, including inbound HTTP routing, config as a domain port implementation, filesystem access, update checks, external API clients, and UI-facing store bridges.
- Agent-related directories or imports should remain absent after the rewrite unless explicitly reintroduced by a future epic.

## Implementation notes

- Inspect `/Volumes/sourcecode/personal/stan-language-server` for existing custom lint/dependency-rule patterns.
- Decide whether to implement this as a custom script, custom lint rule, or test suite.
- Add the sensor to an existing Bun command or introduce a clear command such as `bun run check:architecture`.
- Ensure failures include actionable messages showing the offending file, import, and violated rule.

## Acceptance Criteria

- Architecture dependency sensors exist and are committed in this repo.
- The sensors can be run with Bun locally.
- At minimum, the `src/lib/domain` isolation rule is enforced.
- The intended layer dependency rules are documented near the sensor implementation.
- Current code either passes the sensors or known violations are tracked with follow-up tickets.

---
id: qui-gnj0
status: closed
deps: []
links: []
created: 2026-05-23T20:31:17Z
type: task
priority: 2
assignee: Jens Kouros
parent: awb-gjdz
tags: [architecture, sensors, lint]
---
# Add static ESLint sensors and sensor subcommands

Copy reusable custom ESLint sensor rules from ../stan-language-server/.sensors, adapt them for Quincy where needed, and add sensor subcommands for architecture, static, and all sensor runs.

## Acceptance Criteria

Static ESLint sensors are present in this repo; bun run sensors arch, bun run sensors static, bun run sensors all, bun run sensors:arch, and bun run sensors:static are available; copied rules are documented.


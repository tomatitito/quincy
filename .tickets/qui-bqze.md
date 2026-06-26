---
id: qui-bqze
status: open
deps: []
links: []
created: 2026-06-26T21:13:04Z
type: task
priority: 2
assignee: Jens Kouros
parent: awb-gjdz
tags: [updates, scope, architecture]
---
# Decide Quincy update-check scope

Decide whether Quincy should carry over AWB-style update checking/self-update behavior, and either implement the minimal required seam or explicitly move it out of the rebuild scope.

## Design

The rebuild epic mentions update checks as infrastructure-owned I/O, but current Quincy has no update-check workflow. Avoid copying AWB updater code by default; first decide if Quincy needs update checks in this app lifecycle. If deferred, document the decision and create a future epic only if needed.

## Acceptance Criteria

There is a documented decision for update-check behavior in Quincy. If update checks remain in scope, a small infrastructure-owned implementation or follow-up plan exists. If out of scope, awb-gjdz no longer treats update checks as an unmet rebuild criterion. bun run sensors all passes.


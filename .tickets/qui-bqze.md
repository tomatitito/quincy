---
id: qui-bqze
status: closed
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

## Notes

**2026-06-26T21:35:00Z**

Decision: AWB-style update checking and self-update behavior are out of scope for the Quincy rebuild.

Quincy does not currently define a release channel, install-channel metadata, update cache policy, or user workflow for update notices. AWB's update/self-update implementation depends on those product and distribution decisions, especially around GitHub Release artifacts and safe install replacement. Copying that code into Quincy now would add speculative infrastructure and would not support an existing user-facing workflow.

If Quincy later needs update checks, handle that as a future infrastructure-owned ticket or epic after the release/distribution model is defined. That future work should start with detect-only update notices before considering any in-place self-update behavior.

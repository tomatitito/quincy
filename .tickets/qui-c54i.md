---
id: qui-c54i
status: closed
deps: []
links: []
created: 2026-06-15T00:00:00Z
type: bug
priority: 1
assignee: Jens Kouros
parent: qui-ph1o
tags: [agents, ui, streaming]
---
# Prevent duplicate agent output in the transcript

Agent responses were displayed multiple times because the transcript appended every streamed output notification, including partial updates and final message content for the same assistant message.

## Fix

- Include message correlation metadata on normalized agent output events.
- Mark output updates as append or replace so final full-message events replace prior partial content.
- Update the agent panel transcript by message key instead of blindly appending every output event.
- Fall back to updating the latest unkeyed output entry when runtime events do not provide a stable message id.
- Extract message ids from both message payloads and assistant message event payloads when adapting pi runtime events.

## Acceptance Criteria

- A streamed agent response appears once in the agent transcript.
- Final message events do not duplicate prior streaming deltas.
- Unkeyed streaming updates are coalesced into the latest transcript entry.
- Agent repository tests pass.
- Architecture and static sensors pass.

---
id: qui-gkf5
status: closed
deps: []
links: []
created: 2026-06-26T21:53:10Z
type: task
priority: 1
assignee: Jens Kouros
parent: qui-ph1o
tags: [agents, ui, chat, keyboard]
---
# Submit agent chat message with Enter

Allow Agent panel chat input to submit the current message to Pi when the user presses Enter.

## Design

Keep behavior scoped to the Agent panel chat input. Enter submits when the message is non-empty. Preserve an obvious way to insert newlines if multiline input is supported, such as Shift+Enter.

## Acceptance Criteria

Pressing Enter in the Agent panel chat input submits the current non-empty message to Pi. Empty or whitespace-only messages are not submitted. If the input supports multiline text, Shift+Enter inserts a newline instead of submitting. Existing send button behavior continues to work. bun run sensors all passes.


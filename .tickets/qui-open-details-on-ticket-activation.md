---
id: qui-open-details-on-ticket-activation
status: closed
deps: []
links: []
created: 2026-07-17T00:00:00Z
type: task
priority: 2
assignee: pi
parent: 
tags: [tickets, navigation, ux]
---
# Open ticket details when activating a ticket card

When a user activates a ticket in either the Kanban board or dependency graph, the workspace should navigate to the ticket details view so the selected ticket details are visible immediately.

## Acceptance Criteria

- Activating a Kanban ticket selects the ticket and opens the Details view.
- Activating a graph ticket selects the ticket and opens the Details view.
- Behavior is consistent across desktop, tablet, and mobile layouts.
- Existing ticket selection highlighting remains intact.

## Notes

Implemented by routing ticket activation through the existing selection callback to the Details tab on all viewport modes. Ticket details now receive focus after opening so keyboard and screen-reader users land in the newly opened content.

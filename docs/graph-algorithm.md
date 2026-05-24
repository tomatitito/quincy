# Graph algorithm

Quincy renders ticket dependencies with the same dependency-first semantics as the original AWB graph view.

## Source graph

The source graph is built from ticket `deps` metadata.

If ticket `B` has `deps: [A]`, Quincy creates a directed edge:

```text
A → B
```

Only dependencies that reference existing tickets participate in graph layout and critical-path calculation. Missing dependency IDs affect readiness elsewhere, but they are not graph nodes.

## Cycle handling

Quincy checks for dependency cycles before deriving a layout.

If a cycle exists, the graph view shows a cycle warning instead of rendering a layered order. A layered dependency graph would be misleading because cyclic dependencies have no valid topological order.

## Layering

For acyclic graphs, Quincy uses deterministic topological layering:

- Tickets with no incoming dependencies are placed in layer `0`.
- A ticket's layer is the longest dependency distance from any root ticket.
- Tickets within the same layer are ordered by ticket id.

Example:

```text
A → B → C
```

Produces:

- `A`: layer 0
- `B`: layer 1
- `C`: layer 2

Independent tickets all appear in layer 0. If every ticket has `deps: []`, the graph has nodes but no dependency edges.

## Displayed dependency edges

The rendered graph uses transitive reduction to reduce visual noise.

If Quincy sees:

```text
A → B → C
A → C
```

It hides the direct `A → C` edge because the indirect path already preserves the same reachability. This changes only the rendered edge set; the underlying dependency graph remains unchanged.

## Critical path

The critical path is the longest path in the full dependency graph by edge count.

Important details:

- It is calculated from the full graph, not just the transitive-reduced rendered edges.
- The highlighted path can be toggled in the UI.
- If there are no dependency edges, the critical path length is `0`.

## Presentation

The graph view positions cards from the derived layout:

- Left-to-right mode maps `layer` to x-position and `order` to y-position.
- Top-to-bottom mode maps `layer` to y-position and `order` to x-position.
- Layer bands are drawn behind cards to make the dependency stages visible.
- Dependency edges are drawn as curved SVG paths from dependency to dependent.
- Critical nodes and critical edges are highlighted when critical-path highlighting is enabled.

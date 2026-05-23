# Quincy source layout

- `routes/`: SvelteKit entrypoints/controllers. Keep these thin.
- `lib/components/`: reusable Svelte UI components.
- `lib/application/`: use-case orchestration.
- `lib/domain/`: domain types, pure rules, and ports.
- `lib/infrastructure/`: inbound and outbound adapters.

The old AWB project in `../awb` is reference material only; agent code is intentionally not copied into this rebuild.

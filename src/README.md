# Quincy source layout

- `routes/`: SvelteKit entrypoints/controllers. Keep these thin.
- `lib/components/`: reusable Svelte UI components.
- `lib/application/`: use-case orchestration.
- `lib/domain/`: domain types, pure rules, and ports.
- `lib/infrastructure/`: inbound and outbound adapters.

The old AWB project in `../awb` is reference material only. Agent functionality was reintroduced through Quincy-specific tickets and should keep using the local application/domain/infrastructure boundaries.

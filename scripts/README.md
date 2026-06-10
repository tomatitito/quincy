# Sensors

Run all Quincy sensors with:

```sh
bun run sensors all
```

You can also run individual groups:

```sh
bun run sensors arch
bun run sensors static
bun run sensors:arch
bun run sensors:static
```

## Architecture sensors

Implemented in `scripts/sensors/arch.ts`.

The architecture sensors scan `src/**/*.ts`, `src/**/*.tsx`, `src/**/*.js`, `src/**/*.jsx`, and `src/**/*.svelte` files and report invalid imports with file, line, import specifier, and rule name.

### Boundary rules

- `src/lib/domain/**` must not import routes, components, application use cases, infrastructure adapters, Svelte/React, SvelteKit runtime modules, filesystem/process APIs, or HTTP/server modules.
- `src/lib/application/**` may depend on domain code and domain ports, but not routes, UI components, concrete infrastructure, or SvelteKit request/runtime objects.
- `src/lib/components/**` may use UI dependencies, but must not import filesystem/process/server runtime APIs or infrastructure outbound adapters directly.
- `src/routes.ts` and `src/routes/**` should stay thin and import application use cases, infrastructure inbound HTTP routing, or components instead of importing domain directly.
- `src/lib/infrastructure/**` owns concrete adapter implementations, including inbound HTTP routing, config loading/resolution, filesystem access, update checks, external API clients, Svelte-store bridges, and implementations of domain ports.
- Agent-related source files or imports are flagged because agent functionality is out of scope until a future epic explicitly reintroduces it.

## Static-code sensors

Implemented as custom ESLint rules in `.sensors/eslint-plugin-sensors/`, copied from `../stan-language-server/.sensors` and adapted for Quincy where needed.

Current rules:

- `sensors/mutated-param-must-be-returned`
- `sensors/no-default-parameters`
- `sensors/no-local-type-alias`
- `sensors/no-side-effects-in-map`
- `sensors/no-void-return-functions`

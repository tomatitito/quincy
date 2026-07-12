# Quincy

Quincy is a local web UI for browsing and working with projects that use markdown tickets. It provides ticket, Kanban, graph, and agent views.

## Requirements

- [Bun](https://bun.sh/) 1.3.13 or compatible
- Node.js for running production build

## Install

```sh
bun install
```

## Development

Start development server with hot reload:

```sh
bun run dev
```

Open URL printed by Vite, usually `http://localhost:5173`.

## Production

Build and start production server:

```sh
bun run build
bun run start
```

Open `http://localhost:3000`.

Set host or port through adapter-node environment variables:

```sh
HOST=127.0.0.1 PORT=8080 bun run start
```

Run `bun run build` again after changing source code.

## Choose a project

By default, Quincy uses current working directory and reads tickets from `.tickets`. Override these paths when starting either development or production server:

```sh
QUINCY_PROJECT_PATH=/path/to/project \
QUINCY_TICKET_DIRECTORY=.tickets \
  bun run start
```

Configure multiple projects to select them from Quincy header. See [configuration documentation](docs/configuration.md) for config file locations, schema, and runtime overrides.

## Validation

```sh
bun run check
bun run sensors all
```

# Configuration

## Build and run

Install dependencies, build production server, then start it:

```sh
bun install
bun run build
bun run start
```

Quincy listens on `http://localhost:3000` by default. Set adapter-node environment variables to change server binding, for example:

```sh
HOST=127.0.0.1 PORT=8080 bun run start
```

## Project configuration

Quincy reads tickets from active project's ticket directory. If no config is present, active project defaults to `process.cwd()` and ticket directory defaults to `.tickets`.

## User project config

Quincy discovers selectable projects from platform user config:

- Linux/default: `$XDG_CONFIG_HOME/quincy/config.json` or `~/.config/quincy/config.json`
- macOS: `~/Library/Application Support/quincy/config.json` unless `$XDG_CONFIG_HOME` is set
- Windows: `%APPDATA%/quincy/config.json`

To use `~/.config/quincy` explicitly, set `XDG_CONFIG_HOME=$HOME/.config` before starting Quincy.

Create config:

```sh
mkdir -p ~/.config/quincy
cat > ~/.config/quincy/config.json <<'JSON'
{
  "projects": [
    { "root": "/path/to/project-a", "label": "Project A" },
    { "root": "/path/to/project-b", "ticketDirectory": "project-tickets" }
  ]
}
JSON
```

Project fields:

- `root`: required project/repository path. Entries whose root does not exist are ignored.
- `label`: optional dropdown label.
- `ticketDirectory`: optional per-project ticket directory. Relative values resolve under `root`; absolute values are used as-is.

Configured projects appear in header project dropdown. Selection persists in browser cookie for current browser profile. If no project is selected yet, Quincy uses first valid configured project.

## Runtime overrides

- `QUINCY_PROJECT_PATH`: active project/repository path. Overrides dropdown selection.
- `QUINCY_TICKET_DIRECTORY`: ticket directory. Overrides per-project `ticketDirectory`; relative values resolve under active project; absolute values are used as-is.

# Configuration

Quincy observes `process.cwd()` by default and reads tickets from `.tickets` under that project.

Runtime overrides:

- `QUINCY_PROJECT_PATH`: project or repository path observed by Quincy.
- `QUINCY_TICKET_DIRECTORY`: ticket directory. Relative values resolve under `QUINCY_PROJECT_PATH`; absolute values are used as-is.

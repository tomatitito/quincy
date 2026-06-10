import { watch } from "node:fs";
import type { FSWatcher } from "node:fs";
import path from "node:path";
import type { TicketDirectory } from "$lib/domain/ports";
import { publishAppEvent } from "$lib/infrastructure/outbound/appEventHub";

const watchedDirectories = new Map<TicketDirectory, FSWatcher>();

export function startTicketFileChangeEvents(ticketDirectory: TicketDirectory): FSWatcher {
  const existingWatcher = watchedDirectories.get(ticketDirectory);
  if (existingWatcher !== undefined) return existingWatcher;

  const watcher = createTicketDirectoryWatcher(ticketDirectory);
  watchedDirectories.set(ticketDirectory, watcher);
  return watcher;
}

function createTicketDirectoryWatcher(ticketDirectory: TicketDirectory): FSWatcher {
  return watch(ticketDirectory, { persistent: false }, (_eventType, fileName) => {
    if (fileName === null || path.extname(fileName.toString()) !== ".md") return;
    publishAppEvent({ type: "tickets.changed", payload: { ticketDirectory } });
  });
}

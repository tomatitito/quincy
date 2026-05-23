import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ProjectConfig, TicketRepository } from "$lib/domain/ports";
import type { Ticket, TicketStatus } from "$lib/domain/tickets";

const frontmatterPattern = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

export function createTicketFileRepository(config: ProjectConfig): TicketRepository {
  return {
    listTickets: async () => listMarkdownTickets(config.ticketDirectory),
  };
}

async function listMarkdownTickets(ticketDirectory: string): Promise<Ticket[]> {
  const entries = await readdir(ticketDirectory, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md"));
  return Promise.all(files.map((file) => parseTicketFile(path.join(ticketDirectory, file.name))));
}

async function parseTicketFile(filePath: string): Promise<Ticket> {
  return parseTicket(await readFile(filePath, "utf8"));
}

function parseTicket(markdown: string): Ticket {
  const [, metadataBlock = "", body = markdown] = markdown.match(frontmatterPattern) ?? [];
  const metadata = parseMetadata(metadataBlock);
  return ticketFromMetadata(metadata, body);
}

function ticketFromMetadata(metadata: Map<string, string>, body: string): Ticket {
  return {
    id: requiredValue(metadata, "id"),
    title: parseTitle(body),
    status: parseStatus(requiredValue(metadata, "status")),
    priority: Number(requiredValue(metadata, "priority")),
    type: requiredValue(metadata, "type"),
    deps: parseList(metadata.get("deps") ?? "[]"),
  };
}

function parseMetadata(block: string): Map<string, string> {
  return new Map(block.split("\n").map(parseMetadataLine).filter((entry) => entry !== undefined));
}

function parseMetadataLine(line: string): [string, string] | undefined {
  const separator = line.indexOf(":");
  if (separator === -1) return undefined;
  return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
}

function requiredValue(metadata: Map<string, string>, key: string): string {
  const value = metadata.get(key);
  if (value === undefined || value === "") throw new Error(`Ticket is missing ${key}`);
  return value;
}

function parseStatus(value: string): TicketStatus {
  if (value === "open" || value === "in_progress" || value === "closed") return value;
  throw new Error(`Unknown ticket status: ${value}`);
}

function parseList(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed === "[]") return [];
  return trimmed.slice(1, -1).split(",").map((item) => item.trim()).filter(Boolean);
}

function parseTitle(body: string): string {
  return body.split("\n").find((line) => line.startsWith("# "))?.slice(2).trim() ?? "Untitled ticket";
}

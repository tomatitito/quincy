import type { TicketView } from "$lib/domain/tickets";

export interface AgentStartRequest {
  id: string;
  prompt: string;
}

export function createTicketAgentStartRequest(ticket: TicketView, id: string): AgentStartRequest {
  return { id, prompt: ticketPrompt(ticket) };
}

function ticketPrompt(ticket: TicketView): string {
  const instruction = `Work on ticket ${ticket.id}. Inspect the repository, implement the ticket requirements, and verify the changes.`;
  const description = ticket.description.trim() || "No description.";
  return [instruction, `# ${ticket.id} — ${ticket.title}`, ticketMetadata(ticket), `## Description\n\n${description}`].join("\n\n");
}

function ticketMetadata(ticket: TicketView): string {
  const parent = ticket.parent ?? "None";
  return [
    `- Type: ${ticket.type}`,
    `- Status: ${ticket.status}`,
    `- Priority: P${ticket.priority}`,
    `- Parent: ${parent}`,
    `- Dependencies: ${dependencyList(ticket)}`,
  ].join("\n");
}

function dependencyList(ticket: TicketView): string {
  return ticket.deps.length > 0 ? ticket.deps.join(", ") : "None";
}

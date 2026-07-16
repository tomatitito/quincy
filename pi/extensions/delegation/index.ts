import { DefaultResourceLoader, SessionManager, createAgentSession, getAgentDir, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

type DelegatedRole = "worker" | "scout" | "planner" | "reviewer";

type DelegatedAgentSpec = {
  description: string;
  prompt: string;
  tools: string[];
};

export const delegatedAgents: Record<DelegatedRole, DelegatedAgentSpec> = {
  scout: {
    description: "Fast codebase recon with compressed handoff.",
    tools: ["read", "grep", "find", "ls", "bash"],
    prompt: [
      "You are scout.",
      "Investigate quickly and return only findings needed for a handoff.",
      "Do not modify files.",
      "Output sections: Findings, Relevant Files, Risks.",
    ].join("\n"),
  },
  planner: {
    description: "Implementation planning without code changes.",
    tools: ["read", "grep", "find", "ls"],
    prompt: [
      "You are planner.",
      "Produce concrete implementation plan.",
      "Do not modify files.",
      "Output sections: Goal, Plan, Files, Risks.",
    ].join("\n"),
  },
  worker: {
    description: "General-purpose implementation with isolated context.",
    tools: ["read", "bash", "edit", "write", "grep", "find", "ls"],
    prompt: [
      "You are worker.",
      "Complete delegated task autonomously.",
      "Output sections: Completed, Files Changed, Notes.",
    ].join("\n"),
  },
  reviewer: {
    description: "Code review focused on defects and risks.",
    tools: ["read", "grep", "find", "ls", "bash"],
    prompt: [
      "You are reviewer.",
      "Review delegated changes for bugs, regressions, and missing tests.",
      "Do not modify files.",
      "Output sections: Findings, Severity, Suggested Fixes.",
    ].join("\n"),
  },
};

const delegatedAgentNames = Object.keys(delegatedAgents) as DelegatedRole[];

// eslint-disable-next-line sensors/max-function-lines
export default function registerDelegationExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "subagent",
    label: "Subagent",
    description: `Delegate focused work to isolated subagent. Agents: ${delegatedAgentNames.map((name) => `${name} (${delegatedAgents[name].description})`).join(", ")}. Prefer direct work when delegation adds no value.`,
    parameters: Type.Object({
      task: Type.String({ description: "Task to delegate to subagent." }),
      agent: Type.Optional(Type.String({ description: `Subagent role. One of: ${delegatedAgentNames.join(", ")}. Default: worker.` })),
      cwd: Type.Optional(Type.String({ description: "Working directory for subagent. Default: current working directory." })),
    }),
    // eslint-disable-next-line sensors/max-function-lines
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const agentName = delegatedAgentName(params.agent);
      if (agentName === undefined) return invalidAgentResult(params.agent);
      const subagentCwd = typeof params.cwd === "string" && params.cwd.length > 0 ? params.cwd : ctx.cwd;
      const spec = delegatedAgents[agentName];
      const loader = new DefaultResourceLoader({
        cwd: subagentCwd,
        agentDir: getAgentDir(),
        systemPromptOverride: () => `${ctx.getSystemPrompt()}\n\n# Delegated Role\n\n${spec.prompt}`,
      });
      await loader.reload();
      const { session } = await createAgentSession({
        cwd: subagentCwd,
        agentDir: getAgentDir(),
        model: ctx.model,
        resourceLoader: loader,
        sessionManager: SessionManager.inMemory(subagentCwd),
        tools: spec.tools,
      });
      const abort = () => {
        void session.abort().catch(() => undefined);
      };
      signal?.addEventListener("abort", abort, { once: true });
      try {
        await session.prompt(params.task);
        return {
          content: [{ type: "text", text: finalAssistantText(session.messages) ?? "Subagent completed with no output." }],
          details: { agent: agentName, cwd: subagentCwd, tools: spec.tools, model: modelId(session.model) },
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: errorMessage(error) }],
          details: { agent: agentName, cwd: subagentCwd, tools: spec.tools, model: modelId(session.model) },
          isError: true,
        };
      } finally {
        signal?.removeEventListener("abort", abort);
        session.dispose();
      }
    },
  });
}

function delegatedAgentName(value: unknown): DelegatedRole | undefined {
  if (value === undefined) return "worker";
  return typeof value === "string" && delegatedAgentNames.includes(value as DelegatedRole) ? (value as DelegatedRole) : undefined;
}

function invalidAgentResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: `Unknown subagent: ${typeof value === "string" ? value : "(missing)"}. Available: ${delegatedAgentNames.join(", ")}.` }],
    details: { availableAgents: delegatedAgentNames },
    isError: true,
  };
}

function finalAssistantText(messages: unknown[]): string | undefined {
  for (const message of messages.toReversed()) {
    if (messageRole(message) !== "assistant") continue;
    const text = messageText(message);
    if (text !== undefined && text.length > 0) return text;
  }
  return undefined;
}

function messageRole(message: unknown): string | undefined {
  return stringValue(asRecord(message)?.role);
}

// eslint-disable-next-line sensors/max-function-lines
function messageText(message: unknown): string | undefined {
  const record = asRecord(message);
  if (typeof record?.errorMessage === "string") return record.errorMessage;
  const content = record?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const text = content.map((value) => stringValue(asRecord(value)?.text) ?? stringValue(asRecord(value)?.thinking) ?? "").join("");
    if (text.length > 0) return text;
  }
  return stringValue(record?.output) ?? stringValue(record?.summary);
}

function modelId(model: unknown): string | undefined {
  const record = asRecord(model);
  const provider = stringValue(record?.provider);
  const id = stringValue(record?.id);
  if (provider !== undefined && id !== undefined) return `${provider}/${id}`;
  return id;
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message.length > 0 ? error.message : "Subagent failed.";
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
}

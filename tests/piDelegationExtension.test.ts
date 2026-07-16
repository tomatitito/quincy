/// <reference types="bun" />

import { describe, expect, test } from "bun:test";
import registerDelegationExtension, { delegatedAgents } from "../pi/extensions/delegation/index";

describe("piDelegationExtension", () => {
  test("registers subagent tool with built-in delegation roles", () => {
    let registeredTool: { name?: string; description?: string } | undefined;

    registerDelegationExtension({ registerTool: (tool: unknown) => {
      registeredTool = tool as { name?: string; description?: string };
    } } as never);

    expect(registeredTool).toEqual(expect.objectContaining({ name: "subagent" }));
    expect(registeredTool?.description).toContain("worker");
    expect(Object.keys(delegatedAgents)).toEqual(["scout", "planner", "worker", "reviewer"]);
  });
});

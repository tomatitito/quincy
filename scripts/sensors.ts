#!/usr/bin/env bun

const command = process.argv[2] ?? "all";
const args = process.argv.slice(3);

type SensorCommand = "arch" | "static";

const commands: Record<SensorCommand, string[]> = {
  arch: ["bun", "run", "scripts/sensors/arch.ts", ...args],
  static: ["bash", ".sensors/sensors", "run", ...args],
};

function usage(): never {
  console.error(`Usage: bun run sensors <arch|static|all> [targets...]\n\nCommands:\n  arch    Run Quincy architecture dependency sensors\n  static  Run custom ESLint static-code sensors\n  all     Run arch and static sensors`);
  process.exit(2);
}

function run(name: SensorCommand): number {
  console.log(`\n== sensors:${name} ==`);
  const result = Bun.spawnSync(commands[name], {
    stdout: "inherit",
    stderr: "inherit",
  });

  return result.exitCode;
}

if (command === "arch" || command === "static") {
  process.exit(run(command));
}

if (command === "all") {
  const archExit = run("arch");
  const staticExit = run("static");
  process.exit(archExit === 0 && staticExit === 0 ? 0 : 1);
}

usage();

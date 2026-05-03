import { InvalidArgumentError } from "commander";
import type { Command } from "commander";
import type { ResolvedAcpxConfig } from "./cli/config.js";

type AgentTokenScan = {
  token?: string;
  hasAgentOverride: boolean;
};

type ConfigurePublicCliOptions = {
  program: Command;
  argv: string[];
  config: ResolvedAcpxConfig;
  requestedJsonStrict: boolean;
  topLevelVerbs: ReadonlySet<string>;
  listBuiltInAgents: (agents: ResolvedAcpxConfig["agents"]) => string[];
  detectAgentToken: (argv: string[]) => AgentTokenScan;
  registerAgentCommand: (program: Command, agentName: string, config: ResolvedAcpxConfig) => void;
  registerDefaultCommands: (program: Command, config: ResolvedAcpxConfig) => void;
  handlePromptAction: (command: Command, promptParts: string[]) => Promise<void>;
};

export function configurePublicCli(options: ConfigurePublicCliOptions): void {
  const builtInAgents = options.listBuiltInAgents(options.config.agents);

  for (const agentName of builtInAgents) {
    options.registerAgentCommand(options.program, agentName, options.config);
  }

  options.registerDefaultCommands(options.program, options.config);

  const scan = options.detectAgentToken(options.argv);
  if (
    !scan.hasAgentOverride &&
    scan.token &&
    !options.topLevelVerbs.has(scan.token) &&
    !builtInAgents.includes(scan.token)
  ) {
    options.registerAgentCommand(options.program, scan.token, options.config);
  }

  options.program.argument("[prompt...]", "Prompt text").action(async function (
    this: Command,
    promptParts: string[],
  ) {
    if (promptParts.length === 0 && process.stdin.isTTY) {
      if (options.requestedJsonStrict) {
        throw new InvalidArgumentError(
          "Prompt is required (pass as argument, --file, or pipe via stdin)",
        );
      }
      this.outputHelp();
      return;
    }

    await options.handlePromptAction(this, promptParts);
  });

  options.program.addHelpText(
    "after",
    `
Examples:
  acp-bridge pi "review recent changes"
  acp-bridge codex sessions new
  acp-bridge codex "fix the tests"
  acp-bridge codex prompt "fix the tests"
  acp-bridge codex --no-wait "queue follow-up task"
  acp-bridge codex exec "what does this repo do"
  acp-bridge codex cancel
  acp-bridge codex set-mode plan
  acp-bridge codex set thought_level high
  acp-bridge codex -s backend "fix the API"
  acp-bridge codex sessions
  acp-bridge codex sessions new --name backend
  acp-bridge codex sessions ensure --name backend
  acp-bridge codex sessions close backend
  acp-bridge codex status
  acp-bridge config show
  acp-bridge config init
  acp-bridge --ttl 30 codex "investigate flaky tests"
  acp-bridge claude "refactor auth"
  acp-bridge --agent ./my-custom-server "do something"`,
  );
}

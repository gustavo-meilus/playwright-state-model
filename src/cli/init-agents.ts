import * as fs from "fs";
import * as path from "path";

type LoopType = "vscode" | "claude" | "opencode";

const AGENT_FILES = [
  "state-model-test-planner.md",
  "state-model-test-generator.md",
  "state-model-test-healer.md",
  "module-builder.md",
  "seed.spec.ts",
  "README.md",
] as const;

const LOOP_DIRECTORIES: Record<LoopType, string> = {
  vscode: ".vscode/agents",
  claude: ".claude/agents",
  opencode: ".opencode/agents",
};

function getPackageAgentsDir(): string {
  // Get the directory where this script is located
  // In CJS (which is what we build to), __dirname will be available at runtime
  // @ts-ignore - __dirname is available in CommonJS runtime
  const scriptDir = typeof __dirname !== "undefined" 
    ? __dirname 
    : path.dirname(process.argv[1] || "");

  // When installed as a package, agents are in the package root
  // When running from source, they're in the project root
  const possiblePaths = [
    path.join(scriptDir, "../../agents"), // From dist/cli/init-agents.js
    path.join(scriptDir, "../../../agents"), // Alternative structure
    path.join(process.cwd(), "node_modules/playwright-state-model/agents"), // Installed package
  ];

  for (const agentsPath of possiblePaths) {
    if (fs.existsSync(agentsPath) && fs.statSync(agentsPath).isDirectory()) {
      return agentsPath;
    }
  }

  // Fallback: try to find it relative to package.json or node_modules
  const nodeModulesPath = path.join(
    process.cwd(),
    "node_modules",
    "playwright-state-model",
    "agents"
  );
  if (fs.existsSync(nodeModulesPath)) {
    return nodeModulesPath;
  }

  // Try relative to current working directory (for development)
  const devPath = path.join(process.cwd(), "agents");
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  throw new Error(
    "Could not find agents directory. Make sure playwright-state-model is properly installed."
  );
}

function copyAgents(
  sourceDir: string,
  targetDir: string,
  loopType: LoopType
): void {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`Created directory: ${targetDir}`);
  }

  let copiedCount = 0;
  let skippedCount = 0;

  for (const agentFile of AGENT_FILES) {
    const sourcePath = path.join(sourceDir, agentFile);
    const targetPath = path.join(targetDir, agentFile);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`Warning: Source file not found: ${sourcePath}`);
      continue;
    }

    // Check if target already exists
    if (fs.existsSync(targetPath)) {
      console.log(`Skipped (already exists): ${targetPath}`);
      skippedCount++;
      continue;
    }

    // Copy the file
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied: ${agentFile}`);
    copiedCount++;
  }

  console.log(
    `\n✅ Successfully initialized agents for ${loopType}:\n  - Copied: ${copiedCount} files\n  - Skipped: ${skippedCount} files\n  - Location: ${targetDir}`
  );
}

function main(): void {
  const args = process.argv.slice(2);
  
  // Look for --loop=<value> or --loop <value>
  let loopType: LoopType | null = null;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--loop=")) {
      loopType = arg.split("=")[1] as LoopType;
      break;
    } else if (arg === "--loop" && i + 1 < args.length) {
      loopType = args[i + 1] as LoopType;
      break;
    }
  }

  if (!loopType) {
    console.error(
      "Usage: npx playwright-state-model init-agents --loop=<vscode|claude|opencode>"
    );
    console.error("\nExample:");
    console.error("  npx playwright-state-model init-agents --loop=vscode");
    console.error("  npx playwright-state-model init-agents --loop=claude");
    console.error("  npx playwright-state-model init-agents --loop=opencode");
    process.exit(1);
  }

  if (!["vscode", "claude", "opencode"].includes(loopType)) {
    console.error(
      `Error: Invalid loop type "${loopType}". Must be one of: vscode, claude, opencode`
    );
    process.exit(1);
  }

  try {
    const sourceDir = getPackageAgentsDir();
    const targetDir = path.join(process.cwd(), LOOP_DIRECTORIES[loopType]);

    console.log(`Initializing agents for ${loopType}...`);
    console.log(`Source: ${sourceDir}`);
    console.log(`Target: ${targetDir}\n`);

    copyAgents(sourceDir, targetDir, loopType);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();

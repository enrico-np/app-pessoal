// PostToolUse hook: typecheck after .ts/.tsx edits. Exit 2 feeds errors back to Claude.
import { spawnSync } from "node:child_process";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
const file = JSON.parse(raw || "{}").tool_input?.file_path ?? "";
if (!/\.(ts|tsx)$/.test(file) || /node_modules/.test(file)) process.exit(0);

const r = spawnSync(process.execPath, ["node_modules/typescript/bin/tsc", "--noEmit"], { encoding: "utf8" });
if (r.status !== 0) {
  console.error(r.stdout + r.stderr);
  process.exit(2);
}

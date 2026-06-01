#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const command = process.argv[2];

if (command !== "start") {
  console.log("Usage: job-application-tracker start");
  process.exit(0);
}

const serverProcess = spawn(process.execPath, [path.join(packageRoot, "server", "server.mjs")], {
  stdio: "inherit",
  env: {
    ...process.env,
    JOB_APP_TRACKER_ROOT: packageRoot,
  },
});

serverProcess.on("close", (code) => {
  process.exit(code ?? 0);
});

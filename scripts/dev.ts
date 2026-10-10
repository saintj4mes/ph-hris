import { spawn } from "node:child_process";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const mode = (process.argv[2] ?? process.env.APP_MODE ?? "DEV").trim().toUpperCase();
if (mode !== "DEV" && mode !== "LIVE") throw new Error('APP_MODE must be "DEV" or "LIVE".');
if (process.env.NODE_ENV === "production" && mode !== "LIVE") throw new Error("Production must run with APP_MODE=LIVE.");
process.env.APP_MODE = mode;

const nextCli = path.resolve("node_modules/next/dist/bin/next");

function startNext(): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextCli, "dev"], { stdio: "inherit", env: process.env });
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
    const stop = (signal: NodeJS.Signals) => child.kill(signal);
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    child.once("exit", () => {
      process.off("SIGINT", stop);
      process.off("SIGTERM", stop);
    });
  });
}

async function main() {
  if (mode === "LIVE") {
    if (!process.env.DATABASE_URL) throw new Error("APP_MODE=LIVE requires DATABASE_URL to point to PostgreSQL.");
    process.exitCode = await startNext();
    return;
  }

  process.env.DEMO_ACCOUNTS_ENABLED = "true";
  console.log("APP_MODE=DEV: using in-code demo accounts and sample records; no database connection is opened.");
  process.exitCode = await startNext();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

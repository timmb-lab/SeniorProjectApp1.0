#!/usr/bin/env node
import { runCli } from "./hourly-orchestrator.mjs";

const exitCode = await runCli(["--doctor", ...process.argv.slice(2)]);
process.exitCode = exitCode;

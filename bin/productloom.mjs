#!/usr/bin/env node

import { runCli } from "../plugins/productloom/scripts/productloom.mjs";

process.exitCode = await runCli(process.argv.slice(2));

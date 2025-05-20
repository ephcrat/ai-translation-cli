#!/usr/bin/env bun

// This is the main entry point for the CLI tool.
// It imports and runs the main function from src/cli.ts

import("./src/cli").catch((err) => {
  console.error("Failed to load or run CLI:", err);
  process.exit(1);
});

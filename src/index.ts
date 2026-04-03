#!/usr/bin/env node

import { findSkillsRoot, maybeHandleSkillflag } from "skillflag";

await maybeHandleSkillflag(process.argv, {
  skillsRoot: findSkillsRoot(import.meta.url),
});

import { Command } from "commander";
import { LenzClient } from "./client.js";
import {
  formatClaimsList,
  formatClaimDetail,
  formatDomains,
  formatPodcasts,
  formatJson,
} from "./formatters.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

function getToken(): string {
  if (process.env.LENZ_TOKEN) return process.env.LENZ_TOKEN;

  const configPath = join(homedir(), ".config", "lenz-cli", "config.json");
  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    if (config.token) return config.token;
  }

  console.error(
    "Error: No auth token found.\n" +
      "Set LENZ_TOKEN env var, use --token flag, or create ~/.config/lenz-cli/config.json"
  );
  process.exit(1);
}

function createClient(opts: { token?: string }): LenzClient {
  const token = opts.token || (process.env.LENZ_TOKEN ? getToken() : undefined);
  return new LenzClient({ token });
}

function createAuthClient(opts: { token?: string }): LenzClient {
  const token = opts.token || getToken();
  return new LenzClient({ token });
}

const program = new Command();

program
  .name("lenz")
  .description("CLI for Lenz verified claims fact-checking platform")
  .version("1.0.0")
  .option("--token <token>", "Auth token (or set LENZ_TOKEN env var)")
  .option("--json", "Output raw JSON");

// --- Public commands ---

program
  .command("search <query>")
  .description("Search published verified claims")
  .option("-d, --domain <domain>", "Filter by domain")
  .option("-s, --sort <sort>", "Sort: recent, popular, most_true, most_untrue, relevance", "relevance")
  .option("-p, --page <n>", "Page number", "1")
  .action(async (query: string, opts: { domain: string; sort: string; page: string }) => {
    const globalOpts = program.opts();
    const client = createClient(globalOpts);
    const result = await client.claims({
      search: query,
      domain: opts.domain,
      sort: opts.sort,
      page: parseInt(opts.page),
    });
    console.log(globalOpts.json ? formatJson(result) : formatClaimsList(result));
  });

program
  .command("get <claim_id>")
  .description("Get the full verification report for a claim")
  .action(async (claimId: string) => {
    const globalOpts = program.opts();
    const client = createClient(globalOpts);
    const result = await client.claim(claimId);
    console.log(globalOpts.json ? formatJson(result) : formatClaimDetail(result));
  });

program
  .command("domains")
  .description("List available domains for filtering")
  .action(async () => {
    const globalOpts = program.opts();
    const client = createClient(globalOpts);
    const result = await client.domains();
    console.log(globalOpts.json ? formatJson(result) : formatDomains(result));
  });

program
  .command("podcasts")
  .description("List published podcast episodes")
  .action(async () => {
    const globalOpts = program.opts();
    const client = createClient(globalOpts);
    const result = await client.podcasts();
    console.log(globalOpts.json ? formatJson(result) : formatPodcasts(result));
  });

program
  .command("browse")
  .description("Browse published claims with optional filters")
  .option("-d, --domain <domain>", "Filter by domain")
  .option("-e, --entity <entity>", "Filter by entity")
  .option("-s, --sort <sort>", "Sort: recent, popular, most_true, most_untrue", "recent")
  .option("-p, --page <n>", "Page number", "1")
  .action(async (opts: { domain: string; entity: string; sort: string; page: string }) => {
    const globalOpts = program.opts();
    const client = createClient(globalOpts);
    const result = await client.claims({
      domain: opts.domain,
      entity: opts.entity,
      sort: opts.sort,
      page: parseInt(opts.page),
    });
    console.log(globalOpts.json ? formatJson(result) : formatClaimsList(result));
  });

// --- Authenticated commands ---

program
  .command("submit <text>")
  .description("Submit a claim for verification")
  .option("-u, --source-url <url>", "Source URL for the claim")
  .option("-v, --visibility <vis>", "Visibility setting")
  .action(async (text: string, opts: { sourceUrl: string; visibility: string }) => {
    const globalOpts = program.opts();
    const client = createAuthClient(globalOpts);
    const result = await client.submit(text, opts.sourceUrl, opts.visibility);
    console.log(globalOpts.json ? formatJson(result) : JSON.stringify(result, null, 2));
  });

program
  .command("status <task_id>")
  .description("Check the processing status of a submitted claim")
  .action(async (taskId: string) => {
    const globalOpts = program.opts();
    const client = createAuthClient(globalOpts);
    const result = await client.status(taskId);
    console.log(formatJson(result));
  });

program
  .command("my-claims")
  .description("List your own claims")
  .option("-p, --page <n>", "Page number", "1")
  .option("--page-size <n>", "Results per page", "20")
  .action(async (opts: { page: string; pageSize: string }) => {
    const globalOpts = program.opts();
    const client = createAuthClient(globalOpts);
    const result = await client.myClaims(parseInt(opts.page), parseInt(opts.pageSize));
    console.log(formatJson(result));
  });

program
  .command("my-claim <claim_id>")
  .description("Get full detail of one of your own claims")
  .action(async (claimId: string) => {
    const globalOpts = program.opts();
    const client = createAuthClient(globalOpts);
    const result = await client.myClaim(claimId);
    console.log(globalOpts.json ? formatJson(result) : formatClaimDetail(result));
  });

program
  .command("delete <claim_id>")
  .description("Delete one of your own claims")
  .action(async (claimId: string) => {
    const globalOpts = program.opts();
    const client = createAuthClient(globalOpts);
    await client.deleteClaim(claimId);
    console.log("Claim deleted.");
  });

program
  .command("visibility <claim_id> <visibility>")
  .description("Change the visibility of one of your own claims")
  .action(async (claimId: string, visibility: string) => {
    const globalOpts = program.opts();
    const client = createAuthClient(globalOpts);
    const result = await client.setVisibility(claimId, visibility);
    console.log(globalOpts.json ? formatJson(result) : "Visibility updated.");
  });

program
  .command("chat <claim_id>")
  .description("Get chat history for a claim")
  .action(async (claimId: string) => {
    const globalOpts = program.opts();
    const client = createAuthClient(globalOpts);
    const result = await client.chat(claimId);
    console.log(formatJson(result));
  });

program
  .command("ask <claim_id> <message>")
  .description("Send a message to the AI expert about a claim")
  .action(async (claimId: string, message: string) => {
    const globalOpts = program.opts();
    const client = createAuthClient(globalOpts);
    const result = await client.sendChat(claimId, message);
    console.log(formatJson(result));
  });

program
  .command("reset-chat <claim_id>")
  .description("Reset chat history for a claim")
  .action(async (claimId: string) => {
    const globalOpts = program.opts();
    const client = createAuthClient(globalOpts);
    await client.resetChat(claimId);
    console.log("Chat history reset.");
  });

program
  .command("continue <task_id> <text>")
  .description("Continue after multi-claim detection by picking one claim")
  .action(async (taskId: string, text: string) => {
    const globalOpts = program.opts();
    const client = createAuthClient(globalOpts);
    const result = await client.continueSubmit(taskId, text);
    console.log(formatJson(result));
  });

program
  .command("config")
  .description("Save auth token to config file")
  .argument("<token>", "Your Lenz API token (starts with lenz_)")
  .action(async (token: string) => {
    const { mkdirSync, writeFileSync } = await import("fs");
    const configDir = join(homedir(), ".config", "lenz-cli");
    mkdirSync(configDir, { recursive: true });
    const configPath = join(configDir, "config.json");
    writeFileSync(configPath, JSON.stringify({ token }, null, 2));
    console.log(`Token saved to ${configPath}`);
  });

program.parseAsync().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

/**
 * Shared helpers for the example clients: CLI options and pretty printing.
 */

import { parseArgs } from "node:util";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

export interface Options {
  url: string;
  headers: Record<string, string>;
}

export function parseOptions(defaultUrl: string): Options {
  const { values } = parseArgs({
    options: {
      url: { type: "string", default: process.env.MCP_SERVER_URL ?? defaultUrl },
      header: { type: "string", multiple: true, default: [] },
    },
  });
  const headers: Record<string, string> = {};
  for (const raw of values.header ?? []) {
    const idx = raw.indexOf(":");
    if (idx <= 0) {
      throw new Error(`--header must look like 'Name: value', got '${raw}'`);
    }
    headers[raw.slice(0, idx).trim()] = raw.slice(idx + 1).trim();
  }
  return { url: values.url as string, headers };
}

/** Never print credentials: keep only the last 4 characters. */
export function maskHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k, v.length > 4 ? `***${v.slice(-4)}` : "***"])
  );
}

interface JsonSchemaProperty {
  type?: string;
  anyOf?: { type?: string }[];
}

/** Print server info and everything it offers. Returns the tool names. */
export async function describeServer(client: Client): Promise<string[]> {
  const info = client.getServerVersion();
  console.log(`Server: ${info?.name} ${info?.version}`);
  const caps = client.getServerCapabilities() ?? {};

  const { tools } = await client.listTools();
  console.log(`\nTools (${tools.length}):`);
  for (const tool of tools) {
    console.log(`  - ${tool.name}: ${(tool.description ?? "").split("\n")[0]}`);
    const props = (tool.inputSchema.properties ?? {}) as Record<string, JsonSchemaProperty>;
    const required = new Set(tool.inputSchema.required ?? []);
    for (const [name, prop] of Object.entries(props)) {
      const kind = prop.type ?? prop.anyOf?.map((p) => p.type).join("/") ?? "any";
      console.log(`      ${name} (${kind}, ${required.has(name) ? "required" : "optional"})`);
    }
  }

  if (caps.resources) {
    const { resources } = await client.listResources();
    console.log(`\nResources (${resources.length}):`);
    for (const r of resources) console.log(`  - ${r.uri} ${r.name ?? ""}`);
  }
  if (caps.prompts) {
    const { prompts } = await client.listPrompts();
    console.log(`\nPrompts (${prompts.length}):`);
    for (const p of prompts) console.log(`  - ${p.name}: ${p.description ?? ""}`);
  }
  return tools.map((t) => t.name);
}

/** Print a tools/call result: structured content when present, else text. */
export function printResult(result: Record<string, unknown>): void {
  const content = (Array.isArray(result.content) ? result.content : []) as { text?: string }[];
  if (result.isError) {
    throw new Error(`tool returned an error: ${content.map((c) => c.text ?? "").join(" ")}`);
  }
  if (result.structuredContent !== undefined) {
    console.log(JSON.stringify(result.structuredContent));
  } else {
    for (const c of content) console.log(c.text ?? JSON.stringify(c));
  }
}

/** Run main() and exit non-zero on failure. */
export function run(main: () => Promise<void>): void {
  main().catch((error: unknown) => {
    console.error("❌", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

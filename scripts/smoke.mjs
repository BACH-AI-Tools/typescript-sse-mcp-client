#!/usr/bin/env node
// End-to-end smoke test: start jieba-mcp, run every built example against it.
//
//   npm run build && npm run smoke
//
// The server command defaults to `uvx jieba-mcp`; override it with
// JIEBA_MCP_CMD, e.g. JIEBA_MCP_CMD="jieba-mcp" if it is already installed.

import { spawn, spawnSync } from "node:child_process";
import net from "node:net";

const serverCmd = (process.env.JIEBA_MCP_CMD ?? "uvx jieba-mcp").split(/\s+/);

// [transport, built script, extra args, expected substrings]
const cases = [
  ["sse", "dist/sse-client-example.js", [], ["Server: jieba", "清华大学"]],
  ["streamable-http", "dist/streamable-http-demo.js", [], ["Session id:", "清华大学"]],
  ["streamable-http", "dist/jieba-demo.js", [], ["中国科学院", "大语言模型", "軟體和滑鼠"]],
  ["sse", "dist/jieba-demo.js", ["--transport", "sse"], ["中国科学院", "大语言模型", "軟體和滑鼠"]],
];

const freePort = () =>
  new Promise((resolve) => {
    const srv = net.createServer().listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });

const waitForPort = async (port, child, timeoutMs = 180_000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited early (${child.exitCode})`);
    const open = await new Promise((resolve) => {
      const sock = net.connect(port, "127.0.0.1", () => { sock.end(); resolve(true); });
      sock.on("error", () => resolve(false));
    });
    if (open) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`server did not listen on port ${port}`);
};

for (const [transport, script, extra, expected] of cases) {
  const port = await freePort();
  const server = spawn(serverCmd[0], [...serverCmd.slice(1), "--transport", transport, "--port", String(port)], {
    stdio: "ignore",
  });
  try {
    await waitForPort(port, server);
    const url = `http://127.0.0.1:${port}${transport === "sse" ? "/sse" : "/mcp"}`;
    const out = spawnSync(process.execPath, [script, "--url", url, ...extra], { encoding: "utf8", timeout: 120_000 });
    const missing = expected.filter((e) => !out.stdout.includes(e));
    if (out.status !== 0 || missing.length) {
      console.log(out.stdout, out.stderr);
      throw new Error(`${script} (${transport}): status=${out.status}, missing=${missing}`);
    }
    console.log(`ok  ${script.padEnd(32)} ${transport}`);
  } finally {
    server.kill();
  }
}
console.log("all examples passed");

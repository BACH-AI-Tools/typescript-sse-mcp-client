/**
 * A practical client: Chinese text processing through the jieba-mcp server.
 *
 *   npm run demo                                                  # Streamable HTTP
 *   npm run demo -- --transport sse --url http://127.0.0.1:8001/sse
 */

import { parseArgs } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { printResult, run } from "./common.js";

const CALLS: [string, Record<string, unknown>][] = [
  ["segment", { text: "小明硕士毕业于中国科学院计算所", mode: "search" }],
  ["extract_keywords", { text: "线程是程序执行中一个单一的顺序控制流程，进程内有一个或多个线程，线程共享进程的资源", top_k: 3, method: "textrank" }],
  ["pos_tag", { text: "我爱北京天安门" }],
  ["add_user_words", { words: [{ word: "大语言模型", tag: "nz" }] }],
  ["segment", { text: "大语言模型正在改变软件开发" }],
  ["convert_chinese", { text: "软件和鼠标", config: "s2twp" }],
];

run(async () => {
  const { values } = parseArgs({
    options: {
      transport: { type: "string", default: "streamable-http" },
      url: { type: "string", default: process.env.MCP_SERVER_URL },
    },
  });
  const sse = values.transport === "sse";
  const url = new URL(values.url ?? `http://127.0.0.1:8000${sse ? "/sse" : "/mcp"}`);
  const transport = sse ? new SSEClientTransport(url) : new StreamableHTTPClientTransport(url);
  const client = new Client({ name: "jieba-demo", version: "1.0.0" });

  try {
    await client.connect(transport);
    for (const [name, args] of CALLS) {
      console.log(`\n>>> ${name}`);
      printResult(await client.callTool({ name, arguments: args }));
    }
  } finally {
    await client.close();
  }
});

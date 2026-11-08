/**
 * Connect to an MCP server over the Streamable HTTP transport.
 *
 *   npm run streamable -- --url http://127.0.0.1:8000/mcp
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { describeServer, maskHeaders, parseOptions, printResult, run } from "./common.js";

run(async () => {
  const { url, headers } = parseOptions("http://127.0.0.1:8000/mcp");
  console.log(`Connecting to ${url} (Streamable HTTP)`);
  if (Object.keys(headers).length) console.log("Headers:", maskHeaders(headers));

  // Extra headers (e.g. Authorization) go into requestInit.
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers },
  });
  const client = new Client({ name: "streamable-http-demo", version: "1.0.0" });

  try {
    await client.connect(transport); // sends initialize + initialized
    // Stateful servers assign a session id (Mcp-Session-Id header).
    console.log(`Session id: ${transport.sessionId ?? "(stateless server)"}`);
    const tools = await describeServer(client);

    if (tools.includes("extract_keywords")) {
      const text = "我来到北京清华大学，清华大学是一所综合性大学";
      console.log(`\nCalling extract_keywords {"text": "${text}", "top_k": 3}:`);
      printResult(await client.callTool({ name: "extract_keywords", arguments: { text, top_k: 3 } }));
    }
  } finally {
    await client.close();
  }
});

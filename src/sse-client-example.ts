/**
 * Connect to an MCP server over the (legacy) HTTP+SSE transport.
 *
 *   npm run sse -- --url http://127.0.0.1:8001/sse
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { describeServer, maskHeaders, parseOptions, printResult, run } from "./common.js";

run(async () => {
  const { url, headers } = parseOptions("http://127.0.0.1:8000/sse");
  console.log(`Connecting to ${url} (SSE)`);
  if (Object.keys(headers).length) console.log("Headers:", maskHeaders(headers));

  // requestInit headers are sent both on the GET /sse stream and on the
  // POSTed messages.
  const transport = new SSEClientTransport(new URL(url), {
    requestInit: { headers },
  });
  const client = new Client({ name: "sse-client-example", version: "1.0.0" });

  try {
    await client.connect(transport);
    const tools = await describeServer(client);

    if (tools.includes("segment")) {
      console.log('\nCalling segment {"text": "我来到北京清华大学"}:');
      printResult(await client.callTool({ name: "segment", arguments: { text: "我来到北京清华大学" } }));
    }
  } finally {
    await client.close();
  }
});

# TypeScript MCP client examples (Streamable HTTP + SSE)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

**English** | [简体中文](README.zh-CN.md)

Small, runnable TypeScript programs that connect to a **remote** MCP server with the official [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk). They cover both HTTP transports:
- **Streamable HTTP**, the current transport;
- **HTTP+SSE**, the legacy transport that many servers still offer.

Each program connects, lists the server's tools, resources and prompts, and calls a tool. The examples use [jieba-mcp](https://github.com/BACH-AI-Tools/jieba-mcp), a Chinese text-processing server you can start locally in one command, so everything below runs without any account or API key.

## Files

| File | What it shows |
|---|---|
| `src/streamable-http-demo.ts` | Streamable HTTP: custom headers, session id, list everything, call a tool |
| `src/sse-client-example.ts` | The same over the legacy SSE transport |
| `src/jieba-demo.ts` | A practical client calling five jieba tools; `--transport streamable-http\|sse` |
| `src/common.ts` | Shared CLI options (`--url`, `--header`) and printing |
| `scripts/smoke.mjs` | Starts jieba-mcp, runs every built example over both transports, checks the output |

## Quick start

**1. Start the demo server.** Run each transport in its own terminal:

```bash
uvx jieba-mcp --transport streamable-http --port 8000   # http://127.0.0.1:8000/mcp
uvx jieba-mcp --transport sse --port 8001               # http://127.0.0.1:8001/sse
```

- Until jieba-mcp is on PyPI, use `uvx --from git+https://github.com/BACH-AI-Tools/jieba-mcp jieba-mcp` in place of `uvx jieba-mcp`.
- If port 8000 is taken, pick another port and pass a matching `--url`.

**2. Build and run** (Node.js 18+):

```bash
npm install
npm run build
npm run streamable                                   # Streamable HTTP example
npm run sse -- --url http://127.0.0.1:8001/sse       # SSE example
npm run demo                                         # jieba demo over Streamable HTTP
npm run demo -- --transport sse --url http://127.0.0.1:8001/sse
```

Real output, trimmed. The session id differs on every run.

```text
$ npm run -s streamable -- --header 'Authorization: Bearer demo-token'
Connecting to http://127.0.0.1:8000/mcp (Streamable HTTP)
Headers: { Authorization: '***oken' }
Session id: 4de150017bae4643bbcc8cf381f31ea9
Server: jieba 1.0.0

Tools (5):
  - segment: Split Chinese text into words with jieba.
      text (string, required)
      mode (string, optional)
      hmm (boolean, optional)
  - extract_keywords: Extract the most important keywords from Chinese text.
  ...
Calling extract_keywords {"text": "我来到北京清华大学，清华大学是一所综合性大学", "top_k": 3}:
{"method":"tfidf","keywords":[{"word":"清华大学","weight":2.308741},{"word":"一所","weight":1.115948},{"word":"综合性","weight":1.044143}]}
```

```text
$ npm run -s sse -- --url http://127.0.0.1:8001/sse
Connecting to http://127.0.0.1:8001/sse (SSE)
Server: jieba 1.0.0
...
Calling segment {"text": "我来到北京清华大学"}:
{"mode":"precise","tokens":["我","来到","北京","清华大学"],"count":4}
```

```text
$ npm run -s demo
>>> segment
{"mode":"search","tokens":["小明","硕士","毕业","于","中国","科学","学院","科学院","中国科学院","计算","计算所"],"count":11}

>>> extract_keywords
{"method":"textrank","keywords":[{"word":"线程","weight":1},{"word":"进程","weight":0.7957},{"word":"共享","weight":0.504354}]}

>>> pos_tag
{"tokens":[{"word":"我","flag":"r"},{"word":"爱","flag":"v"},{"word":"北京","flag":"ns"},{"word":"天安门","flag":"ns"}],"count":4}

>>> add_user_words
{"added":["大语言模型"],"count":1}

>>> segment
{"mode":"precise","tokens":["大语言模型","正在","改变","软件开发"],"count":4}

>>> convert_chinese
{"config":"s2twp","text":"軟體和滑鼠"}
```

The SSE run of the demo prints the same output.

## Connect to your own server

```bash
npm run streamable -- --url https://example.com/mcp --header 'Authorization: Bearer <your-token>'
```

You can also set `MCP_SERVER_URL` instead of passing `--url`. Header values are masked when printed. Keep real tokens in environment variables, never in code.

## The core code

**Streamable HTTP:**

```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(new URL("http://127.0.0.1:8000/mcp"), {
  requestInit: { headers: { Authorization: "Bearer <token>" } },
});
const client = new Client({ name: "my-client", version: "1.0.0" });
await client.connect(transport);            // initialize handshake
console.log(transport.sessionId);           // Mcp-Session-Id, if the server is stateful
const result = await client.callTool({ name: "segment", arguments: { text: "我来到北京清华大学" } });
console.log(result.structuredContent);
await client.close();
```

**SSE:** the same `Client`, with a different transport:

```ts
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(new URL("http://127.0.0.1:8001/sse"), {
  requestInit: { headers: { Authorization: "Bearer <token>" } }, // sent on the GET stream and the POSTs
});
await client.connect(transport);
```

## Streamable HTTP or SSE?

| | Streamable HTTP | HTTP+SSE (legacy) |
|---|---|---|
| Endpoint | one URL, usually `/mcp` (POST, plus an optional GET stream) | `GET /sse` for the event stream + `POST /messages/?session_id=…` |
| Status in the spec | current (since 2025-03-26) | deprecated, kept for compatibility |
| Sessions | optional `Mcp-Session-Id` header; servers may be stateless | one session per open SSE connection |
| Resuming a dropped stream | supported with `Last-Event-ID` | not supported |
| Proxies / serverless | plain request/response works | needs a long-lived connection |

Use Streamable HTTP when the server offers it, and SSE only for servers that have nothing else.

## Using a remote server from an MCP app

Many clients accept a URL directly. The exact keys vary by app. For example, Cursor's `mcp.json`:

```json
{
  "mcpServers": {
    "jieba": { "url": "http://127.0.0.1:8000/mcp" }
  }
}
```

## Troubleshooting

- **`405 Method Not Allowed` / `404`:** the URL and transport don't match. Streamable HTTP servers usually listen on `/mcp`, SSE servers on `/sse`.
- **Redirects / HTML instead of JSON:** the URL points at something else, such as a login page served by another web app on the same port.
- **`ERR_MODULE_NOT_FOUND` for `dist/...`:** run `npm run build` first.
- **Old SDKs:** these examples need `@modelcontextprotocol/sdk` 1.24 or newer. They were tested with 1.24.0 and 1.32.2.

## Smoke test

```bash
npm run build && npm run smoke                       # uses `uvx jieba-mcp`
JIEBA_MCP_CMD=jieba-mcp npm run smoke                # if it is already installed
```

## License

MIT, see [LICENSE](LICENSE). Author: **Feng Rongquan**, [BACH-AI-Tools](https://github.com/BACH-AI-Tools).

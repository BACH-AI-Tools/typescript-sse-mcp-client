# TypeScript MCP 客户端示例（Streamable HTTP + SSE）

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

[English](README.md) | **简体中文**

用官方 [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) 连接**远程** MCP 服务器的小型示例程序，可以直接运行。两种 HTTP 传输都覆盖：
- **Streamable HTTP**：当前的标准传输方式；
- **HTTP+SSE**：旧版传输方式，不少服务器仍在提供。

每个程序都会建立连接，列出服务器的工具、资源和提示词，再调用一个工具。示例服务器用的是 [jieba-mcp](https://github.com/BACH-AI-Tools/jieba-mcp)（中文分词服务），本地一条命令就能启动，不需要任何账号或 API Key。

## 文件说明

| 文件 | 演示内容 |
|---|---|
| `src/streamable-http-demo.ts` | Streamable HTTP：自定义请求头、会话 ID、列出全部能力、调用工具 |
| `src/sse-client-example.ts` | 同样的流程，走旧版 SSE 传输 |
| `src/jieba-demo.ts` | 实用客户端：依次调用 jieba 的 5 个工具，`--transport streamable-http\|sse` |
| `src/common.ts` | 公共命令行参数（`--url`、`--header`）和输出格式 |
| `scripts/smoke.mjs` | 启动 jieba-mcp，用两种传输跑完所有编译好的示例并检查输出 |

## 快速开始

**1. 启动示例服务器**（两种传输各开一个终端）：

```bash
uvx jieba-mcp --transport streamable-http --port 8000   # http://127.0.0.1:8000/mcp
uvx jieba-mcp --transport sse --port 8001               # http://127.0.0.1:8001/sse
```

- jieba-mcp 发布到 PyPI 之前，把 `uvx jieba-mcp` 换成 `uvx --from git+https://github.com/BACH-AI-Tools/jieba-mcp jieba-mcp`。
- 如果 8000 端口已被占用，换一个端口，并用 `--url` 指过去。

**2. 编译并运行**（Node.js 18+）：

```bash
npm install
npm run build
npm run streamable                                   # Streamable HTTP example
npm run sse -- --url http://127.0.0.1:8001/sse       # SSE example
npm run demo                                         # jieba demo over Streamable HTTP
npm run demo -- --transport sse --url http://127.0.0.1:8001/sse
```

下面是真实输出（有删减；会话 ID 每次运行都不同）：

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

用 SSE 运行 demo 时输出完全相同。

## 连接你自己的服务器

```bash
npm run streamable -- --url https://example.com/mcp --header 'Authorization: Bearer <your-token>'
```

也可以设置环境变量 `MCP_SERVER_URL` 来代替 `--url`。打印请求头时会自动打码。真实的 token 请放在环境变量里，不要写进代码。

## 核心代码

**Streamable HTTP：**

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

**SSE：** 用同一个 `Client`，只换传输层：

```ts
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(new URL("http://127.0.0.1:8001/sse"), {
  requestInit: { headers: { Authorization: "Bearer <token>" } }, // sent on the GET stream and the POSTs
});
await client.connect(transport);
```

## 选 Streamable HTTP 还是 SSE？

| | Streamable HTTP | HTTP+SSE（旧版） |
|---|---|---|
| 端点 | 一个 URL，通常是 `/mcp`（POST，外加可选的 GET 流） | `GET /sse` 事件流 + `POST /messages/?session_id=…` |
| 规范中的地位 | 当前标准（自 2025-03-26 起） | 已废弃，仅为兼容保留 |
| 会话 | 可选的 `Mcp-Session-Id` 头；服务器也可以无状态 | 每条 SSE 连接对应一个会话 |
| 断线续传 | 支持（`Last-Event-ID`） | 不支持 |
| 代理 / Serverless | 普通请求-响应就能工作 | 需要长连接 |

服务器支持 Streamable HTTP 时优先用它；SSE 只留给只提供 SSE 的服务器。

## 在 MCP 应用里使用远程服务器

很多客户端可以直接填 URL，具体字段名各家略有不同。以 Cursor 的 `mcp.json` 为例：

```json
{
  "mcpServers": {
    "jieba": { "url": "http://127.0.0.1:8000/mcp" }
  }
}
```

## 常见问题

- **`405 Method Not Allowed` / `404`**：URL 和传输方式对不上。Streamable HTTP 一般在 `/mcp`，SSE 一般在 `/sse`。
- **出现重定向，或返回 HTML 而不是 JSON**：URL 指向了别的服务，比如同一端口上另一个应用的登录页。
- **报 `ERR_MODULE_NOT_FOUND`（找不到 `dist/...`）**：先运行 `npm run build`。
- **SDK 版本太旧**：这些示例需要 `@modelcontextprotocol/sdk` 1.24 或更新版本，已在 1.24.0 和 1.32.2 上测试通过。

## 冒烟测试

```bash
npm run build && npm run smoke                       # uses `uvx jieba-mcp`
JIEBA_MCP_CMD=jieba-mcp npm run smoke                # if it is already installed
```

## 许可证

MIT，见 [LICENSE](LICENSE)。作者：**Feng Rongquan**，[BACH-AI-Tools](https://github.com/BACH-AI-Tools)。

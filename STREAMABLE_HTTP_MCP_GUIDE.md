# StreamableHTTP MCP 客户端使用指南 (TypeScript)

[![GitHub](https://img.shields.io/badge/GitHub-BACH--AI--Tools-blue?logo=github)](https://github.com/BACH-AI-Tools/typescript-sse-mcp-client)

## 🎯 什么是 StreamableHTTP MCP？

StreamableHTTP 是 MCP 协议的一种传输方式，通过 HTTP 协议连接**远程** MCP 服务器，支持流式响应和 Server-Sent Events (SSE)。

### StreamableHTTP vs SSE

| 特性 | StreamableHTTP | SSE |
|------|----------------|-----|
| 传输协议 | HTTP + SSE | 纯 SSE |
| 双向通信 | ✅ 支持 | ✅ 支持 |
| 流式响应 | ✅ 支持 | ✅ 支持 |
| 适用场景 | 复杂交互，大数据传输 | 简单事件流 |
| SDK 支持 | StreamableHTTPClientTransport | SSEClientTransport |

## 🚀 基础用法

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// 创建 StreamableHTTP 传输层
const transport = new StreamableHTTPClientTransport(
  new URL("http://example.com/mcp"),
  {
    requestInit: {
      headers: {
        Authorization: "Bearer TOKEN",
      },
    },
  }
);

// 创建客户端
const client = new Client({
  name: "my-client",
  version: "1.0.0",
});

// 连接
await client.connect(transport);

// 列出工具
const tools = await client.listTools();

// 调用工具
const result = await client.callTool({
  name: "tool_name",
  arguments: {},
});

console.log(result.content[0].text);

// 关闭连接
await client.close();
```

## 📋 FDA StreamableHTTP 示例配置

```typescript
const serverUrl = "http://fda.sitmcp.kaleido.guru/mcp";
const headers = {
  "emcp-key": "OoNkO7VC0LI0kJHjviZAwHbLaKg1LYhc",
  "emcp-usercode": "kBGM7xIY",
};
```

### Cursor/Cherry Studio 配置

```json
{
  "mcpServers": {
    "fda": {
      "url": "http://fda.sitmcp.kaleido.guru/mcp",
      "headers": {
        "emcp-key": "OoNkO7VC0LI0kJHjviZAwHbLaKg1LYhc",
        "emcp-usercode": "kBGM7xIY"
      },
      "type": "streamableHttp"
    }
  }
}
```

## 🔧 FDA OpenFDA 可用工具

### 1. search_drug_labels - 搜索药品标签

```typescript
const result = await client.callTool({
  name: "search_drug_labels",
  arguments: {
    search: "ibuprofen", // 药品名、成分、制造商等
    limit: 10, // 返回数量（1-1000）
  },
});
```

### 2. get_drug_adverse_reactions - 查询不良反应

```typescript
const result = await client.callTool({
  name: "get_drug_adverse_reactions",
  arguments: {
    drug_name: "aspirin", // 必填
    limit: 5,
  },
});
```

### 3. get_drug_warnings - 查询警告信息

```typescript
const result = await client.callTool({
  name: "get_drug_warnings",
  arguments: {
    drug_name: "acetaminophen", // 必填
    limit: 3,
  },
});
```

### 4. ae_pipeline_rag - RAG 安全分析

```typescript
const result = await client.callTool({
  name: "ae_pipeline_rag",
  arguments: {
    query: "cardiovascular side effects",
    drug: "ibuprofen",
    top_k: 5,
  },
});
```

### 5. get_drug_indications - 查询适应症

```typescript
const result = await client.callTool({
  name: "get_drug_indications",
  arguments: {
    drug_name: "naproxen", // 必填
    limit: 5,
  },
});
```

## 💡 实用示例

### 带服务器就绪检查的连接

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function connectWithRetry(
  serverUrl: string,
  headers: Record<string, string>,
  maxRetries = 3
): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
    requestInit: {
      headers,
    },
  });

  const client = new Client({
    name: "streamable-client",
    version: "1.0.0",
  });

  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.connect(transport);
      
      // 等待服务器完全就绪
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      // 测试连接
      await client.listTools();
      
      return client;
    } catch (error) {
      console.log(`连接尝试 ${i + 1} 失败，重试中...`);
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  throw new Error("无法连接到服务器");
}

// 使用
const client = await connectWithRetry(
  "http://fda.sitmcp.kaleido.guru/mcp",
  {
    "emcp-key": "OoNkO7VC0LI0kJHjviZAwHbLaKg1LYhc",
    "emcp-usercode": "kBGM7xIY",
  }
);
```

### 查询单个药品详细信息

```typescript
async function getDrugDetails(drugName: string): Promise<any> {
  const serverUrl = "http://fda.sitmcp.kaleido.guru/mcp";
  const headers = {
    "emcp-key": "OoNkO7VC0LI0kJHjviZAwHbLaKg1LYhc",
    "emcp-usercode": "kBGM7xIY",
  };

  const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
    requestInit: { headers },
  });

  const client = new Client({
    name: "drug-details",
    version: "1.0.0",
  });

  await client.connect(transport);
  
  // 等待服务器就绪
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 获取基本信息
  const searchResult = await client.callTool({
    name: "search_drug_labels",
    arguments: {
      search: drugName,
      limit: 1,
    },
  });

  // 获取不良反应
  const adverseResult = await client.callTool({
    name: "get_drug_adverse_reactions",
    arguments: {
      drug_name: drugName,
      limit: 5,
    },
  });

  // 获取警告信息
  const warningsResult = await client.callTool({
    name: "get_drug_warnings",
    arguments: {
      drug_name: drugName,
      limit: 5,
    },
  });

  await client.close();

  return {
    basic: JSON.parse(searchResult.content[0].text),
    adverse_reactions: JSON.parse(adverseResult.content[0].text),
    warnings: JSON.parse(warningsResult.content[0].text),
  };
}

// 运行
const details = await getDrugDetails("aspirin");
console.log(JSON.stringify(details, null, 2));
```

### 批量药品对比分析

```typescript
async function compareDrugs(drugs: string[]): Promise<Map<string, any>> {
  const serverUrl = "http://fda.sitmcp.kaleido.guru/mcp";
  const headers = {
    "emcp-key": "OoNkO7VC0LI0kJHjviZAwHbLaKg1LYhc",
    "emcp-usercode": "kBGM7xIY",
  };

  const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
    requestInit: { headers },
  });

  const client = new Client({
    name: "drug-comparison",
    version: "1.0.0",
  });

  await client.connect(transport);
  
  // 等待服务器就绪
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const comparison = new Map<string, any>();

  for (const drug of drugs) {
    const [indications, warnings, adverse] = await Promise.all([
      client.callTool({
        name: "get_drug_indications",
        arguments: { drug_name: drug, limit: 3 },
      }),
      client.callTool({
        name: "get_drug_warnings",
        arguments: { drug_name: drug, limit: 3 },
      }),
      client.callTool({
        name: "get_drug_adverse_reactions",
        arguments: { drug_name: drug, limit: 3 },
      }),
    ]);

    comparison.set(drug, {
      indications: JSON.parse(indications.content[0].text),
      warnings: JSON.parse(warnings.content[0].text),
      adverse_reactions: JSON.parse(adverse.content[0].text),
    });
  }

  await client.close();

  return comparison;
}

// 运行
const drugs = ["aspirin", "ibuprofen", "naproxen"];
const comparison = await compareDrugs(drugs);
comparison.forEach((data, drug) => {
  console.log(`\n=== ${drug.toUpperCase()} ===`);
  console.log(JSON.stringify(data, null, 2));
});
```

### 药品安全智能分析（使用 RAG）

```typescript
async function analyzeDrugSafety(
  drugName: string,
  patientCondition?: string,
  specificConcern?: string
): Promise<string> {
  const serverUrl = "http://fda.sitmcp.kaleido.guru/mcp";
  const headers = {
    "emcp-key": "OoNkO7VC0LI0kJHjviZAwHbLaKg1LYhc",
    "emcp-usercode": "kBGM7xIY",
  };

  const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
    requestInit: { headers },
  });

  const client = new Client({
    name: "safety-analyzer",
    version: "1.0.0",
  });

  await client.connect(transport);
  
  // 等待服务器就绪
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 构建查询
  let query = specificConcern || "general safety profile";
  if (patientCondition) {
    query += ` for patients with ${patientCondition}`;
  }

  const result = await client.callTool({
    name: "ae_pipeline_rag",
    arguments: {
      drug: drugName,
      query: query,
      condition: patientCondition,
      top_k: 10,
    },
  });

  await client.close();

  return result.content[0].text;
}

// 运行示例
const analysis = await analyzeDrugSafety(
  "ibuprofen",
  "hypertension",
  "cardiovascular risks and kidney function"
);
console.log("安全分析结果:");
console.log(analysis);
```

## 📘 TypeScript 类型支持

### 工具调用结果类型

```typescript
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

interface TextContent {
  type: "text";
  text: string;
}

interface ImageContent {
  type: "image";
  data: string;
  mimeType: string;
}

type Content = TextContent | ImageContent;

const result: CallToolResult = await client.callTool({
  name: "search_drug_labels",
  arguments: { search: "aspirin", limit: 5 },
});

// 类型安全的内容处理
for (const content of result.content) {
  if (content.type === "text") {
    const textContent = content as TextContent;
    console.log(textContent.text);
  }
}
```

### 自定义 FDA 数据类型

```typescript
interface FDADrugLabel {
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
    product_type?: string[];
    route?: string[];
    substance_name?: string[];
  };
  indications_and_usage?: string[];
  contraindications?: string[];
  warnings_and_cautions?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  overdosage?: string[];
  dosage_and_administration?: string[];
  how_supplied?: string[];
  package_label_principal_display_panel?: string[];
}

interface FDASearchResponse {
  meta?: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: FDADrugLabel[];
  results_count: number;
}

// 使用类型
const result = await client.callTool({
  name: "search_drug_labels",
  arguments: { search: "aspirin", limit: 1 },
});

const data: FDASearchResponse = JSON.parse(result.content[0].text);
console.log(`找到 ${data.meta?.results.total} 条记录`);
```

## ❓ 常见问题

### 服务器启动错误："Server is starting up, please wait"

```typescript
// 解决方案：在连接后添加延迟
await client.connect(transport);
console.log("等待服务器完全就绪...");
await new Promise((resolve) => setTimeout(resolve, 3000));
// 现在可以安全地调用工具了
```

### 如何处理 StreamableHTTP 特定错误？

```typescript
try {
  const result = await client.callTool({
    name: "tool_name",
    arguments: {},
  });
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes("HTTP 500")) {
      console.error("服务器内部错误，请稍后重试");
    } else if (error.message.includes("HTTP 406")) {
      console.error("请求头缺少必要的 Accept 类型");
    } else if (error.message.includes("ECONNREFUSED")) {
      console.error("无法连接到服务器");
    } else {
      console.error(`错误: ${error.message}`);
    }
  }
}
```

### StreamableHTTP vs SSE：如何选择？

```typescript
// StreamableHTTP - 适合复杂交互
const streamableTransport = new StreamableHTTPClientTransport(
  new URL("http://example.com/mcp"),
  { requestInit: { headers } }
);

// SSE - 适合简单事件流
const sseTransport = new SSEClientTransport(
  new URL("http://example.com/sse"),
  { headers }
);

// 两者的客户端使用方式相同
const client = new Client({ name: "client", version: "1.0.0" });
await client.connect(transport); // transport 可以是任一种
```

### 如何设置请求超时？

```typescript
// 使用 AbortController 实现超时
async function callToolWithTimeout(
  client: Client,
  toolName: string,
  args: any,
  timeoutMs = 30000
): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
```

### 如何处理大量数据的分页？

```typescript
async function getAllDrugLabels(
  searchTerm: string,
  pageSize = 100
): Promise<any[]> {
  const client = await connectToFDA(); // 假设已定义连接函数
  const allResults: any[] = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await client.callTool({
      name: "search_drug_labels",
      arguments: {
        search: searchTerm,
        skip: skip,
        limit: pageSize,
      },
    });

    const data = JSON.parse(result.content[0].text);
    allResults.push(...data.results);

    // 检查是否还有更多数据
    const total = data.meta?.results.total || 0;
    skip += pageSize;
    hasMore = skip < total && data.results.length === pageSize;
  }

  await client.close();
  return allResults;
}
```

### 如何实现连接池？

```typescript
class StreamableHTTPConnectionPool {
  private pool: Client[] = [];
  private available: Client[] = [];
  private config: { url: string; headers: Record<string, string> };

  constructor(
    config: { url: string; headers: Record<string, string> },
    poolSize = 3
  ) {
    this.config = config;
    this.initPool(poolSize);
  }

  private async initPool(size: number) {
    for (let i = 0; i < size; i++) {
      const transport = new StreamableHTTPClientTransport(
        new URL(this.config.url),
        { requestInit: { headers: this.config.headers } }
      );
      
      const client = new Client({
        name: `pool-client-${i}`,
        version: "1.0.0",
      });
      
      await client.connect(transport);
      this.pool.push(client);
      this.available.push(client);
    }
  }

  async getClient(): Promise<Client> {
    while (this.available.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return this.available.pop()!;
  }

  releaseClient(client: Client) {
    this.available.push(client);
  }

  async closeAll() {
    await Promise.all(this.pool.map((client) => client.close()));
  }
}

// 使用连接池
const pool = new StreamableHTTPConnectionPool(
  {
    url: "http://fda.sitmcp.kaleido.guru/mcp",
    headers: {
      "emcp-key": "OoNkO7VC0LI0kJHjviZAwHbLaKg1LYhc",
      "emcp-usercode": "kBGM7xIY",
    },
  },
  5
);

const client = await pool.getClient();
try {
  const result = await client.callTool(/* ... */);
  // 处理结果
} finally {
  pool.releaseClient(client);
}
```

## 📚 完整示例文件

- **src/streamable-http-demo.ts** - StreamableHTTP 连接和测试
- **src/sse-client-example.ts** - SSE 连接示例（对比）
- **src/openfda-demo.ts** - 实用查询示例

```bash
# 编译并运行示例
npm run build
npm run streamable    # 运行 StreamableHTTP 示例
npm start            # 运行 SSE 示例
npm run demo         # 运行 OpenFDA 查询示例
```

## 🔗 相关链接

- [本项目 GitHub 仓库](https://github.com/BACH-AI-Tools/typescript-sse-mcp-client)
- [Python StreamableHTTP 版本](https://github.com/BACH-AI-Tools/python-streamablehttp-mcp-client)
- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [FDA OpenAPI 文档](https://open.fda.gov/apis/)
- [BACH AI Tools 组织](https://github.com/BACH-AI-Tools)

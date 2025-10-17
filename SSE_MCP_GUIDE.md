# SSE MCP 客户端使用指南 (TypeScript)

[![GitHub](https://img.shields.io/badge/GitHub-BACH--AI--Tools-blue?logo=github)](https://github.com/BACH-AI-Tools/typescript-sse-mcp-client)

## 🎯 什么是 SSE MCP？

通过 HTTP/SSE 协议连接**远程** MCP 服务器（而不是本地进程）。

## 🚀 基础用法

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// 创建 SSE 传输层
const transport = new SSEClientTransport(new URL("http://example.com/sse"), {
  headers: {
    Authorization: "Bearer TOKEN",
  },
});

// 创建客户端
const client = new Client(
  {
    name: "my-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

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

## 📋 OpenFDA 示例配置

```typescript
const serverUrl = "http://openfda.mcp.kaleido.guru/sse";
const headers = {
  "emcp-key": "DGBBWP0neHpDf8MH5l6QIVeRpmBOkZB1",
  "emcp-usercode": "2DebiJQI",
};
```

### Cursor/Claude Desktop 配置

```json
{
  "mcpServers": {
    "openfda": {
      "url": "http://openfda.mcp.kaleido.guru/sse",
      "headers": {
        "emcp-key": "DGBBWP0neHpDf8MH5l6QIVeRpmBOkZB1",
        "emcp-usercode": "2DebiJQI"
      },
      "type": "sse"
    }
  }
}
```

## 🔧 OpenFDA 可用工具

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

### 查询单个药品

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function searchDrug(drugName: string): Promise<any> {
  const serverUrl = "http://openfda.mcp.kaleido.guru/sse";
  const headers = {
    "emcp-key": "DGBBWP0neHpDf8MH5l6QIVeRpmBOkZB1",
    "emcp-usercode": "2DebiJQI",
  };

  const transport = new SSEClientTransport(new URL(serverUrl), {
    headers,
  });

  const client = new Client(
    {
      name: "drug-search",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  const result = await client.callTool({
    name: "search_drug_labels",
    arguments: {
      search: drugName,
      limit: 1,
    },
  });

  const data = JSON.parse(result.content[0].text);

  await client.close();

  return data;
}

// 运行
const data = await searchDrug("aspirin");
console.log(data);
```

### 批量查询多个药品

```typescript
async function batchQuery(drugs: string[]): Promise<Record<string, any>> {
  const serverUrl = "http://openfda.mcp.kaleido.guru/sse";
  const headers = {
    "emcp-key": "DGBBWP0neHpDf8MH5l6QIVeRpmBOkZB1",
    "emcp-usercode": "2DebiJQI",
  };

  const transport = new SSEClientTransport(new URL(serverUrl), {
    headers,
  });

  const client = new Client(
    {
      name: "batch-query",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  const results: Record<string, any> = {};

  for (const drug of drugs) {
    const result = await client.callTool({
      name: "search_drug_labels",
      arguments: {
        search: drug,
        limit: 1,
      },
    });
    results[drug] = JSON.parse(result.content[0].text);
  }

  await client.close();

  return results;
}

// 运行
const drugs = ["aspirin", "ibuprofen", "naproxen"];
const results = await batchQuery(drugs);
console.log(results);
```

### 药品安全分析

```typescript
async function analyzeDrugSafety(
  drugName: string,
  concern: string
): Promise<string> {
  const serverUrl = "http://openfda.mcp.kaleido.guru/sse";
  const headers = {
    "emcp-key": "DGBBWP0neHpDf8MH5l6QIVeRpmBOkZB1",
    "emcp-usercode": "2DebiJQI",
  };

  const transport = new SSEClientTransport(new URL(serverUrl), {
    headers,
  });

  const client = new Client(
    {
      name: "safety-analysis",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  const result = await client.callTool({
    name: "ae_pipeline_rag",
    arguments: {
      query: concern,
      drug: drugName,
      top_k: 5,
    },
  });

  const analysis = result.content[0].text;

  await client.close();

  return analysis;
}

// 运行
const analysis = await analyzeDrugSafety("ibuprofen", "cardiovascular risks");
console.log(analysis);
```

## 📘 TypeScript 类型支持

### 工具调用结果类型

```typescript
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const result: CallToolResult = await client.callTool({
  name: "search_drug_labels",
  arguments: {
    search: "aspirin",
    limit: 5,
  },
});

// result.content 是一个数组
for (const content of result.content) {
  if (content.type === "text") {
    console.log(content.text);
  }
}
```

### 自定义类型定义

```typescript
interface DrugSearchResult {
  results: Array<{
    openfda?: {
      brand_name?: string[];
      generic_name?: string[];
      manufacturer_name?: string[];
    };
    indications_and_usage?: string[];
    adverse_reactions?: string[];
    warnings?: string[];
  }>;
  meta?: {
    results: {
      total: number;
    };
  };
}

// 使用类型
const result = await client.callTool({
  name: "search_drug_labels",
  arguments: { search: "aspirin", limit: 1 },
});

const data: DrugSearchResult = JSON.parse(result.content[0].text);
```

## ❓ 常见问题

### 如何处理错误？

```typescript
try {
  const result = await client.callTool({
    name: "unknown_tool",
    arguments: {},
  });
} catch (error) {
  if (error instanceof Error) {
    console.error(`错误: ${error.name}: ${error.message}`);
  } else {
    console.error(`未知错误: ${error}`);
  }
}
```

### 如何添加自定义 Headers？

```typescript
const headers = {
  Authorization: "Bearer TOKEN",
  "Custom-Header": "value",
  "emcp-key": "your-key",
};

const transport = new SSEClientTransport(new URL(serverUrl), {
  headers,
});
```

### 如何设置超时？

```typescript
// SSEClientTransport 支持在 fetch 选项中设置超时
const transport = new SSEClientTransport(new URL(serverUrl), {
  headers,
  // 注意：超时需要通过 AbortController 实现
});

// 使用 AbortController 设置超时
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000); // 10秒超时

try {
  await client.connect(transport);
  // ... 进行操作
} finally {
  clearTimeout(timeout);
}
```

### 如何分页查询大量数据？

```typescript
// 分页获取数据
for (let page = 0; page < 100; page += 10) {
  const result = await client.callTool({
    name: "search_drug_labels",
    arguments: {
      search: "aspirin",
      skip: page, // 跳过前 N 条
      limit: 10, // 每页 10 条
    },
  });
  // 处理结果...
}
```

### 如何正确关闭连接？

```typescript
// 使用 try-finally 确保关闭
const client = new Client(/* ... */);

try {
  await client.connect(transport);
  // ... 进行操作
} finally {
  await client.close();
}
```

## 📚 完整示例文件

- **src/sse-client-example.ts** - 基础连接和测试
- **src/openfda-demo.ts** - 实用查询示例

```bash
# 编译并运行示例
npm run build
npm start       # 运行基础示例
npm run demo    # 运行 OpenFDA 查询示例
```

## 🔗 相关链接

- [本项目 GitHub 仓库](https://github.com/BACH-AI-Tools/typescript-sse-mcp-client)
- [Python 版本](https://github.com/BACH-AI-Tools/python-sse-mcp-client)
- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [BACH AI Tools 组织](https://github.com/BACH-AI-Tools)


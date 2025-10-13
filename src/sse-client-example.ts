/**
 * SSE MCP 客户端示例
 *
 * 演示如何使用 TypeScript 连接 SSE 类型的 MCP 服务器（通过 HTTP）
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

/**
 * 连接 OpenFDA MCP 服务器
 */
async function connectOpenFdaMcp(): Promise<void> {
  // OpenFDA MCP 服务器配置
  const serverUrl = "http://openfda.mcp.kaleido.guru/sse";
  const headers = {
    "emcp-key": "DGBBWP0neHpDf8MH5l6QIVeRpmBOkZB1",
    "emcp-usercode": "2DebiJQI",
  };

  console.log("🌐 SSE MCP 客户端示例");
  console.log("=".repeat(60));
  console.log(`📡 正在连接到: ${serverUrl}`);
  console.log();

  try {
    // 创建 SSE 传输层
    const transport = new SSEClientTransport(new URL(serverUrl), {
      headers,
    });

    // 创建 MCP 客户端
    const client = new Client(
      {
        name: "sse-client-example",
        version: "0.1.0",
      },
      {
        capabilities: {},
      }
    );

    // 连接到服务器
    await client.connect(transport);
    console.log("✅ 已连接到 OpenFDA MCP 服务器\n");

    // ==========================================
    // 1. 获取服务器信息
    // ==========================================
    console.log("📋 服务器信息:");
    const serverInfo = client.getServerVersion();
    if (serverInfo) {
      console.log(`   服务器名称: ${serverInfo.name}`);
      console.log(`   服务器版本: ${serverInfo.version}`);
    }
    console.log();

    // ==========================================
    // 2. 列出可用的工具
    // ==========================================
    console.log("🔧 可用工具列表:");
    const toolsList = await client.listTools();

    if (toolsList.tools && toolsList.tools.length > 0) {
      toolsList.tools.forEach((tool, index) => {
        console.log(`\n${index + 1}. ${tool.name}`);
        if (tool.description) {
          console.log(`   描述: ${tool.description}`);
        }
        if (tool.inputSchema && typeof tool.inputSchema === "object") {
          const schema = tool.inputSchema as any;
          if (schema.properties) {
            console.log(`   参数:`);
            for (const [paramName, paramInfo] of Object.entries(
              schema.properties
            )) {
              const info = paramInfo as any;
              const paramType = info.type || "unknown";
              const paramDesc = info.description || "";
              const required = schema.required?.includes(paramName);
              const reqMark = required ? " (必填)" : " (可选)";
              console.log(`     • ${paramName}: ${paramType}${reqMark}`);
              if (paramDesc) {
                console.log(`       ${paramDesc}`);
              }
            }
          }
        }
      });
    } else {
      console.log("   (没有可用工具)");
    }

    console.log();

    // ==========================================
    // 3. 列出可用的资源（如果服务器支持）
    // ==========================================
    console.log("📦 可用资源列表:");
    try {
      const resourcesList = await client.listResources();

      if (resourcesList.resources && resourcesList.resources.length > 0) {
        resourcesList.resources.forEach((resource, index) => {
          console.log(`   ${index + 1}. ${resource.uri}`);
          if (resource.name) {
            console.log(`      名称: ${resource.name}`);
          }
          if (resource.description) {
            console.log(`      描述: ${resource.description}`);
          }
        });
      } else {
        console.log("   (没有可用资源)");
      }
    } catch (error) {
      console.log(`   (服务器不支持资源功能: ${error})`);
    }

    console.log();

    // ==========================================
    // 4. 列出可用的提示词（如果服务器支持）
    // ==========================================
    console.log("💬 可用提示词列表:");
    try {
      const promptsList = await client.listPrompts();

      if (promptsList.prompts && promptsList.prompts.length > 0) {
        promptsList.prompts.forEach((prompt, index) => {
          console.log(`   ${index + 1}. ${prompt.name}`);
          if (prompt.description) {
            console.log(`      描述: ${prompt.description}`);
          }
        });
      } else {
        console.log("   (没有可用提示词)");
      }
    } catch (error) {
      console.log(`   (服务器不支持提示词功能: ${error})`);
    }

    console.log();

    // ==========================================
    // 5. 演示调用工具：搜索阿司匹林的药品标签
    // ==========================================
    if (toolsList.tools && toolsList.tools.length > 0) {
      console.log("🎯 演示：调用工具搜索阿司匹林（aspirin）");
      console.log();

      try {
        // 调用 search_drug_labels 工具
        const result = await client.callTool({
          name: "search_drug_labels",
          arguments: {
            search: "aspirin",
            limit: 2,
          },
        });

        console.log("   ✅ 调用成功！");
        console.log("   结果:");
        if (result.content && result.content.length > 0) {
          for (const content of result.content) {
            if (content.type === "text") {
              const text = content.text;
              // 截取前 500 字符，避免输出太长
              if (text.length > 500) {
                console.log(`   ${text.slice(0, 500)}...`);
                console.log(
                  `   (结果太长，已截断。完整结果有 ${text.length} 字符)`
                );
              } else {
                console.log(`   ${text}`);
              }
            }
          }
        }
        console.log();
      } catch (error) {
        console.log(`   ❌ 工具调用失败: ${error}`);
        console.log();
      }
    }

    console.log("✨ 连接测试完成！");

    // 关闭连接
    await client.close();
  } catch (error) {
    console.log(
      `\n❌ 连接失败: ${error instanceof Error ? error.name : "Unknown"}`
    );
    console.log(
      `   错误信息: ${error instanceof Error ? error.message : String(error)}`
    );
    if (error instanceof Error && error.stack) {
      console.log(`   堆栈追踪: ${error.stack}`);
    }
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    await connectOpenFdaMcp();
  } catch (error) {
    console.error(`\n\n❌ 错误: ${error}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 运行主函数
main().catch((error) => {
  console.error("未捕获的错误:", error);
  process.exit(1);
});

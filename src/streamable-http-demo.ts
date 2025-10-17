/**
 * StreamableHTTP MCP 客户端示例
 *
 * 演示如何使用 TypeScript 连接 StreamableHTTP 类型的 MCP 服务器
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * 连接 FDA StreamableHTTP MCP 服务器
 */
async function connectFdaStreamableHttp(): Promise<void> {
  // FDA StreamableHTTP MCP 服务器配置
  // 来自用户提供的配置
  const serverConfig = {
    url: "http://fda.sitmcp.kaleido.guru/mcp",
    headers: {
      "emcp-key": "OoNkO7VC0LI0kJHjviZAwHbLaKg1LYhc",
      "emcp-usercode": "kBGM7xIY",
    },
    type: "streamableHttp",
  };

  const serverUrl = serverConfig.url;
  const headers = serverConfig.headers;

  console.log("🌐 StreamableHTTP MCP 客户端示例");
  console.log("=".repeat(60));
  console.log(`📡 服务器类型: ${serverConfig.type}`);
  console.log(`📍 服务器 URL: ${serverUrl}`);
  console.log(
    `🔑 认证头: emcp-key=***${headers["emcp-key"].slice(-4)}, emcp-usercode=${
      headers["emcp-usercode"]
    }`
  );
  console.log();

  try {
    // 创建 StreamableHTTP 传输层
    const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
      requestInit: {
        headers,
      },
    });

    // 创建 MCP 客户端
    const client = new Client({
      name: "streamable-http-client-example",
      version: "0.1.0",
    });

    console.log("🚀 正在初始化会话...");
    // 连接到服务器
    await client.connect(transport);
    console.log("✅ 已成功连接到 FDA MCP 服务器！\n");

    // 等待服务器完全就绪
    console.log("⏳ 等待服务器完全就绪...");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    console.log("✅ 服务器已就绪\n");

    // ==========================================
    // 1. 获取服务器信息
    // ==========================================
    console.log("📋 服务器信息:");
    const serverInfo = client.getServerVersion();
    if (serverInfo) {
      console.log(`   服务器名称: ${serverInfo.name}`);
      console.log(`   服务器版本: ${serverInfo.version}`);
      console.log(`   协议版本: ${serverInfo.protocolVersion || "未知"}`);
    }

    // 获取服务器能力
    const capabilities = client.getServerCapabilities();
    if (capabilities) {
      console.log("\n📊 服务器能力:");
      if (capabilities.tools) {
        console.log("   ✓ 工具支持");
      }
      if (capabilities.resources) {
        console.log("   ✓ 资源支持");
      }
      if (capabilities.prompts) {
        console.log("   ✓ 提示词支持");
      }
      if (capabilities.logging) {
        console.log("   ✓ 日志支持");
      }
    }
    console.log();

    // ==========================================
    // 2. 列出可用的工具
    // ==========================================
    console.log("🔧 可用工具列表:");
    console.log("-".repeat(40));
    const toolsList = await client.listTools();

    if (toolsList.tools && toolsList.tools.length > 0) {
      toolsList.tools.forEach((tool, index) => {
        console.log(`\n${index + 1}. 工具名称: ${tool.name}`);
        if (tool.description) {
          // 处理多行描述
          const descLines = tool.description.split("\n");
          console.log(`   描述: ${descLines[0]}`);
          descLines.slice(1).forEach((line) => {
            if (line.trim()) {
              console.log(`        ${line}`);
            }
          });
        }

        // 显示参数信息
        if (tool.inputSchema && typeof tool.inputSchema === "object") {
          const schema = tool.inputSchema as any;
          if (schema.properties) {
            console.log("   参数:");
            for (const [paramName, paramInfo] of Object.entries(
              schema.properties
            )) {
              const info = paramInfo as any;
              const paramType = info.type || "unknown";
              const paramDesc = info.description || "";
              const required = schema.required?.includes(paramName);
              const reqMark = required ? " [必填]" : " [可选]";

              console.log(`     • ${paramName} (${paramType})${reqMark}`);
              if (paramDesc) {
                // 处理多行参数描述
                const descLines = paramDesc.split("\n");
                descLines.forEach((line: string) => {
                  if (line.trim()) {
                    console.log(`       ${line}`);
                  }
                });
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
    // 3. 列出可用的资源（如果支持）
    // ==========================================
    console.log("📦 可用资源列表:");
    console.log("-".repeat(40));
    try {
      const resourcesList = await client.listResources();

      if (resourcesList.resources && resourcesList.resources.length > 0) {
        resourcesList.resources.forEach((resource, index) => {
          console.log(`${index + 1}. URI: ${resource.uri}`);
          if (resource.name) {
            console.log(`   名称: ${resource.name}`);
          }
          if (resource.description) {
            console.log(`   描述: ${resource.description}`);
          }
          if (resource.mimeType) {
            console.log(`   MIME类型: ${resource.mimeType}`);
          }
        });
      } else {
        console.log("   (没有可用资源)");
      }
    } catch (error) {
      console.log(`   (服务器不支持资源功能或访问失败: ${error})`);
    }

    console.log();

    // ==========================================
    // 4. 列出可用的提示词（如果支持）
    // ==========================================
    console.log("💬 可用提示词列表:");
    console.log("-".repeat(40));
    try {
      const promptsList = await client.listPrompts();

      if (promptsList.prompts && promptsList.prompts.length > 0) {
        promptsList.prompts.forEach((prompt, index) => {
          console.log(`${index + 1}. 名称: ${prompt.name}`);
          if (prompt.description) {
            console.log(`   描述: ${prompt.description}`);
          }
          if (prompt.arguments && prompt.arguments.length > 0) {
            console.log("   参数:");
            prompt.arguments.forEach((arg: any) => {
              const reqMark = arg.required ? " [必填]" : " [可选]";
              console.log(`     • ${arg.name}${reqMark}`);
              if (arg.description) {
                console.log(`       ${arg.description}`);
              }
            });
          }
        });
      } else {
        console.log("   (没有可用提示词)");
      }
    } catch (error) {
      console.log(`   (服务器不支持提示词功能或访问失败: ${error})`);
    }

    console.log();

    // ==========================================
    // 5. 演示调用工具（如果有可用工具）
    // ==========================================
    if (toolsList.tools && toolsList.tools.length > 0) {
      console.log("🎯 演示：调用第一个可用工具");
      console.log("-".repeat(40));

      // 选择第一个工具进行演示
      const firstTool = toolsList.tools[0];
      console.log(`将演示调用工具: ${firstTool.name}`);

      // 构造示例参数
      let demoArgs: Record<string, any> = {};
      if (firstTool.inputSchema && typeof firstTool.inputSchema === "object") {
        const schema = firstTool.inputSchema as any;
        if (schema.properties) {
          // 根据工具名称提供合适的参数
          if (firstTool.name === "search_drug_labels") {
            // 只提供必要的参数，避免 count 和 skip 冲突
            demoArgs = {
              search: "aspirin",
              limit: 3,
            };
          } else if (
            [
              "get_drug_adverse_reactions",
              "get_drug_warnings",
              "get_drug_indications",
            ].includes(firstTool.name)
          ) {
            // 这些工具需要 drug_name 参数
            demoArgs = {
              drug_name: "aspirin",
              limit: 2,
            };
          } else if (firstTool.name === "ae_pipeline_rag") {
            // RAG 工具的参数
            demoArgs = {
              drug: "aspirin",
              query: "What are the main side effects?",
              top_k: 3,
            };
          } else {
            // 通用参数生成逻辑（只为必填参数提供值）
            const requiredParams = schema.required || [];
            for (const paramName of requiredParams) {
              const paramInfo = schema.properties[paramName] || {};
              const paramType = paramInfo.type || "string";

              if (
                paramName.toLowerCase().includes("search") ||
                paramName.toLowerCase().includes("query")
              ) {
                demoArgs[paramName] = "aspirin";
              } else if (
                paramName.toLowerCase().includes("drug") ||
                paramName.toLowerCase().includes("name")
              ) {
                demoArgs[paramName] = "aspirin";
              } else if (paramName.toLowerCase().includes("limit")) {
                demoArgs[paramName] = 3;
              } else if (paramType === "string") {
                demoArgs[paramName] = "示例文本";
              } else if (paramType === "number" || paramType === "integer") {
                demoArgs[paramName] = 1;
              } else if (paramType === "boolean") {
                demoArgs[paramName] = true;
              }
            }
          }
        }
      }

      console.log(`调用参数: ${JSON.stringify(demoArgs, null, 2)}`);
      console.log();

      try {
        // 调用工具
        console.log("⏳ 正在调用工具...");
        const result = await client.callTool({
          name: firstTool.name,
          arguments: demoArgs,
        });

        console.log("✅ 工具调用成功！");
        console.log("\n📄 返回结果:");

        // 处理返回结果
        if (result.content && Array.isArray(result.content)) {
          result.content.forEach((content: any, idx: number) => {
            if (content.type === "text" && content.text) {
              const text = content.text;
              // 尝试解析为 JSON 以美化显示
              try {
                const jsonData = JSON.parse(text);
                console.log(`\n内容 ${idx + 1} (JSON):`);
                const jsonStr = JSON.stringify(jsonData, null, 2);
                if (jsonStr.length > 1000) {
                  console.log(jsonStr.slice(0, 1000));
                  console.log("... (结果已截断)");
                } else {
                  console.log(jsonStr);
                }
              } catch {
                // 非 JSON 格式，直接显示文本
                console.log(`\n内容 ${idx + 1} (文本):`);
                if (text.length > 500) {
                  console.log(text.slice(0, 500));
                  console.log(
                    `... (结果太长，已截断。完整结果有 ${text.length} 字符)`
                  );
                } else {
                  console.log(text);
                }
              }
            } else if (content.data) {
              console.log(`\n内容 ${idx + 1} (数据):`);
              console.log(content.data);
            }
          });
        } else {
          console.log("   (工具返回空结果)");
        }
      } catch (error) {
        console.log(`❌ 工具调用失败: ${error}`);
        if (error instanceof Error) {
          console.log("\n错误详情:");
          console.log(error.stack);
        }
      }
    }

    console.log();
    console.log("=".repeat(60));
    console.log("✨ StreamableHTTP MCP 连接测试完成！");
    console.log("   服务器连接正常，所有功能已测试。");

    // 关闭连接
    await client.close();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        console.log(`\n❌ 连接错误: ${error.message}`);
        console.log("   请检查:");
        console.log("   1. 服务器地址是否正确");
        console.log("   2. 网络连接是否正常");
        console.log("   3. 认证信息是否有效");
      } else if (error.message.includes("timeout")) {
        console.log(`\n⏱️ 连接超时: ${error.message}`);
        console.log("   服务器响应时间过长，请稍后重试");
      } else {
        console.log(`\n❌ 发生错误: ${error.name}`);
        console.log(`   错误信息: ${error.message}`);
        console.log("\n详细错误信息:");
        console.log(error.stack);
      }
    } else {
      console.log(`\n❌ 未知错误: ${error}`);
    }
  }
}

/**
 * 测试特定的工具调用
 * @internal
 */
async function _testSpecificTool(
  toolName: string,
  args: Record<string, any>
): Promise<void> {
  const serverConfig = {
    url: "http://fda.sitmcp.kaleido.guru/mcp",
    headers: {
      "emcp-key": "OoNkO7VC0LI0kJHjviZAwHbLaKg1LYhc",
      "emcp-usercode": "kBGM7xIY",
    },
  };

  console.log(`\n🔬 测试工具: ${toolName}`);
  console.log(`   参数: ${JSON.stringify(args, null, 2)}`);
  console.log();

  try {
    const transport = new StreamableHTTPClientTransport(
      new URL(serverConfig.url),
      {
        requestInit: {
          headers: serverConfig.headers,
        },
      }
    );

    const client = new Client({
      name: "test-client",
      version: "0.1.0",
    });

    await client.connect(transport);

    // 调用工具
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });

    console.log("✅ 调用成功！");
    if (result.content && Array.isArray(result.content)) {
      for (const content of result.content) {
        if ((content as any).type === "text" && (content as any).text) {
          const text = (content as any).text;
          console.log("\n返回内容:");
          if (text.length > 1000) {
            console.log(text.slice(0, 1000));
            console.log("... (已截断)");
          } else {
            console.log(text);
          }
        }
      }
    }

    await client.close();
  } catch (error) {
    console.log(`❌ 错误: ${error}`);
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("   StreamableHTTP MCP 客户端示例程序");
  console.log("   使用 FDA MCP 服务器");
  console.log("=".repeat(60) + "\n");

  try {
    // 运行主要的连接和测试
    await connectFdaStreamableHttp();

    // 可选：测试特定工具
    // 取消注释下面的代码来测试特定工具
    // await testSpecificTool("search_drug_labels", {
    //   search: "ibuprofen",
    //   limit: 2,
    // });
  } catch (error) {
    console.error(`\n\n❌ 程序错误: ${error}`);
    if (error instanceof Error) {
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

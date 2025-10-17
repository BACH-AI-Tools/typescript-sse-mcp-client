/**
 * OpenFDA MCP 服务器实用示例
 *
 * 展示如何使用 TypeScript 查询 OpenFDA 药品数据库
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

/**
 * 查询 OpenFDA 药品数据库
 */
async function queryOpenFda(): Promise<void> {
  // OpenFDA MCP 服务器配置
  const serverUrl = "http://openfda.mcp.kaleido.guru/sse";
  const headers = {
    "emcp-key": "DGBBWP0neHpDf8MH5l6QIVeRpmBOkZB1",
    "emcp-usercode": "2DebiJQI",
  };

  console.log("💊 OpenFDA 药品数据库查询示例");
  console.log("=".repeat(70));
  console.log();

  try {
    // 创建 SSE 传输层
    const transport = new SSEClientTransport(new URL(serverUrl), {
      requestInit: {
        headers,
      },
    });

    // 创建 MCP 客户端
    const client = new Client({
      name: "openfda-demo",
      version: "0.1.0",
    });

    // 连接到服务器
    await client.connect(transport);
    console.log("✅ 已连接到 OpenFDA MCP 服务器\n");

    // ==========================================
    // 示例 1: 搜索布洛芬（Ibuprofen）的药品标签
    // ==========================================
    console.log("📋 示例 1: 搜索布洛芬（Ibuprofen）的药品信息");
    console.log("-".repeat(70));

    try {
      const result = await client.callTool({
        name: "search_drug_labels",
        arguments: {
          search: "ibuprofen",
          limit: 1,
        },
      });

      const content = (
        result.content as Array<{ type: string; text?: string }>
      )[0];
      if (content && content.type === "text" && content.text) {
        const data = JSON.parse(content.text);
        if (data.results && data.results.length > 0) {
          const drug = data.results[0];

          console.log(`✅ 找到药品信息:`);

          // 品牌名
          if (drug.openfda?.brand_name) {
            console.log(
              `   品牌名: ${drug.openfda.brand_name.slice(0, 3).join(", ")}`
            );
          }

          // 通用名
          if (drug.openfda?.generic_name) {
            console.log(
              `   通用名: ${drug.openfda.generic_name.slice(0, 3).join(", ")}`
            );
          }

          // 制造商
          if (drug.openfda?.manufacturer_name) {
            console.log(
              `   制造商: ${drug.openfda.manufacturer_name
                .slice(0, 2)
                .join(", ")}`
            );
          }

          // 适应症（截取前200字）
          if (drug.indications_and_usage) {
            const indications = drug.indications_and_usage[0].slice(0, 200);
            console.log(`   适应症: ${indications}...`);
          }

          console.log();
        } else {
          console.log("   ❌ 未找到相关信息\n");
        }
      } else {
        console.log("   ❌ 未找到相关信息\n");
      }
    } catch (error) {
      console.log(`   ❌ 查询失败: ${error}\n`);
    }

    // ==========================================
    // 示例 2: 获取阿司匹林的不良反应
    // ==========================================
    console.log("⚠️  示例 2: 查询阿司匹林（Aspirin）的不良反应");
    console.log("-".repeat(70));

    try {
      const result = await client.callTool({
        name: "get_drug_adverse_reactions",
        arguments: {
          drug_name: "aspirin",
          limit: 1,
        },
      });

      const content = (
        result.content as Array<{ type: string; text?: string }>
      )[0];
      if (content && content.type === "text" && content.text) {
        const data = JSON.parse(content.text);
        if (data.results && data.results.length > 0) {
          const drug = data.results[0];

          if (drug.adverse_reactions) {
            const reactions = drug.adverse_reactions[0].slice(0, 300);
            console.log(`✅ 不良反应信息:`);
            console.log(`   ${reactions}...`);
            console.log();
          } else {
            console.log("   ℹ️  未找到不良反应信息\n");
          }
        } else {
          console.log("   ❌ 未找到相关信息\n");
        }
      } else {
        console.log("   ❌ 未找到相关信息\n");
      }
    } catch (error) {
      console.log(`   ❌ 查询失败: ${error}\n`);
    }

    // ==========================================
    // 示例 3: 获取泰诺（Tylenol）的警告信息
    // ==========================================
    console.log("⚡ 示例 3: 查询泰诺（Tylenol/对乙酰氨基酚）的警告信息");
    console.log("-".repeat(70));

    try {
      const result = await client.callTool({
        name: "get_drug_warnings",
        arguments: {
          drug_name: "acetaminophen", // 对乙酰氨基酚的通用名
          limit: 1,
        },
      });

      const content = (
        result.content as Array<{ type: string; text?: string }>
      )[0];
      if (content && content.type === "text" && content.text) {
        const data = JSON.parse(content.text);
        if (data.results && data.results.length > 0) {
          const drug = data.results[0];

          if (drug.warnings) {
            const warnings = drug.warnings[0].slice(0, 300);
            console.log(`✅ 警告信息:`);
            console.log(`   ${warnings}...`);
            console.log();
          } else {
            console.log("   ℹ️  未找到警告信息\n");
          }
        } else {
          console.log("   ❌ 未找到相关信息\n");
        }
      } else {
        console.log("   ❌ 未找到相关信息\n");
      }
    } catch (error) {
      console.log(`   ❌ 查询失败: ${error}\n`);
    }

    // ==========================================
    // 示例 4: 使用 RAG 管道进行药品安全分析
    // ==========================================
    console.log("🔍 示例 4: 使用 RAG 分析布洛芬的心血管副作用");
    console.log("-".repeat(70));

    try {
      const result = await client.callTool({
        name: "ae_pipeline_rag",
        arguments: {
          query: "cardiovascular side effects",
          drug: "ibuprofen",
          top_k: 3,
        },
      });

      const content = (
        result.content as Array<{ type: string; text?: string }>
      )[0];
      if (content && content.type === "text" && content.text) {
        const response = content.text;
        // 截取前 400 字符
        if (response.length > 400) {
          console.log(`✅ 分析结果:`);
          console.log(`   ${response.slice(0, 400)}...`);
          console.log(`   (完整结果有 ${response.length} 字符)`);
        } else {
          console.log(`✅ 分析结果:`);
          console.log(`   ${response}`);
        }
        console.log();
      }
    } catch (error) {
      console.log(`   ❌ 分析失败: ${error}\n`);
    }

    // ==========================================
    // 示例 5: 查询多个药品
    // ==========================================
    console.log("📊 示例 5: 批量查询常见止痛药");
    console.log("-".repeat(70));

    const drugs = ["aspirin", "ibuprofen", "naproxen"];

    for (const drugName of drugs) {
      try {
        const result = await client.callTool({
          name: "get_drug_indications",
          arguments: {
            drug_name: drugName,
            limit: 1,
          },
        });

        const content = (
          result.content as Array<{ type: string; text?: string }>
        )[0];
        if (content && content.type === "text" && content.text) {
          const data = JSON.parse(content.text);
          if (data.results && data.results.length > 0) {
            const drug = data.results[0];

            // 品牌名
            let brandNames = "未知";
            if (drug.openfda?.brand_name) {
              brandNames = drug.openfda.brand_name.slice(0, 2).join(", ");
            }

            console.log(
              `   • ${
                drugName.charAt(0).toUpperCase() + drugName.slice(1)
              }: ${brandNames}`
            );
          } else {
            console.log(
              `   • ${
                drugName.charAt(0).toUpperCase() + drugName.slice(1)
              }: (未找到)`
            );
          }
        }
      } catch (error) {
        console.log(
          `   • ${
            drugName.charAt(0).toUpperCase() + drugName.slice(1)
          }: (查询失败)`
        );
      }
    }

    console.log();
    console.log("✨ 所有查询完成！");

    // 关闭连接
    await client.close();
  } catch (error) {
    console.error(`\n❌ 错误: ${error}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    await queryOpenFda();
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

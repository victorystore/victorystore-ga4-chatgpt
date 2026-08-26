import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

interface Env {
  GA4_BACKEND: Fetcher;
}

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format");

async function getBackendData(
  env: Env,
  path: string,
  startDate: string,
  endDate: string
) {
  const url = new URL(`https://internal${path}`);

  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);

  const response = await env.GA4_BACKEND.fetch(
    new Request(url.toString())
  );

  if (!response.ok) {
    throw new Error(
      `GA4 backend returned ${response.status}: ${await response.text()}`
    );
  }

  return response.json();
}

function createServer(env: Env) {
  const server = new McpServer({
    name: "VictoryStore GA4",
    version: "1.0.0"
  });

  const commonInput = {
    startDate: dateSchema,
    endDate: dateSchema
  };

  server.registerTool(
    "get_ga4_summary",
    {
      description:
        "Get VictoryStore GA4 sessions, active users, engagement, ecommerce purchases, and purchase revenue for a date range.",
      inputSchema: commonInput
    },
    async ({ startDate, endDate }) => {
      const data = await getBackendData(
        env,
        "/test-ga4",
        startDate,
        endDate
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_landing_pages",
    {
      description:
        "Get VictoryStore GA4 landing-page performance including sessions, users, engagement, purchases, and purchase revenue.",
      inputSchema: commonInput
    },
    async ({ startDate, endDate }) => {
      const data = await getBackendData(
        env,
        "/landing-pages",
        startDate,
        endDate
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_channels",
    {
      description:
        "Get VictoryStore GA4 traffic and ecommerce performance by default channel group.",
      inputSchema: commonInput
    },
    async ({ startDate, endDate }) => {
      const data = await getBackendData(
        env,
        "/channels",
        startDate,
        endDate
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_countries",
    {
      description:
        "Get VictoryStore GA4 traffic and ecommerce performance by country. Useful for investigating suspicious or bot-like traffic.",
      inputSchema: commonInput
    },
    async ({ startDate, endDate }) => {
      const data = await getBackendData(
        env,
        "/countries",
        startDate,
        endDate
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_devices",
    {
      description:
        "Get VictoryStore GA4 traffic and ecommerce performance by device category.",
      inputSchema: commonInput
    },
    async ({ startDate, endDate }) => {
      const data = await getBackendData(
        env,
        "/devices",
        startDate,
        endDate
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_source_medium",
    {
      description:
        "Get VictoryStore GA4 traffic and ecommerce performance by session source and medium.",
      inputSchema: commonInput
    },
    async ({ startDate, endDate }) => {
      const data = await getBackendData(
        env,
        "/source-medium",
        startDate,
        endDate
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ]
      };
    }
  );

  return server;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "VictoryStore GA4 ChatGPT MCP",
        backendConfigured: Boolean(env.GA4_BACKEND)
      });
    }

    if (url.pathname === "/mcp") {
      return createMcpHandler(
        () => createServer(env)
      )(request, env, ctx);
    }

    return new Response(
      "VictoryStore GA4 MCP server. MCP endpoint: /mcp",
      {
        status: 200
      }
    );
  }
} satisfies ExportedHandler<Env>;

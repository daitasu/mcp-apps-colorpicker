import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

// Works both from source (server.ts) and compiled (dist/server.js)
const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;

/**
 * Creates a new MCP server instance with the color picker tool and resource.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "Color Picker MCP App",
    version: "1.0.0",
  });

  const resourceUri = "ui://color-picker/mcp-app.html";

  // Register the color picker tool
  registerAppTool(
    server,
    "color-picker",
    {
      title: "Color Picker",
      description:
        "Opens an interactive color picker UI. Optionally accepts an initial color.",
      inputSchema: {
        color: z
          .string()
          .optional()
          .describe(
            "Initial color in hex format (e.g. #ff0000). Defaults to #6366f1.",
          ),
      },
      outputSchema: z.object({
        color: z.string(),
      }),
      _meta: { ui: { resourceUri } },
    },
    async (args): Promise<CallToolResult> => {
      const color = args.color ?? "#6366f1";
      return {
        content: [{ type: "text", text: `Color picker opened with: ${color}` }],
        structuredContent: { color },
      };
    },
  );

  // Register the resource serving the bundled HTML UI
  registerAppResource(
    server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(
        path.join(DIST_DIR, "mcp-app.html"),
        "utf-8",
      );
      return {
        contents: [
          { uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },
        ],
      };
    },
  );

  return server;
}

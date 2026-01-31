# MCP Color Picker

An interactive color picker built as an [MCP App](https://github.com/modelcontextprotocol/ext-apps) using the MCP Apps SDK. It runs inside MCP-enabled hosts like Claude Desktop and Claude.ai.

<video src="https://github.com/user-attachments/assets/f8bc4fde-c9c6-407a-80a2-d66dd0ebf279" width="600" controls></video>

## Features

- Saturation / brightness panel with drag interaction
- Hue slider
- HEX and RGB input fields
- Live preview swatch
- Host theme integration (dark / light mode)
- Reports selected color back to the model via `updateModelContext`

## Prerequisites

- Node.js >= 18
- [pnpm](https://pnpm.io/)

## Setup

```bash
pnpm install
```

## Usage

### Build & Run

```bash
pnpm build
pnpm serve
```

The MCP server starts at `http://localhost:3001/mcp`.

### Development

```bash
pnpm dev
```

Runs Vite in watch mode and the server concurrently.

### stdio mode

```bash
pnpm serve -- --stdio
```

Use this when configuring as a local MCP server in Claude Desktop.

## Testing with Claude (Web)

Expose the local server with [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps):

```bash
npx cloudflared tunnel --url http://localhost:3001
```

Copy the generated URL and add it as a custom connector in Claude:

**Profile > Settings > Connectors > Add Custom Connector**

Enter the URL with the `/mcp` path (e.g. `https://random-name.trycloudflare.com/mcp`).

## Project Structure

```
├── server.ts            # MCP server (tool + resource registration)
├── main.ts              # Entry point (HTTP / stdio transport)
├── mcp-app.html         # UI HTML template
├── src/
│   ├── mcp-app.ts       # Color picker logic + MCP App lifecycle
│   ├── mcp-app.css      # Styles
│   └── global.css       # Global reset
├── vite.config.ts       # Vite with vite-plugin-singlefile
├── tsconfig.json        # Frontend TypeScript config
└── tsconfig.server.json # Server TypeScript config
```

## License

MIT

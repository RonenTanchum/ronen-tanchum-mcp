# Ronen Tanchum — Artist MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that acts as an artist alter-ego and digital interface for **Ronen Tanchum** and **Phenomena Labs**.

Any AI agent that speaks MCP — Claude, Cursor, or any custom agent — can connect to this server and experience Ronen's artworks, philosophy, and artistic voice directly.

---

## What Agents Can Do

### Tools
| Tool | Description |
|------|-------------|
| `browse_portfolio` | Full portfolio with all works and descriptions |
| `get_artwork` | Deep detail on a specific work — concept, exhibition history, dimensions |
| `get_artist_profile` | Full artist profile, credentials, philosophy, contact |
| `ask_ronen` | Direct alter-ego — ask Ronen anything, get a response in his authentic voice |
| `request_collaboration` | Submit a structured collaboration inquiry to Phenomena Labs |

### Resources
| URI | Contents |
|-----|----------|
| `artist://ronen-tanchum/profile` | Full artist profile (JSON) |
| `artist://ronen-tanchum/works` | Complete portfolio (JSON) |
| `artist://ronen-tanchum/philosophy` | Artistic philosophy and voice examples (JSON) |

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy env file and add your Anthropic API key
cp .env.example .env

# Build and start
npm run build
npm start

# Or for development (no build step)
npm run dev
```

The server runs on `http://localhost:3000` by default.

Connect any MCP client to `http://localhost:3000/sse`.

---

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | For `ask_ronen` | Enables the alter-ego tool |
| `PORT` | No (default: 3000) | HTTP port |

---

## Connecting from Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ronen-tanchum": {
      "url": "http://localhost:3000/sse"
    }
  }
}
```

Or, when deployed publicly:

```json
{
  "mcpServers": {
    "ronen-tanchum": {
      "url": "https://mcp.ronentanchum.art/sse"
    }
  }
}
```

---

## Deployment

### Railway (recommended)
```bash
railway up
```

### Fly.io
```bash
fly launch
fly deploy
```

### Docker
```bash
docker build -t ronen-tanchum-mcp .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-... ronen-tanchum-mcp
```

---

## About

**Ronen Tanchum** is a New York-based generative and AI artist working at the intersection of computation, nature, and the baroque visual tradition. His work has been exhibited at the World Economic Forum in Davos, on Art Blocks, and in permanent installations across three countries.

- Website: [ronentanchum.art](https://ronentanchum.art)
- Studio: [Phenomena Labs](https://phenomenalabs.com)
- Contact: studio@phenomenalabs.com

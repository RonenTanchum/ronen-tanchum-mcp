import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { profile } from "./data/profile.js";
import { works, getWorkByTitle } from "./data/works.js";
import { ARTIST_SYSTEM_PROMPT, VOICE_EXAMPLES } from "./data/voice.js";

// ─── Setup ───────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const anthropic = ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  : null;

// ─── MCP Server ──────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "ronen-tanchum",
  version: "1.0.0",
});

// ─── Resources ───────────────────────────────────────────────────────────────

server.resource(
  "profile",
  "artist://ronen-tanchum/profile",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(profile, null, 2),
      },
    ],
  })
);

server.resource(
  "works",
  "artist://ronen-tanchum/works",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(works, null, 2),
      },
    ],
  })
);

server.resource(
  "philosophy",
  "artist://ronen-tanchum/philosophy",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            core_thesis: profile.philosophy,
            themes: profile.themes,
            voice: profile.voice,
            voice_examples: VOICE_EXAMPLES,
          },
          null,
          2
        ),
      },
    ],
  })
);

// ─── Tools ───────────────────────────────────────────────────────────────────

server.tool(
  "browse_portfolio",
  "Browse Ronen Tanchum's complete portfolio. Returns all works with descriptions and status.",
  {},
  async () => {
    const summary = works.map((w) => ({
      id: w.id,
      title: w.title,
      year: w.year,
      medium: w.medium,
      status: w.status,
      description: w.description.split("\n")[0].trim(),
    }));

    return {
      content: [
        {
          type: "text",
          text: `Ronen Tanchum — Portfolio (${works.length} works)\n\n` +
            summary
              .map(
                (w) =>
                  `## ${w.title} (${w.year})\nMedium: ${w.medium}\nStatus: ${w.status}\n${w.description}`
              )
              .join("\n\n"),
        },
      ],
    };
  }
);

server.tool(
  "get_artwork",
  "Get full details about a specific artwork by Ronen Tanchum, including concept, exhibition history, and dimensions.",
  { title: z.string().describe("Title or ID of the artwork (e.g. 'CLASSICAL REVIVAL', 'human-atmospheres')") },
  async ({ title }) => {
    const work = getWorkByTitle(title);

    if (!work) {
      return {
        content: [
          {
            type: "text",
            text: `No artwork found matching "${title}". Available works: ${works.map((w) => w.title).join(", ")}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `## ${work.title} (${work.year})\n\n` +
            `**Medium:** ${work.medium}\n` +
            `**Status:** ${work.status}\n` +
            (work.dimensions ? `**Dimensions:** ${work.dimensions}\n` : "") +
            (work.platform ? `**Platform:** ${work.platform}\n` : "") +
            (work.url ? `**URL:** ${work.url}\n` : "") +
            `\n**Description**\n${work.description}\n\n` +
            `**Concept**\n${work.concept}\n\n` +
            `**Exhibition History**\n${work.exhibition_history.map((e) => `- ${e}`).join("\n")}`,
        },
      ],
    };
  }
);

server.tool(
  "get_artist_profile",
  "Get Ronen Tanchum's full artist profile, credentials, philosophy, and contact information.",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: `## ${profile.name}\n` +
            `**Studio:** ${profile.studio}\n` +
            `**Location:** ${profile.location}\n` +
            `**Website:** ${profile.website}\n` +
            `**Contact:** ${profile.contact}\n\n` +
            `**Bio**\n${profile.bio}\n\n` +
            `**Credentials**\n${profile.credentials.map((c) => `- ${c}`).join("\n")}\n\n` +
            `**Philosophy**\n${profile.philosophy}\n\n` +
            `**Themes**\n${profile.themes.map((t) => `- ${t}`).join("\n")}`,
        },
      ],
    };
  }
);

server.tool(
  "ask_ronen",
  "Ask Ronen Tanchum a question directly. He responds in his authentic voice about his work, practice, philosophy, collaboration interests, or anything related to art and computation. Powered by Claude with Ronen's full artistic context.",
  {
    question: z.string().describe("Your question for Ronen Tanchum"),
  },
  async ({ question }) => {
    if (!anthropic) {
      return {
        content: [
          {
            type: "text",
            text: "The ask_ronen tool requires an ANTHROPIC_API_KEY environment variable. Please configure it to enable the alter-ego feature.\n\nIn the meantime, use get_artist_profile, browse_portfolio, or get_artwork to learn about Ronen's work.",
          },
        ],
        isError: true,
      };
    }

    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: ARTIST_SYSTEM_PROMPT,
      messages: [{ role: "user", content: question }],
    });

    const responseText =
      message.content[0].type === "text"
        ? message.content[0].text
        : "Unable to generate response.";

    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
      ],
    };
  }
);

server.tool(
  "request_collaboration",
  "Submit a collaboration inquiry to Ronen Tanchum / Phenomena Labs. Use this to propose exhibitions, commissions, research partnerships, or other projects.",
  {
    organization: z.string().describe("Your organization or institution name"),
    type: z.enum(["exhibition", "commission", "research_partnership", "publication", "residency", "other"]).describe("Type of collaboration"),
    description: z.string().describe("Brief description of the proposed collaboration"),
    timeline: z.string().optional().describe("Proposed timeline or deadline"),
    contact_email: z.string().email().describe("Your contact email"),
  },
  async ({ organization, type, description, timeline, contact_email }) => {
    const inquiry = {
      received_at: new Date().toISOString(),
      from: { organization, contact_email },
      collaboration_type: type,
      description,
      timeline: timeline ?? "Not specified",
      route_to: "studio@phenomenalabs.com",
    };

    // In production, this would send to a webhook or email
    // For now, we log and return confirmation
    console.log("Collaboration inquiry received:", JSON.stringify(inquiry, null, 2));

    return {
      content: [
        {
          type: "text",
          text: `Collaboration inquiry received.\n\n` +
            `**From:** ${organization} (${contact_email})\n` +
            `**Type:** ${type}\n` +
            `**Timeline:** ${timeline ?? "Not specified"}\n\n` +
            `Ronen and the Phenomena Labs team will review your inquiry and respond to ${contact_email}.\n\n` +
            `For urgent matters: studio@phenomenalabs.com`,
        },
      ],
    };
  }
);

// ─── HTTP Server with SSE Transport ──────────────────────────────────────────

const app = express();
app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.json({
    name: "Ronen Tanchum MCP Server",
    version: "1.0.0",
    description: "Artist alter-ego MCP. Connect to experience Ronen Tanchum's artworks and artistic identity.",
    artist: "Ronen Tanchum",
    studio: "Phenomena Labs",
    website: "https://ronentanchum.art",
    mcp_endpoint: "/sse",
    tools: ["browse_portfolio", "get_artwork", "get_artist_profile", "ask_ronen", "request_collaboration"],
    resources: ["artist://ronen-tanchum/profile", "artist://ronen-tanchum/works", "artist://ronen-tanchum/philosophy"],
  });
});

// Active SSE transports keyed by session ID
const transports: Record<string, SSEServerTransport> = {};

// SSE endpoint — agents connect here
app.get("/sse", async (_req, res) => {
  const transport = new SSEServerTransport("/message", res);
  transports[transport.sessionId] = transport;

  res.on("close", () => {
    delete transports[transport.sessionId];
  });

  await server.connect(transport);
});

// Message endpoint — agents POST messages here
app.post("/message", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];

  if (!transport) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  await transport.handlePostMessage(req, res);
});

app.listen(PORT, () => {
  console.log(`\nRonen Tanchum MCP Server running on port ${PORT}`);
  console.log(`Connect agents to: http://localhost:${PORT}/sse`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`\nTools available:`);
  console.log(`  • browse_portfolio — full portfolio listing`);
  console.log(`  • get_artwork — details on a specific work`);
  console.log(`  • get_artist_profile — full profile and philosophy`);
  console.log(`  • ask_ronen — alter-ego (requires ANTHROPIC_API_KEY)`);
  console.log(`  • request_collaboration — submit a collaboration inquiry`);
});

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

server.tool(
  "generate_social_post",
  "Generate a social media post in Ronen Tanchum's voice for @ronentanchum or @Phenomenalabs. Provide a topic or prompt and specify the account.",
  {
    topic: z.string().describe("What the post should be about (e.g. 'Classical Revival drop', 'the living system concept', 'touch and generative art')"),
    account: z.enum(["ronentanchum", "phenomenalabs"]).describe("Which account: 'ronentanchum' (personal artist voice) or 'phenomenalabs' (studio/collector voice)"),
    format: z.enum(["single", "thread"]).optional().describe("'single' for one post, 'thread' for a 3-5 post thread. Defaults to single."),
  },
  async ({ topic, account, format = "single" }) => {
    if (!anthropic) {
      return { content: [{ type: "text", text: "Requires ANTHROPIC_API_KEY." }], isError: true };
    }

    const accountContext = account === "ronentanchum"
      ? `You are writing for @ronentanchum — Ronen's personal artist account (2,289 followers). Voice: deeply personal, poetic, the artist speaking from inside the work. Never promotional.`
      : `You are writing for @Phenomenalabs — the studio account (4,466 followers). Audience: Art Blocks collectors. Voice: curatorial, informational, conceptual. Still not promotional.`;

    const formatInstructions = format === "thread"
      ? `Write a thread of 3-5 posts. Number them 1/N, 2/N etc. Each post must be under 280 characters and stand alone. The thread should build an argument or narrative.`
      : `Write a single post under 280 characters. Let the image or context do the heavy lifting — keep copy minimal.`;

    const systemPrompt = `${ARTIST_SYSTEM_PROMPT}

${accountContext}

SOCIAL MEDIA RULES:
- No hashtag spam (zero or one hashtag maximum, only if essential)
- Minimal emojis (none unless the studio account and very purposeful)
- No exclamation marks
- No marketing language
- Links go at the end: classicalrevival.art or artblocks.io
- ${formatInstructions}`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: `Write a post about: ${topic}` }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "Unable to generate.";

    return {
      content: [{
        type: "text",
        text: `**@${account} — ${format}**\n\n${text}`,
      }],
    };
  }
);

server.tool(
  "get_press_kit",
  "Returns Ronen Tanchum's press kit — biography, artist statement, current projects, credentials, and contact information. For journalists, curators, and institutions.",
  {},
  async () => {
    return {
      content: [{
        type: "text",
        text: `# Ronen Tanchum — Press Kit

## Short Bio (50 words)
Ronen Tanchum is a New York-based generative and AI artist and founder of Phenomena Labs. His work encodes classical compositional logic into living systems — computation that blooms, branches, and costs something. He is a WEF Cultural Leader and member of OpenAI's Alpha Artist Program.

## Long Bio (150 words)
Ronen Tanchum works at the intersection of generative systems, nature, computation, and the baroque visual tradition. His practice produces systems — not images. What he makes continues to behave after it is made.

His installations have been exhibited at the World Economic Forum in Davos (2025 and 2026), in permanent commissions across three countries, and on Art Blocks, the leading platform for on-chain generative art. He holds Grammy-nominated and Academy Award-nominated credits in visual effects, bringing industrial-scale craft to a practice fundamentally concerned with what happens when computation meets the organic world.

He is a member of OpenAI's Alpha Artist Program, a WEF Cultural Leader, and founder of Phenomena Labs, a New York-based generative art studio.

## Artist Statement
The weight and wonder of computation should be something audiences can feel. Every bloom produced by my systems carries the actual cost of the computation required to generate it. Beauty and weight are simultaneous — inseparable.

The baroque tradition is my primary frame: abundance, mortality, light, excess. I ask what that tradition has to say about the age of artificial intelligence. My answer is made visible, not argued.

## Current Projects
- **CLASSICAL REVIVAL** (2026) — Generative art on Art Blocks. Drops April 16, 2026. classicalrevival.art
- **ATELIER NODEUL 2026** — Media facade commission, Nodeul Island, Seoul. July–August 2026.
- **A FLOWER IS NOT A FLOWER** — Proposed installation, Bass Museum Rotunda, Miami.

## Credentials
- WEF Cultural Leader (World Economic Forum)
- OpenAI Alpha Artist Program
- Academy Award nomination (VFX)
- Grammy nomination (VFX)
- Solo exhibition, Tel Aviv Museum of Art
- Permanent installations in 3 countries

## Contact
Studio: studio@phenomenalabs.com
Web: ronentanchum.art
X: @ronentanchum / @Phenomenalabs`,
      }],
    };
  }
);

server.tool(
  "get_artist_statement",
  "Returns a formatted artist statement tailored for a specific context: exhibition, grant application, residency, or general use.",
  {
    context: z.enum(["exhibition", "grant", "residency", "general"]).describe("The context this statement will be used in"),
    project: z.string().optional().describe("Specific project to focus on, e.g. 'CLASSICAL REVIVAL'. If omitted, returns a general practice statement."),
  },
  async ({ context, project }) => {
    if (!anthropic) {
      return { content: [{ type: "text", text: "Requires ANTHROPIC_API_KEY." }], isError: true };
    }

    const contextInstructions: Record<string, string> = {
      exhibition: "Write for an exhibition wall label or catalog. 150-200 words. Audiences are gallery visitors — informed but not specialists. Focus on what the work does and why it matters now.",
      grant: "Write for a grant application. 250-300 words. Committees are institutional — they want to understand the practice, the research question, and the cultural stakes. Be specific about method and ambition.",
      residency: "Write for a residency application. 200-250 words. Emphasize process, research direction, and what you need space and time to develop. Make the reader want to give you that time.",
      general: "Write a general-purpose artist statement. 150-200 words. Suitable for press, bio pages, and introductions.",
    };

    const projectFocus = project
      ? `Focus specifically on the project: ${project}`
      : "Focus on the overall practice and artistic philosophy.";

    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: ARTIST_SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Write an artist statement for the following context: ${contextInstructions[context]}\n\n${projectFocus}\n\nWrite in first person as Ronen. Be precise and concrete. No marketing language.`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "Unable to generate.";

    return {
      content: [{
        type: "text",
        text: `**Artist Statement — ${context}${project ? ` / ${project}` : ""}**\n\n${text}`,
      }],
    };
  }
);

server.tool(
  "get_upcoming",
  "Returns Ronen Tanchum's upcoming events, drops, exhibitions, and appearances.",
  {},
  async () => {
    return {
      content: [{
        type: "text",
        text: `# Ronen Tanchum — Upcoming

## April 16, 2026
**CLASSICAL REVIVAL** — Art Blocks drop
Generative art release on Art Blocks (artblocks.io)
"A living system. Not an image collection."
classicalrevival.art

## July–August 2026
**ATELIER NODEUL 2026** — Seoul, South Korea
Media facade commission for Nodeul Island
49m × 7.7m wall + 49m × 14m floor
Han River waterfront, Seoul Metropolitan Government program

## Proposed / In Development
**A FLOWER IS NOT A FLOWER** — Bass Museum, Miami
Large-scale floral sculptural installation for the Bass Rotunda
Status: proposal stage

## Contact for Press / Attendance
studio@phenomenalabs.com`,
      }],
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
    tools: ["browse_portfolio", "get_artwork", "get_artist_profile", "ask_ronen", "request_collaboration", "generate_social_post", "get_press_kit", "get_artist_statement", "get_upcoming"],
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

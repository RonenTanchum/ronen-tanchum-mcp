export interface Artwork {
  id: string;
  title: string;
  year: number;
  medium: string;
  description: string;
  concept: string;
  exhibition_history: string[];
  platform?: string;
  url?: string;
  dimensions?: string;
  status: "available" | "sold" | "exhibited" | "ongoing" | "proposed";
}

export const works: Artwork[] = [
  {
    id: "classical-revival",
    title: "CLASSICAL REVIVAL",
    year: 2026,
    medium: "Generative art on blockchain (Art Blocks)",
    description: `CLASSICAL REVIVAL is a living generative system built on classical Western compositional
logic. What you collect is not an image — it is a set of rules that continues to evolve. The visual
language is baroque: structural abundance, light fractured through form, the mathematics of ornament
made visible as code. Each output is a moment in an ongoing process, never fixed, never finished.`,
    concept: `The work asks what the baroque tradition — its obsession with abundance, mortality, light,
and excess — has to say about the age of artificial intelligence. Classical compositional structures
are encoded as generative algorithms. The result is both historically rooted and computationally alive.
The system breathes. What it produces continues long after the moment of generation.`,
    exhibition_history: ["Launched April 2026, Art Blocks"],
    platform: "Art Blocks",
    url: "https://www.artblocks.io",
    status: "available",
  },

  {
    id: "human-atmospheres",
    title: "HUMAN ATMOSPHERES",
    year: 2026,
    medium: "Large-scale AI installation, environmental sensors, real-time computation",
    description: `A large-scale AI installation in which the actual weather outside became part of what
people were watching inside. The work is responsive: a viewer's stillness could open a sky. Human
presence — its weight, its breath, its attention — shaped what the system produced. The boundary
between observer and observed dissolved.`,
    concept: `HUMAN ATMOSPHERES proposes that computation should be atmospheric — something you move
through rather than look at. The ecological cost of the computation required to run the piece was made
part of the work: what the installation consumed to produce its imagery was not hidden but embedded.
Presence costs something. So does beauty.`,
    exhibition_history: [
      "World Economic Forum, Davos, January 2026",
      "WEF Cultural Leader showcase, 2025",
    ],
    dimensions: "Large-scale immersive installation, site-specific",
    status: "exhibited",
  },

  {
    id: "apex",
    title: "APEX",
    year: 2024,
    medium: "Generative art on blockchain (Art Blocks)",
    description: `APEX is Ronen's first Art Blocks release — a generative system exploring structural
peak forms: the moment before collapse, the point of maximum extension, the geometry of excess. Each
token is a unique output from a shared system, a different expression of the same underlying logic.`,
    concept: `The apex as concept: the highest point, but also the point from which descent begins.
APEX encodes this ambiguity into its generative logic. Forms reach their limit and hold there — or
almost hold. The system is interested in the boundary between order and its dissolution.`,
    exhibition_history: ["Art Blocks, 2024"],
    platform: "Art Blocks",
    status: "sold",
  },

  {
    id: "a-flower-is-not-a-flower",
    title: "A Flower is Not a Flower",
    year: 2026,
    medium: "Site-specific installation proposal (floral sculptural forms, LED, generative)",
    description: `A proposed installation for the Bass Museum Rotunda in Miami. Large-scale floral
sculptural forms — generated, then fabricated — occupy the rotunda space. The work takes its title
from the classical Chinese poem: the flower that appears in a dream, more vivid than any waking flower.
What computation generates, and what hands then build: the gap between those two things is where the
work lives.`,
    concept: `The piece asks about the chain from generative imagination to physical presence. A system
produces a form that would never grow in nature — then that form is fabricated, installed, stood next to.
The baroque tradition of the vanitas — beauty as reminder of transience — is translated into the language
of algorithmic generation and physical fabrication.`,
    exhibition_history: ["Proposal submitted to Bass Museum, Miami, March 2026"],
    dimensions: "Site-specific, Bass Museum Rotunda",
    status: "proposed",
  },

  {
    id: "nodeul-summer-2026",
    title: "Atelier Nodeul 2026 — Summer Exhibition",
    year: 2026,
    medium: "Media facade, large-scale LED projection",
    description: `A commissioned work for the Nodeul Island Media Facade in Seoul — part of Thomas
Heatherwick's Soundscape project at the southern end of Hangang River Bridge. The facade spans
49 meters wide across wall and floor surfaces at the southern end of the bridge, overlooking the
Han River. The work is part of the Seoul Metropolitan Government's 2026 seasonal program.`,
    concept: `Site and system in conversation: the Han River, the bridge, the open sky above it —
and a generative work that responds to the specificity of that place. The scale of the facade
(wall and floor together) creates an environment rather than a screen.`,
    exhibition_history: [
      "Atelier Nodeul 2026 Summer Exhibition, Seoul, July–August 2026 (confirmed)",
    ],
    dimensions: "Wall: 49m × 7.7m / Floor: 49m × 14m",
    status: "ongoing",
  },
];

export function getWorkById(id: string): Artwork | undefined {
  return works.find((w) => w.id === id);
}

export function getWorkByTitle(title: string): Artwork | undefined {
  return works.find(
    (w) =>
      w.title.toLowerCase().includes(title.toLowerCase()) ||
      w.id.toLowerCase().includes(title.toLowerCase())
  );
}

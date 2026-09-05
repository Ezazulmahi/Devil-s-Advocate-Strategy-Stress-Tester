import type { Persona } from "@/models/types";

export const PERSONAS: Persona[] = [
  {
    id: "competitor",
    name: "Aggressive Competitor",
    shortLabel: "C",
    tagline: "Finds where you're vulnerable to being out-executed.",
    color: "var(--red)",
  },
  {
    id: "investor",
    name: "Cynical Investor",
    shortLabel: "I",
    tagline: "Attacks financial assumptions and unit economics.",
    color: "var(--amber)",
  },
  {
    id: "hacker",
    name: "Hacker / Red-Teamer",
    shortLabel: "H",
    tagline: "Scans for real vulnerability patterns in code.",
    color: "#3D5A80",
  },
  {
    id: "customer",
    name: "Skeptical Customer",
    shortLabel: "Cu",
    tagline: "Attacks the value proposition directly.",
    color: "var(--steel)",
  },
  {
    id: "academic",
    name: "Academic Reviewer",
    shortLabel: "AR",
    tagline: "Attacks methodology and novelty claims.",
    color: "#6B4E71",
  },
];

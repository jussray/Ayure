import type { CatalogEntity } from "./types";

export const catalog: CatalogEntity[] = [
  {
    id: "example-property-pittsburgh-01",
    kind: "property",
    title: "Hillside Stay Opportunity",
    subtitle: "Example STR-ready acquisition",
    location: "Pittsburgh, PA",
    price: 184000,
    intents: ["buy", "invest", "explore"],
    tags: ["short-term rental", "investment", "3 bed", "city access"],
    proof: "example",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    example: true,
  },
  {
    id: "example-pro-operator-01",
    kind: "professional",
    title: "North & Pine Stays",
    subtitle: "Example short-term rental operator",
    location: "Western Pennsylvania",
    services: ["operations", "listing setup", "guest experience", "revenue management"],
    intents: ["find_operator", "transform", "invest", "explore"],
    tags: ["operator", "property management", "airbnb", "short-term rental"],
    proof: "example",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80",
    example: true,
  },
  {
    id: "example-service-transform-01",
    kind: "service",
    title: "Stay Transformation Studio",
    subtitle: "Example design + listing transformation service",
    location: "Remote + Mid-Atlantic",
    services: ["interior direction", "listing audit", "photo plan", "launch strategy"],
    intents: ["transform", "find_operator", "explore"],
    tags: ["design", "renovation", "listing", "hospitality"],
    proof: "example",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
    example: true,
  },
  {
    id: "example-opportunity-owner-01",
    kind: "opportunity",
    title: "Owner Seeking Operating Partner",
    subtitle: "Example connection opportunity",
    location: "Johnstown, PA",
    intents: ["offer_services", "find_operator", "explore"],
    tags: ["operator wanted", "owner", "hospitality", "partnership"],
    proof: "example",
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
    example: true,
  },
];

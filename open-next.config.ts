import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// `npm run build` IS the OpenNext build (Workers Builds runs it), so OpenNext must
// not call `npm run build` back — that recurses. It builds Next via `build:next`.
export default {
  ...defineCloudflareConfig(),
  buildCommand: "npm run build:next",
};

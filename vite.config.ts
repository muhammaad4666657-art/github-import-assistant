// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact,
// tailwindcss, tsConfigPaths, componentTagger (dev-only), VITE_* env injection,
// @ path alias, React/TanStack dedupe, and error logger plugins.
// This project targets standard Node.js / Vercel — no Cloudflare Workers runtime.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

export default defineConfig({
  plugins: [mcpPlugin(), nitro({ preset: "vercel" })],
  tanstackStart: {
    server: { entry: "server" },
  },
});

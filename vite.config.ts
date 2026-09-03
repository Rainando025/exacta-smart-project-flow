// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig({
  vite: {
    plugins: [
      nitro({
        preset: "vercel",
      }),
    ],
    build: {
      target: "es2022",
      chunkSizeWarningLimit: 2000,
    },
    esbuild: {
      target: "es2022",
    },
  },
  cloudflare:
    process.env.VERCEL === "1" ||
    process.env.NITRO_PRESET === "vercel" ||
    process.env.SERVER_PRESET === "vercel"
      ? false
      : undefined,
});

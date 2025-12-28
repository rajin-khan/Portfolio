import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  site: 'https://rajinkhan.com',
  output: 'hybrid', // Enable API routes while keeping static pages
  adapter: vercel(),
  integrations: [tailwind(), sitemap(), react()],
  vite: {
    ssr: {
      noExternal: ['react', 'react-dom', '@astrojs/react'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  },
});
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://rajinkhan.com',
  output: 'hybrid', // Enable API routes while keeping static pages
  integrations: [tailwind(), sitemap(), react()],
});
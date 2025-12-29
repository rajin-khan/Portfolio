import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
    site: 'https://rajinkhan.com',
    output: 'static', // Static by default, API routes work automatically with Vercel adapter
    adapter: vercel(),
    integrations: [tailwind(), sitemap(), react()],
});
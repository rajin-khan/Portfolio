import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

function improveMarkdownImages() {
  return (tree) => {
    let imageIndex = 0;

    const visit = (node) => {
      if (node.type === "element" && node.tagName === "img") {
        node.properties ||= {};
        node.properties.decoding = "async";
        node.properties.loading = imageIndex === 0 ? "eager" : "lazy";
        if (imageIndex === 0) node.properties.fetchPriority = "high";
        imageIndex += 1;
      }

      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  site: "https://rajinkhan.com",
  output: "static",
  adapter: vercel(),
  integrations: [tailwind(), sitemap(), react()],
  markdown: {
    rehypePlugins: [improveMarkdownImages],
  },
});

// tailwind.config.mjs

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: "class", // Keep your darkMode setting
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"], // Keep your content setting
	theme: {
		extend: {}, // Keep your theme extensions
	},
	plugins: [
        require("@tailwindcss/typography") // Keep your plugins
    ],
    safelist: [ // --- ADDED SAFELIST SECTION ---
        {
            // Base gradient direction class
            pattern: /bg-gradient-to-r/,
        },
        {
            // Pattern matching all 'from-' colors and shades used in projects.json
            // Colors: green, blue, pink, indigo
            // Shades: 400, 500, 600 (include 600 just in case, though only 400/500 seen)
            pattern: /from-(green|blue|pink|indigo)-(400|500|600)/,
        },
        {
            // Pattern matching all 'to-' colors and shades used in projects.json
            // Colors: yellow, blue, purple, orange
            // Shades: 600
            pattern: /to-(yellow|blue|purple|orange)-(600)/,
        }
    ], // --- END SAFELIST SECTION ---
};
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Satoshi",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      fontWeight: {
        thin: "200",
        extralight: "300",
        light: "400",
        normal: "500",
        medium: "600",
        semibold: "700",
        bold: "800",
        extrabold: "900",
        black: "900",
      },
      typography: {
        DEFAULT: {
          css: {
            fontWeight: "500",
            a: { fontWeight: "600" },
            strong: { fontWeight: "700" },
            "ol > li::marker": { fontWeight: "500" },
            dt: { fontWeight: "700" },
            blockquote: { fontWeight: "600" },
            h1: { fontWeight: "900" },
            "h1 strong": { fontWeight: "900" },
            h2: { fontWeight: "800" },
            "h2 strong": { fontWeight: "900" },
            h3: { fontWeight: "700" },
            "h3 strong": { fontWeight: "800" },
            h4: { fontWeight: "700" },
            "h4 strong": { fontWeight: "800" },
            kbd: { fontWeight: "600" },
            code: { fontWeight: "700" },
            pre: { fontWeight: "500" },
            "thead th": { fontWeight: "700" },
          },
        },
      },
    },
  },
  plugins: [typography],
};

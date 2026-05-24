import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        text: {
          primary: "oklch(0.20 0 0)",
          secondary: "oklch(0.40 0 0)",
          muted: "oklch(0.55 0 0)",
        },
      },
    },
  },
  plugins: [],
};

export default config;

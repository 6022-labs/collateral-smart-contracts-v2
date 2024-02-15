/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "rgb(42,45,60)",
        secondary: "rgb(56,61,81)",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: "rgb(42,45,60)",
        secondary: "rgb(56,61,81)",
      },
      keyframes: {
        "fade-in-down": {
          "0%": {
            opacity: "0",
            transform: "translateY(50px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "scale-out": {
          "0%": {
            opacity: "1",
            transform: "scale(1)",
          },
          "100%": {
            opacity: "0",
            transform: "scale(0.75)",
          },
        },
      },
      animation: {
        "scale-out": "scale-out 0.3s ease-in-out",
        "fade-in-down": "fade-in-down 0.5s ease-in-out",
      },
      minWidth: {
        lg: "32rem",
        "90-screen": "90vw",
      },
      maxHeight: {
        120: "30rem",
        "4/5-screen": "80vh",
      },
      fontSize: {
        xxs: ["0.625rem", "0.875rem"],
      },
    },
  },
  plugins: [],
};

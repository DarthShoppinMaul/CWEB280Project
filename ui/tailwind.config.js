/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                bg: "#0A192F",
                panel: "#112240",
                text: "#E6F1FF",
                sub: "#B6C6DA",
                accent: "#64FFDA",
                muted: "#233554",
                line: "#1b355e",
                danger: "#FF6B6B"
            },
            borderRadius: { xl2: "16px" },
            boxShadow: { card: "0 6px 30px rgba(0,0,0,.25)" }
        }
    },
    plugins: []
};

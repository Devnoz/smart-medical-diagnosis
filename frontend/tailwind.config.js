/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          light: '#60a5fa',  // blue-400
          dark: '#1e40af',   // blue-800
        },
        secondary: '#14b8a6', // teal-500
        tertiary: '#fbbf24',  // amber-400
        success: '#22c55e',   // green-500
        info: '#f59e42',      // orange-400
        error: '#ef4444',     // red-500
        bg1: '#f8fafc',       // slate-50
        bg2: '#f1f5f9',       // slate-100
      },
      boxShadow: {
        'card': '0 4px 32px 0 rgba(37,99,235,0.08)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        bounceOnce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in',
        bounceOnce: 'bounceOnce 0.5s',
      },
    },
    fontFamily: {
      sans: ['Inter', 'Poppins', 'Roboto', 'sans-serif'],
    },
  },
  plugins: [],
};

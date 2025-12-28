/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'museum-bg': '#FAFAF9',       // Warm off-white background
        'museum-surface': '#FFFFFF',  // Pure white cards
        'museum-text': '#1C1917',     // Soft black text
        'museum-muted': '#78716C',    // Muted gray text
        'museum-gold': '#C5A059',     // Elegant accent
        'museum-stone': '#E7E5E4',    // Borders
      },
      fontFamily: {
        'serif': ['"Playfair Display"', 'serif'],   // Headings
        'sans': ['"Inter"', 'sans-serif'],          // Body
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
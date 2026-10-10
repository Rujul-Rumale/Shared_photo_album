/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sa-bg': '#f8f4ea',
        'sa-bg-dark': '#f0e9dd',
        'sa-card': '#fffdf9',
        'sa-card-hover': '#f8f4ea',
        'sa-accent': '#bd532b',
        'sa-accent-hover': '#a64522',
        'sa-gold': '#c98a1e',
        'sa-text': '#2b2623',
        'sa-text-muted': '#6e6359',
        'sa-text-dim': '#786c62',
        'sa-polaroid': '#fffdf9',
        'sa-polaroid-text': '#2b2623',
        'sa-border': '#e6dfd3',
        'sa-sage': '#6b7f6a',
      },
      fontFamily: {
        'serif-title': ['Fraunces', 'Georgia', 'serif'],
        'handwriting': ['Kalam', 'cursive'],
        'scribble': ['Caveat', 'cursive'],
        'sans': ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'polaroid-tilt': 'polaroidTilt 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        polaroidTilt: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '100%': { transform: 'rotate(var(--tw-rotate)) scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
}
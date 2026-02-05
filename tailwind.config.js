/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './resources/views/**/*.blade.php',
  './resources/js/**/*.{js,jsx,ts,tsx,vue}',
],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#2566B0',
        'secondary': '#3B9ED8',
        'accent': '#F7F7FC',
        'dark': '#000000',
        'dark-bg': '#0F0F23',
        'dark-surface': '#1A1A2E',
        'dark-card': '#16213E',
        'dark-border': '#2A2A4A',
        'dark-text': '#E2E8F0',
        'dark-text-secondary': '#94A3B8',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderColor: {
        border: 'hsl(var(--border) / <alpha-value>)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        'glow': '0 0 20px rgba(59, 158, 216, 0.4)',
        'glow-primary': '0 0 30px rgba(37, 102, 176, 0.5)',
        'glow-dark': '0 0 30px rgba(59, 158, 216, 0.3)',
        'metallic': '0 4px 20px rgba(247, 247, 252, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        'metallic-dark': '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      backdropBlur: {
        'glass': '10px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2566B0 0%, #3B9ED8 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #3B9ED8 0%, #F7F7FC 100%)',
        'gradient-dark': 'linear-gradient(135deg, #000000 0%, #2566B0 100%)',
        'gradient-light': 'linear-gradient(135deg, #F7F7FC 0%, #ffffff 50%, #F7F7FC 100%)',
        'gradient-metallic': 'linear-gradient(145deg, #F7F7FC 0%, #ffffff 15%, #F7F7FC 30%, #e8e8f0 45%, #F7F7FC 60%, #ffffff 75%, #F7F7FC 90%, #f0f0f8 100%)',
        'gradient-metallic-dark': 'linear-gradient(145deg, #1A1A2E 0%, #16213E 15%, #1A1A2E 30%, #0F0F23 45%, #1A1A2E 60%, #16213E 75%, #1A1A2E 90%, #0F0F23 100%)',
        'gradient-dark-bg': 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-gray-300': {
          'scrollbar-color': '#d1d5db transparent',
        },
        '.scrollbar-thumb-gray-600': {
          'scrollbar-color': '#4b5563 transparent',
        },
        '.scrollbar-track-gray-100': {
          'scrollbar-track-color': '#f3f4f6',
        },
        '.scrollbar-track-gray-800': {
          'scrollbar-track-color': '#1f2937',
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          background: '#f3f4f6',
          'border-radius': '4px',
        },
        '.dark .scrollbar-thin::-webkit-scrollbar-track': {
          background: '#1f2937',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb': {
          background: '#d1d5db',
          'border-radius': '4px',
        },
        '.dark .scrollbar-thin::-webkit-scrollbar-thumb': {
          background: '#4b5563',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          background: '#9ca3af',
        },
        '.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          background: '#6b7280',
        },
      }
      addUtilities(newUtilities)
    }
  ],
};
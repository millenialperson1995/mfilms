/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Garanta que jsx/tsx estão aqui
  ],
  theme: {
    extend: {
      colors: {
        'primary-color': '#3b82f6',
        'primary-hover': '#2563eb',
        'secondary-color': '#10b981',
        'secondary-hover': '#059669',
        'danger-color': '#ef4444',
        'danger-hover': '#dc2626',
        'warning-color': '#f59e0b',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

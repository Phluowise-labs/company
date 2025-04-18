module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0099ff',
        dark: '#1a1a2e',
        light: '#f5f5f7',
        success: '#28a745',
        warning: '#ffc107'
      },
      animation: {
        'pulse-slow': 'pulse 2s infinite',
      },
    },
  },
  plugins: [],
};
